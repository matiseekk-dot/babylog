/**
 * Sleep Reference Ranges — typowe zakresy snu wg wieku dziecka.
 *
 * Źródła:
 *   - American Academy of Pediatrics (AAP) — "Recommended Amount of Sleep
 *     for Pediatric Populations" Consensus Statement (2016)
 *   - National Sleep Foundation (NSF) — "Sleep Time Duration
 *     Recommendations: Methodology and Results" (2015)
 *
 * UWAGA: To są zakresy populacyjne — nie norma medyczna dla konkretnego
 * dziecka. Każde dziecko śpi inaczej.
 */

// Typowy całkowity sen / 24h w godzinach (range NSF/AAP).
// Zwracany jako [min, max] dla wieku dziecka w miesiącach.
export const SLEEP_NORMS = [
  { ageMin: 0,   ageMax: 3,   hoursMin: 14, hoursMax: 17, label: '0-3 mies.' },
  { ageMin: 4,   ageMax: 11,  hoursMin: 12, hoursMax: 15, label: '4-11 mies.' },
  { ageMin: 12,  ageMax: 24,  hoursMin: 11, hoursMax: 14, label: '1-2 lata' },
  { ageMin: 25,  ageMax: 60,  hoursMin: 10, hoursMax: 13, label: '3-5 lat' },
  { ageMin: 61,  ageMax: 156, hoursMin: 9,  hoursMax: 12, label: '6-13 lat' },
]

/**
 * Pobiera typowy zakres snu dla wieku dziecka.
 * @param {number} ageMonths - wiek w miesiącach
 * @returns {{hoursMin, hoursMax, label}|null}
 */
export function getSleepRange(ageMonths) {
  if (ageMonths == null || ageMonths < 0) return null
  const range = SLEEP_NORMS.find(r => ageMonths >= r.ageMin && ageMonths <= r.ageMax)
  return range || null
}
