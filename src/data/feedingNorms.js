/**
 * Feeding Frequency Reference Ranges — typowa liczba karmień / dobę
 * wg wieku dziecka.
 *
 * Źródła:
 *   - American Academy of Pediatrics (AAP) — "Breastfeeding and the Use of
 *     Human Milk" Policy Statement (2022 update)
 *   - ESPGHAN (European Society for Paediatric Gastroenterology, Hepatology
 *     and Nutrition) — "Complementary Feeding: A Position Paper" (2017)
 *   - WHO — Infant and young child feeding (2021)
 *
 * UWAGA: To są zakresy populacyjne. Karmienie na żądanie jest standardem
 * AAP — liczba karmień nie ma "normy medycznej". Te zakresy są orientacyjne.
 */

// Typowa liczba karmień / dobę (mleko: pierś + butelka, BEZ posiłków stałych).
export const FEEDING_NORMS = [
  { ageMin: 0,   ageMax: 1,  feedingsMin: 8,  feedingsMax: 12, label: '0-1 mies.' },
  { ageMin: 2,   ageMax: 3,  feedingsMin: 7,  feedingsMax: 9,  label: '2-3 mies.' },
  { ageMin: 4,   ageMax: 6,  feedingsMin: 5,  feedingsMax: 7,  label: '4-6 mies.' },
  { ageMin: 7,   ageMax: 12, feedingsMin: 4,  feedingsMax: 6,  label: '7-12 mies.' },
  { ageMin: 13,  ageMax: 24, feedingsMin: 3,  feedingsMax: 5,  label: '1-2 lata' },
  { ageMin: 25,  ageMax: 60, feedingsMin: 3,  feedingsMax: 4,  label: '2-5 lat' },
]

/**
 * Pobiera typowy zakres liczby karmień dla wieku dziecka.
 * @param {number} ageMonths - wiek w miesiącach
 * @returns {{feedingsMin, feedingsMax, label}|null}
 */
export function getFeedingRange(ageMonths) {
  if (ageMonths == null || ageMonths < 0) return null
  const range = FEEDING_NORMS.find(r => ageMonths >= r.ageMin && ageMonths <= r.ageMax)
  return range || null
}
