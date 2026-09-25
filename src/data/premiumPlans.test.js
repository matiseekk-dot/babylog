import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../sentry', () => ({ addBreadcrumb: vi.fn() }))

import { getPlans } from './premiumPlans'
import { fetchStorePrices, loadCachedStorePrices } from './storePrices'

const GBP = {
  spokojny_rodzic_premium_monthly:  { priceString: '£2.99',  price: 2.99,  currencyCode: 'GBP' },
  spokojny_rodzic_premium_yearly:   { priceString: '£19.99', price: 19.99, currencyCode: 'GBP' },
  spokojny_rodzic_premium_lifetime: { priceString: '£39.99', price: 39.99, currencyCode: 'GBP' },
}

const byId = plans => Object.fromEntries(plans.map(p => [p.id, p]))

describe('getPlans z cenami z Google Play', () => {
  it('bez cen ze sklepu — ceny statyczne', () => {
    const p = byId(getPlans('pl'))
    expect(p.yearly.price).toBe('119 zł')
    expect(p.yearly.perMonth).toBe('9,92 zł')
  })

  it('ceny ze sklepu nadpisują ceny i przeliczają kwoty pochodne', () => {
    const p = byId(getPlans('en', GBP))
    expect(p.monthly.price).toBe('£2.99')
    expect(p.lifetime.price).toBe('£39.99')
    expect(p.yearly.price).toBe('£19.99')
    expect(p.yearly.perMonth).toBe('£1.67')        // 19,99 / 12
    expect(p.yearly.perPersonMonth).toBe('£0.83')  // 19,99 / 24
    expect(p.yearly.badge).toMatch(/44%/)          // 1 − 19,99 / (2,99 × 12)
    expect(p.lifetime.oneTime).toBe(true)
  })

  it('brak któregoś produktu albo różne waluty — zostają ceny statyczne', () => {
    const { spokojny_rodzic_premium_lifetime, ...partial } = GBP
    expect(byId(getPlans('pl', partial)).yearly.price).toBe('119 zł')
    const mixed = { ...GBP, spokojny_rodzic_premium_lifetime: { priceString: '$49.99', price: 49.99, currencyCode: 'USD' } }
    expect(byId(getPlans('pl', mixed)).yearly.price).toBe('119 zł')
  })
})

describe('fetchStorePrices', () => {
  beforeEach(() => localStorage.clear())

  it('mapuje identyfikatory "produkt:basePlan" i zapisuje cache', async () => {
    const Purchases = {
      getProducts: vi.fn(async ({ type }) => ({
        products: type === 'SUBSCRIPTION'
          ? [
              { identifier: 'spokojny_rodzic_premium_monthly:monthly', priceString: '£2.99', price: 2.99, currencyCode: 'GBP' },
              { identifier: 'spokojny_rodzic_premium_yearly:yearly',   priceString: '£19.99', price: 19.99, currencyCode: 'GBP' },
            ]
          : [{ identifier: 'spokojny_rodzic_premium_lifetime', priceString: '£39.99', price: 39.99, currencyCode: 'GBP' }],
      })),
    }
    const map = await fetchStorePrices(Purchases)
    expect(map).toEqual(GBP)
    expect(loadCachedStorePrices()).toEqual(GBP)
  })

  it('pusta odpowiedź sklepu — null, cache bez zmian', async () => {
    const Purchases = { getProducts: vi.fn(async () => ({ products: [] })) }
    expect(await fetchStorePrices(Purchases)).toBeNull()
    expect(loadCachedStorePrices()).toBeNull()
  })
})
