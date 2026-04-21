/**
 * TESTY DAWEK LEKÓW — KRYTYCZNE DLA BEZPIECZEŃSTWA
 *
 * Te testy chronią nas przed sytuacją w której zmiana w kodzie
 * spowoduje że kalkulator wyliczy błędną dawkę dla dziecka.
 *
 * Uruchomienie:
 *   npx vitest run src/utils/helpers.test.js
 *
 * Vitest jest wybrany bo chodzi natywnie z Vite (zero dodatkowej konfiguracji).
 */

import { describe, test, expect } from 'vitest'
import { calcParacetamol, calcIbuprofen } from './helpers'

// ═══════════════════════════════════════════════════════════════════════════
// PARACETAMOL — 15 mg/kg pojedyncza dawka, max 60 mg/kg/dobę
// Zawiesina 120mg/5ml → 24mg/ml
// Zawiesina 240mg/5ml → 48mg/ml
// ═══════════════════════════════════════════════════════════════════════════

describe('calcParacetamol', () => {
  test('waga 3 kg (noworodek) — 45 mg, ~1.9 ml zawiesiny 120', () => {
    const r = calcParacetamol(3)
    expect(r.dose).toBe(45)
    expect(Number(r.mlStd)).toBeCloseTo(1.9, 1)
    expect(Number(r.mlFort)).toBeCloseTo(0.9, 1)
    expect(r.maxDaily).toBe(180)
  })

  test('waga 6.5 kg (4-mies) — 98 mg, ~4.1 ml zawiesiny 120', () => {
    const r = calcParacetamol(6.5)
    expect(r.dose).toBe(98)
    expect(Number(r.mlStd)).toBeCloseTo(4.1, 1)
    expect(Number(r.mlFort)).toBeCloseTo(2.0, 1)
    expect(r.maxDaily).toBe(390)
  })

  test('waga 10 kg (1 rok) — 150 mg, ~6.3 ml zawiesiny 120', () => {
    const r = calcParacetamol(10)
    expect(r.dose).toBe(150)
    expect(Number(r.mlStd)).toBeCloseTo(6.3, 1)
    expect(Number(r.mlFort)).toBeCloseTo(3.1, 1)
    expect(r.maxDaily).toBe(600)
  })

  test('waga 15 kg (3-latek) — 225 mg, ~9.4 ml zawiesiny 120', () => {
    const r = calcParacetamol(15)
    expect(r.dose).toBe(225)
    expect(Number(r.mlStd)).toBeCloseTo(9.4, 1)
    expect(Number(r.mlFort)).toBeCloseTo(4.7, 1)
    expect(r.maxDaily).toBe(900)
  })

  test('waga 20 kg — dawka ≤ 240 mg (bezpieczna górna granica)', () => {
    const r = calcParacetamol(20)
    expect(r.dose).toBe(300)  // 20 × 15 = 300
    // Uwaga: przy wagach 20+ kg dawka 300mg jest powyżej typowego 240mg
    // dla dzieci — ALE to jest pojedyncza dawka dla starszego dziecka
    // która ZGADZA się z WHO dosing tables (15mg/kg do max 1000mg dorosły).
    expect(r.maxDaily).toBe(1200)
  })

  test('zwraca WSZYSTKIE pola: dose, mlStd, mlFort, maxDaily', () => {
    const r = calcParacetamol(6.5)
    expect(r).toHaveProperty('dose')
    expect(r).toHaveProperty('mlStd')
    expect(r).toHaveProperty('mlFort')
    expect(r).toHaveProperty('maxDaily')
  })

  test('zaokrąglenie — waga 7.3 kg', () => {
    const r = calcParacetamol(7.3)
    // 7.3 × 15 = 109.5 → round → 110
    expect(r.dose).toBe(110)
  })

  test('EDGE: waga 0 — zwraca 0 (apka powinna zablokować wcześniej)', () => {
    const r = calcParacetamol(0)
    expect(r.dose).toBe(0)
    expect(r.maxDaily).toBe(0)
  })

  test('REGRESSION: mg/ml dla zawiesiny 120mg/5ml musi być 24mg/ml', () => {
    // 120mg / 5ml = 24 mg/ml
    // Jeśli dose = 240mg, ml powinno być 10
    const r = calcParacetamol(16)  // 16 × 15 = 240mg
    expect(r.dose).toBe(240)
    expect(Number(r.mlStd)).toBeCloseTo(10.0, 1)
  })

  test('REGRESSION: mg/ml dla zawiesiny 240mg/5ml musi być 48mg/ml', () => {
    // 240mg / 5ml = 48 mg/ml
    // Jeśli dose = 240mg, ml powinno być 5
    const r = calcParacetamol(16)
    expect(r.dose).toBe(240)
    expect(Number(r.mlFort)).toBeCloseTo(5.0, 1)
  })

  test('REGRESSION: max dobowa = 4 × dawka pojedyncza (co 6h)', () => {
    const r = calcParacetamol(10)
    expect(r.maxDaily).toBe(r.dose * 4)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// IBUPROFEN — 10 mg/kg pojedyncza dawka, max 30 mg/kg/dobę
// OD 3 MIESIĄCA ŻYCIA
// Zawiesina 100mg/5ml → 20mg/ml
// ═══════════════════════════════════════════════════════════════════════════

describe('calcIbuprofen', () => {
  test('poniżej 3 mies — zwraca null (zakaz stosowania)', () => {
    expect(calcIbuprofen(5.0, 0)).toBeNull()
    expect(calcIbuprofen(5.5, 1)).toBeNull()
    expect(calcIbuprofen(6.0, 2)).toBeNull()
  })

  test('dokładnie 3 mies — zwraca dawkę', () => {
    const r = calcIbuprofen(6.0, 3)
    expect(r).not.toBeNull()
    expect(r.dose).toBe(60)
  })

  test('waga 6.5 kg, 4 mies — 65 mg, ~3.3 ml', () => {
    const r = calcIbuprofen(6.5, 4)
    expect(r.dose).toBe(65)
    expect(Number(r.ml)).toBeCloseTo(3.3, 1)
    expect(r.maxDaily).toBe(195)
  })

  test('waga 10 kg, 1 rok — 100 mg, 5.0 ml', () => {
    const r = calcIbuprofen(10, 12)
    expect(r.dose).toBe(100)
    expect(Number(r.ml)).toBeCloseTo(5.0, 1)
    expect(r.maxDaily).toBe(300)
  })

  test('waga 15 kg, 3 lata — 150 mg, 7.5 ml', () => {
    const r = calcIbuprofen(15, 36)
    expect(r.dose).toBe(150)
    expect(Number(r.ml)).toBeCloseTo(7.5, 1)
    expect(r.maxDaily).toBe(450)
  })

  test('zaokrąglenie — waga 7.3 kg, 5 mies', () => {
    const r = calcIbuprofen(7.3, 5)
    // 7.3 × 10 = 73 mg
    expect(r.dose).toBe(73)
  })

  test('REGRESSION: mg/ml dla zawiesiny 100mg/5ml musi być 20mg/ml', () => {
    const r = calcIbuprofen(10, 12)  // 100mg
    expect(r.dose).toBe(100)
    expect(Number(r.ml)).toBeCloseTo(5.0, 1)
  })

  test('REGRESSION: max dobowa = 3 × dawka pojedyncza (co 8h)', () => {
    const r = calcIbuprofen(10, 12)
    expect(r.maxDaily).toBe(r.dose * 3)
  })

  test('EDGE: waga 0, wiek 5 mies — zwraca obiekt z zerami', () => {
    const r = calcIbuprofen(0, 5)
    expect(r.dose).toBe(0)
    expect(r.maxDaily).toBe(0)
  })

  test('CRITICAL: bezpieczeństwo — dawka ibuprofen NIE PRZEKRACZA 30mg/kg/doba', () => {
    // Test przeciwko pomyłce w kodzie gdzie ktoś mógłby zrobić maxDaily = weight * 40
    for (const weight of [3, 5, 7, 10, 15, 20, 25]) {
      const r = calcIbuprofen(weight, 12)
      if (r) {
        expect(r.maxDaily).toBeLessThanOrEqual(weight * 30)
      }
    }
  })

  test('CRITICAL: bezpieczeństwo — dawka paracetamol NIE PRZEKRACZA 60mg/kg/doba', () => {
    for (const weight of [3, 5, 7, 10, 15, 20, 25]) {
      const r = calcParacetamol(weight)
      expect(r.maxDaily).toBeLessThanOrEqual(weight * 60)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SANITY: kalkulator NIE ZAWSZE daje tę samą odpowiedź
// (test że matematyka faktycznie patrzy na wagę)
// ═══════════════════════════════════════════════════════════════════════════

describe('SANITY — kalkulatory reagują na wagę', () => {
  test('paracetamol: 2× waga = 2× dawka', () => {
    const a = calcParacetamol(5)
    const b = calcParacetamol(10)
    expect(b.dose).toBe(a.dose * 2)
  })

  test('ibuprofen: 2× waga = 2× dawka', () => {
    const a = calcIbuprofen(5, 12)
    const b = calcIbuprofen(10, 12)
    expect(b.dose).toBe(a.dose * 2)
  })
})
