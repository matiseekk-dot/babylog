import { getPlans } from './premiumPlans'
import { addBreadcrumb } from '../sentry'

/**
 * Ceny z Google Play przez RevenueCat (v2.16.2).
 *
 * Pobierane raz po Purchases.configure() (App.jsx — tylko natywnie i dla
 * zalogowanych, bo gość nie ma skonfigurowanego RC). Zapisywane w
 * localStorage, żeby paywall przy następnym starcie od razu miał właściwą
 * walutę, także offline. Format: { [productId]: { priceString, price, currencyCode } }.
 */

const CACHE_KEY = 'babylog_store_prices'

export function loadCachedStorePrices() {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return v && typeof v === 'object' ? v : null
  } catch { return null }
}

/**
 * @param Purchases — moduł z @revenuecat/purchases-capacitor (już skonfigurowany)
 * @returns mapa cen albo null, gdy sklep nic nie zwrócił
 */
export async function fetchStorePrices(Purchases) {
  const plans = getPlans('en')
  const subs = plans.filter(p => !p.oneTime).map(p => p.productId)
  const once = plans.filter(p => p.oneTime).map(p => p.productId)

  const [s, o] = await Promise.all([
    Purchases.getProducts({ productIdentifiers: subs, type: 'SUBSCRIPTION' }),
    Purchases.getProducts({ productIdentifiers: once, type: 'NON_SUBSCRIPTION' }),
  ])

  // Subskrypcje Google mają identyfikator "produkt:basePlan". Bierzemy
  // pierwszy wynik na produkt — ten sam, który kupuje handleActivate (products[0]).
  const map = {}
  for (const p of [...(s?.products || []), ...(o?.products || [])]) {
    const id = String(p.identifier || '').split(':')[0]
    if (id && !map[id] && p.priceString) {
      map[id] = { priceString: p.priceString, price: p.price, currencyCode: p.currencyCode }
    }
  }
  if (Object.keys(map).length === 0) return null

  try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)) } catch {}
  addBreadcrumb('purchase', 'store-prices-loaded', {
    currency: Object.values(map)[0]?.currencyCode, count: Object.keys(map).length,
  })
  return map
}
