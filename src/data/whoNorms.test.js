/**
 * Testy modułu WHO percentyli
 *
 * Chronią przed sytuacją w której zmiana w kodzie spowoduje błędne wyliczenie
 * percentyla dziecka — co mogłoby zaalarmować rodzica bez powodu lub
 * (gorzej) NIE zaalarmować gdy dziecko jest poniżej P3.
 */

import { describe, test, expect } from 'vitest'
import { getWhoPercentiles, calculatePercentile, interpretPercentile } from './whoNorms'

describe('getWhoPercentiles', () => {
  test('waga chłopca 12 mies. — zwraca 5 percentyli', () => {
    const p = getWhoPercentiles('weight', 'M', 12)
    expect(p).not.toBeNull()
    expect(p.P3).toBeCloseTo(7.7, 1)
    expect(p.P50).toBeCloseTo(9.6, 1)
    expect(p.P97).toBeCloseTo(11.8, 1)
  })

  test('waga dziewczynki 12 mies. — inne wartości niż chłopca', () => {
    const pBoys = getWhoPercentiles('weight', 'M', 12)
    const pGirls = getWhoPercentiles('weight', 'F', 12)
    expect(pGirls.P50).not.toBe(pBoys.P50)
    expect(pGirls.P50).toBeCloseTo(8.9, 1)
  })

  test('wzrost chłopca 6 mies. — poprawne wartości', () => {
    const p = getWhoPercentiles('height', 'M', 6)
    expect(p).not.toBeNull()
    expect(p.P50).toBeCloseTo(67.6, 1)
  })

  test('obwód głowy dziewczynki 3 mies.', () => {
    const p = getWhoPercentiles('head', 'F', 3)
    expect(p).not.toBeNull()
    expect(p.P50).toBeCloseTo(40.1, 1)
  })

  test('wiek 7 mies. — interpolacja między 6 a 8 mies.', () => {
    const p = getWhoPercentiles('weight', 'M', 7)
    expect(p).not.toBeNull()
    // 7 mies powinno być między wartościami z 6 i 8 mies.
    const p6 = getWhoPercentiles('weight', 'M', 6)
    const p8 = getWhoPercentiles('weight', 'M', 8)
    expect(p.P50).toBeGreaterThan(p6.P50)
    expect(p.P50).toBeLessThan(p8.P50)
  })

  test('wiek > 60 mies. — zwraca null (poza zakresem)', () => {
    expect(getWhoPercentiles('weight', 'M', 70)).toBeNull()
  })

  test('wiek ujemny — zwraca null', () => {
    expect(getWhoPercentiles('weight', 'M', -1)).toBeNull()
  })

  test('nieznany type — zwraca null', () => {
    expect(getWhoPercentiles('invalid', 'M', 12)).toBeNull()
  })
})

describe('calculatePercentile', () => {
  const p = { P3: 7.7, P15: 8.6, P50: 9.6, P85: 10.8, P97: 11.8 }

  test('wartość równa P50 → 50 percentyl', () => {
    expect(calculatePercentile(9.6, p)).toBe(50)
  })

  test('wartość poniżej P3 → "<3"', () => {
    expect(calculatePercentile(7.0, p)).toBe('<3')
  })

  test('wartość powyżej P97 → ">97"', () => {
    expect(calculatePercentile(12.5, p)).toBe('>97')
  })

  test('wartość między P15 a P50 → percentyl 15-50', () => {
    const result = calculatePercentile(9.1, p)
    expect(result).toBeGreaterThanOrEqual(15)
    expect(result).toBeLessThanOrEqual(50)
  })

  test('wartość równa P15 → 15 percentyl', () => {
    expect(calculatePercentile(8.6, p)).toBe(15)
  })

  test('brak percentyli → null', () => {
    expect(calculatePercentile(9.0, null)).toBeNull()
  })
})

describe('interpretPercentile', () => {
  test('P50 → "blisko mediany"', () => {
    const r = interpretPercentile(50, 'weight')
    expect(r.level).toBe('ok')
    expect(r.text.toLowerCase()).toContain('mediany')
  })

  test('"<3" → warning', () => {
    const r = interpretPercentile('<3', 'weight')
    expect(r.level).toBe('warning')
    expect(r.text.toLowerCase()).toContain('pediatr')
  })

  test('">97" → warning', () => {
    const r = interpretPercentile('>97', 'weight')
    expect(r.level).toBe('warning')
  })

  test('P20 → info (niższy percentyl)', () => {
    const r = interpretPercentile(20, 'weight')
    expect(r.level).toBeDefined()
  })
})

describe('SANITY: percentyle monotonicznie rosnące', () => {
  test('waga chłopca: P3 < P15 < P50 < P85 < P97', () => {
    const p = getWhoPercentiles('weight', 'M', 12)
    expect(p.P3).toBeLessThan(p.P15)
    expect(p.P15).toBeLessThan(p.P50)
    expect(p.P50).toBeLessThan(p.P85)
    expect(p.P85).toBeLessThan(p.P97)
  })

  test('wzrost dziewczynki: percentyle rosnące dla różnych wieków', () => {
    const p1 = getWhoPercentiles('height', 'F', 6)
    const p2 = getWhoPercentiles('height', 'F', 12)
    const p3 = getWhoPercentiles('height', 'F', 24)
    // Mediana powinna rosnąć z wiekiem
    expect(p2.P50).toBeGreaterThan(p1.P50)
    expect(p3.P50).toBeGreaterThan(p2.P50)
  })
})
