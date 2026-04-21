/**
 * WHO Child Growth Standards — percentyle
 *
 * Źródło: WHO Child Growth Standards (2006)
 * https://www.who.int/tools/child-growth-standards/standards
 *
 * Dane dla wagi (kg), wzrostu (cm), obwodu głowy (cm) w zależności
 * od wieku (miesięcy) i płci (boys/girls).
 *
 * Percentyle: 3, 15, 50 (mediana), 85, 97
 * Wartości poniżej P3 i powyżej P97 — rekomenduje się konsultację pediatrzcy.
 *
 * UWAGA: Te dane są do celów orientacyjnych. Nie zastępują oceny lekarskiej.
 */

// Waga-wiek (kg) dla chłopców 0-60 miesięcy
// Każdy wiersz: [mies., P3, P15, P50, P85, P97]
export const WEIGHT_BOYS = [
  [0,  2.5, 2.9, 3.3, 3.9, 4.3],
  [1,  3.4, 3.9, 4.5, 5.1, 5.7],
  [2,  4.4, 4.9, 5.6, 6.3, 7.0],
  [3,  5.1, 5.7, 6.4, 7.2, 7.9],
  [4,  5.6, 6.2, 7.0, 7.8, 8.6],
  [5,  6.1, 6.7, 7.5, 8.4, 9.2],
  [6,  6.4, 7.1, 7.9, 8.9, 9.7],
  [7,  6.7, 7.4, 8.3, 9.3, 10.2],
  [8,  6.9, 7.7, 8.6, 9.6, 10.5],
  [9,  7.1, 7.9, 8.9, 9.9, 10.9],
  [10, 7.4, 8.1, 9.2, 10.2, 11.2],
  [11, 7.6, 8.4, 9.4, 10.5, 11.5],
  [12, 7.7, 8.6, 9.6, 10.8, 11.8],
  [15, 8.3, 9.2, 10.3, 11.5, 12.7],
  [18, 8.8, 9.8, 10.9, 12.2, 13.5],
  [21, 9.2, 10.3, 11.5, 12.9, 14.3],
  [24, 9.7, 10.8, 12.2, 13.6, 15.1],
  [27, 10.1, 11.3, 12.7, 14.3, 15.8],
  [30, 10.5, 11.8, 13.3, 14.9, 16.5],
  [33, 10.9, 12.2, 13.8, 15.5, 17.3],
  [36, 11.3, 12.7, 14.3, 16.2, 18.0],
  [42, 12.0, 13.5, 15.3, 17.3, 19.4],
  [48, 12.7, 14.3, 16.3, 18.5, 20.9],
  [54, 13.4, 15.2, 17.3, 19.7, 22.4],
  [60, 14.1, 16.0, 18.3, 20.9, 24.2],
]

// Waga-wiek (kg) dla dziewczynek 0-60 miesięcy
export const WEIGHT_GIRLS = [
  [0,  2.4, 2.8, 3.2, 3.7, 4.2],
  [1,  3.2, 3.6, 4.2, 4.8, 5.4],
  [2,  4.0, 4.5, 5.1, 5.9, 6.5],
  [3,  4.6, 5.1, 5.8, 6.7, 7.4],
  [4,  5.1, 5.6, 6.4, 7.3, 8.1],
  [5,  5.5, 6.1, 6.9, 7.8, 8.7],
  [6,  5.8, 6.4, 7.3, 8.3, 9.2],
  [7,  6.1, 6.7, 7.6, 8.7, 9.6],
  [8,  6.3, 7.0, 7.9, 9.0, 10.0],
  [9,  6.6, 7.3, 8.2, 9.3, 10.4],
  [10, 6.8, 7.5, 8.5, 9.6, 10.7],
  [11, 7.0, 7.7, 8.7, 9.9, 11.0],
  [12, 7.1, 7.9, 8.9, 10.2, 11.3],
  [15, 7.6, 8.5, 9.6, 11.0, 12.2],
  [18, 8.1, 9.1, 10.2, 11.7, 13.1],
  [21, 8.6, 9.6, 10.9, 12.4, 13.9],
  [24, 9.0, 10.2, 11.5, 13.1, 14.8],
  [27, 9.5, 10.7, 12.1, 13.8, 15.6],
  [30, 9.9, 11.2, 12.7, 14.5, 16.4],
  [33, 10.3, 11.6, 13.3, 15.1, 17.2],
  [36, 10.8, 12.1, 13.9, 15.8, 18.1],
  [42, 11.6, 13.1, 15.0, 17.2, 19.8],
  [48, 12.3, 14.0, 16.1, 18.5, 21.5],
  [54, 13.1, 14.9, 17.2, 19.9, 23.2],
  [60, 13.7, 15.8, 18.2, 21.2, 24.9],
]

// Wzrost-wiek (cm) dla chłopców 0-60 miesięcy
export const HEIGHT_BOYS = [
  [0,  46.3, 47.9, 49.9, 51.8, 53.4],
  [1,  51.1, 52.7, 54.7, 56.7, 58.4],
  [2,  54.7, 56.4, 58.4, 60.4, 62.2],
  [3,  57.6, 59.3, 61.4, 63.5, 65.3],
  [4,  60.0, 61.7, 63.9, 66.0, 67.8],
  [5,  61.9, 63.7, 65.9, 68.0, 69.9],
  [6,  63.6, 65.4, 67.6, 69.8, 71.6],
  [7,  65.1, 66.9, 69.2, 71.3, 73.2],
  [8,  66.5, 68.3, 70.6, 72.8, 74.7],
  [9,  67.7, 69.6, 72.0, 74.2, 76.2],
  [10, 69.0, 70.9, 73.3, 75.6, 77.6],
  [11, 70.2, 72.1, 74.5, 76.9, 78.9],
  [12, 71.3, 73.3, 75.7, 78.1, 80.2],
  [15, 74.1, 76.1, 78.6, 81.2, 83.5],
  [18, 76.9, 79.0, 81.7, 84.4, 86.7],
  [21, 79.4, 81.5, 84.2, 87.0, 89.5],
  [24, 81.7, 83.9, 86.7, 89.6, 92.2],
  [27, 83.5, 85.9, 88.8, 91.8, 94.5],
  [30, 85.3, 87.6, 90.7, 93.8, 96.5],
  [33, 86.9, 89.3, 92.4, 95.6, 98.5],
  [36, 88.5, 91.0, 94.1, 97.5, 100.4],
  [42, 91.6, 94.1, 97.5, 101.0, 104.2],
  [48, 94.6, 97.3, 100.7, 104.4, 107.9],
  [54, 97.4, 100.2, 103.8, 107.6, 111.2],
  [60, 100.1, 103.1, 106.7, 110.6, 114.3],
]

// Wzrost-wiek (cm) dla dziewczynek 0-60 miesięcy
export const HEIGHT_GIRLS = [
  [0,  45.6, 47.2, 49.1, 51.0, 52.7],
  [1,  50.0, 51.7, 53.7, 55.6, 57.4],
  [2,  53.2, 55.0, 57.1, 59.1, 60.9],
  [3,  55.8, 57.6, 59.8, 61.9, 63.8],
  [4,  58.0, 59.8, 62.1, 64.3, 66.2],
  [5,  59.9, 61.8, 64.0, 66.2, 68.2],
  [6,  61.5, 63.4, 65.7, 68.0, 70.0],
  [7,  62.9, 64.9, 67.3, 69.6, 71.6],
  [8,  64.3, 66.3, 68.7, 71.1, 73.2],
  [9,  65.6, 67.6, 70.1, 72.6, 74.7],
  [10, 66.8, 68.9, 71.5, 74.0, 76.1],
  [11, 68.0, 70.2, 72.8, 75.3, 77.5],
  [12, 69.2, 71.3, 74.0, 76.6, 78.9],
  [15, 72.3, 74.6, 77.5, 80.2, 82.5],
  [18, 75.2, 77.5, 80.7, 83.6, 85.9],
  [21, 77.7, 80.2, 83.5, 86.5, 88.9],
  [24, 80.0, 82.6, 86.0, 89.2, 91.7],
  [27, 81.9, 84.6, 88.3, 91.6, 94.2],
  [30, 83.6, 86.5, 90.4, 93.8, 96.6],
  [33, 85.3, 88.3, 92.3, 95.9, 98.8],
  [36, 87.0, 90.0, 94.2, 97.9, 100.9],
  [42, 90.0, 93.2, 97.6, 101.6, 104.9],
  [48, 92.9, 96.3, 100.9, 105.2, 108.7],
  [54, 95.7, 99.3, 104.2, 108.7, 112.4],
  [60, 98.4, 102.2, 107.4, 112.2, 116.1],
]

// Obwód głowy-wiek (cm) dla chłopców 0-36 miesięcy (po 36 mies. nie jest rutynowo mierzony)
export const HEAD_BOYS = [
  [0,  32.6, 33.8, 34.5, 35.8, 36.9],
  [1,  35.8, 37.0, 37.6, 39.0, 40.1],
  [2,  37.9, 39.1, 39.8, 41.1, 42.2],
  [3,  39.3, 40.6, 41.3, 42.6, 43.7],
  [4,  40.4, 41.7, 42.4, 43.7, 44.8],
  [5,  41.3, 42.6, 43.3, 44.6, 45.8],
  [6,  42.1, 43.4, 44.1, 45.4, 46.6],
  [7,  42.7, 44.0, 44.7, 46.1, 47.2],
  [8,  43.3, 44.6, 45.3, 46.7, 47.8],
  [9,  43.7, 45.1, 45.8, 47.2, 48.3],
  [10, 44.2, 45.5, 46.2, 47.6, 48.8],
  [11, 44.5, 45.9, 46.6, 48.0, 49.1],
  [12, 44.8, 46.2, 46.9, 48.3, 49.5],
  [15, 45.6, 47.0, 47.8, 49.2, 50.4],
  [18, 46.2, 47.6, 48.4, 49.8, 51.0],
  [21, 46.7, 48.1, 48.8, 50.3, 51.5],
  [24, 47.1, 48.5, 49.2, 50.7, 51.9],
  [30, 47.7, 49.1, 49.8, 51.3, 52.5],
  [36, 48.2, 49.6, 50.3, 51.8, 53.0],
]

// Obwód głowy-wiek (cm) dla dziewczynek 0-36 miesięcy
export const HEAD_GIRLS = [
  [0,  32.0, 33.1, 33.9, 35.1, 36.2],
  [1,  34.8, 36.0, 36.8, 38.1, 39.2],
  [2,  36.8, 38.0, 38.8, 40.1, 41.2],
  [3,  38.1, 39.3, 40.1, 41.5, 42.6],
  [4,  39.1, 40.4, 41.2, 42.6, 43.7],
  [5,  40.0, 41.3, 42.1, 43.5, 44.6],
  [6,  40.7, 42.1, 42.9, 44.2, 45.3],
  [7,  41.4, 42.7, 43.5, 44.9, 46.0],
  [8,  41.9, 43.2, 44.0, 45.4, 46.5],
  [9,  42.3, 43.7, 44.5, 45.9, 47.0],
  [10, 42.7, 44.1, 44.9, 46.3, 47.4],
  [11, 43.0, 44.5, 45.2, 46.6, 47.7],
  [12, 43.3, 44.7, 45.5, 46.9, 48.0],
  [15, 44.1, 45.5, 46.3, 47.7, 48.9],
  [18, 44.6, 46.1, 46.9, 48.3, 49.5],
  [21, 45.1, 46.6, 47.3, 48.8, 50.0],
  [24, 45.5, 47.0, 47.8, 49.2, 50.4],
  [30, 46.2, 47.7, 48.5, 49.9, 51.2],
  [36, 46.8, 48.3, 49.1, 50.6, 51.8],
]

/**
 * Liniowa interpolacja — dla wieku między dwoma punktami w tabeli,
 * oblicza wartość percentyla.
 *
 * @param {Array<Array<number>>} data - tabela WHO (wiek, P3, P15, P50, P85, P97)
 * @param {number} ageMonths - wiek w miesiącach
 * @returns {Array<number>|null} - [P3, P15, P50, P85, P97] albo null jeśli poza zakresem
 */
function interpolatePercentiles(data, ageMonths) {
  if (ageMonths < 0 || ageMonths > data[data.length - 1][0]) return null

  // Znajdź dwa punkty między którymi jest ageMonths
  for (let i = 0; i < data.length - 1; i++) {
    const [age1, ...p1] = data[i]
    const [age2, ...p2] = data[i + 1]
    if (ageMonths === age1) return p1
    if (ageMonths === age2) return p2
    if (ageMonths > age1 && ageMonths < age2) {
      // Liniowa interpolacja
      const ratio = (ageMonths - age1) / (age2 - age1)
      return p1.map((v, j) => v + (p2[j] - v) * ratio)
    }
  }
  return null
}

/**
 * Zwraca percentyle dla danego typu pomiaru, płci i wieku.
 *
 * @param {string} type - 'weight' | 'height' | 'head'
 * @param {string} sex - 'M' | 'F'
 * @param {number} ageMonths - wiek w miesiącach
 * @returns {Object|null} - { P3, P15, P50, P85, P97 } lub null
 */
export function getWhoPercentiles(type, sex, ageMonths) {
  let data
  if (type === 'weight') data = sex === 'M' ? WEIGHT_BOYS : WEIGHT_GIRLS
  else if (type === 'height') data = sex === 'M' ? HEIGHT_BOYS : HEIGHT_GIRLS
  else if (type === 'head') data = sex === 'M' ? HEAD_BOYS : HEAD_GIRLS
  else return null

  const values = interpolatePercentiles(data, ageMonths)
  if (!values) return null
  return { P3: values[0], P15: values[1], P50: values[2], P85: values[3], P97: values[4] }
}

/**
 * Oblicza w którym percentylu jest dana wartość pomiaru.
 *
 * Używa interpolacji liniowej między znanymi punktami percentyli (P3, P15, P50, P85, P97).
 * Dla uproszczenia — nie używa pełnej krzywej z-score, ale dla większości przypadków
 * wynik jest wystarczająco dokładny do celów orientacyjnych.
 *
 * @param {number} value - zmierzona wartość (waga/wzrost/obwód)
 * @param {Object} percentiles - { P3, P15, P50, P85, P97 }
 * @returns {number|string} - liczbowy percentyl (1-99) lub '<3' / '>97'
 */
export function calculatePercentile(value, percentiles) {
  if (!percentiles) return null
  const { P3, P15, P50, P85, P97 } = percentiles

  if (value <= P3) return '<3'
  if (value >= P97) return '>97'

  // Interpoluj w odpowiednim segmencie
  let p1, p2, pct1, pct2
  if (value <= P15)      { p1 = P3;  p2 = P15; pct1 = 3;  pct2 = 15 }
  else if (value <= P50) { p1 = P15; p2 = P50; pct1 = 15; pct2 = 50 }
  else if (value <= P85) { p1 = P50; p2 = P85; pct1 = 50; pct2 = 85 }
  else                    { p1 = P85; p2 = P97; pct1 = 85; pct2 = 97 }

  const ratio = (value - p1) / (p2 - p1)
  return Math.round(pct1 + (pct2 - pct1) * ratio)
}

/**
 * Generuje interpretację percentyla dla użytkownika.
 */
export function interpretPercentile(percentile, type) {
  const typeLabel = type === 'weight' ? 'waga' : type === 'height' ? 'wzrost' : 'obwód głowy'

  if (percentile === '<3') return {
    level: 'warning',
    text: `${typeLabel[0].toUpperCase()+typeLabel.slice(1)} poniżej P3 — warto skonsultować z pediatrą`,
  }
  if (percentile === '>97') return {
    level: 'warning',
    text: `${typeLabel[0].toUpperCase()+typeLabel.slice(1)} powyżej P97 — warto skonsultować z pediatrą`,
  }

  const pct = Number(percentile)
  if (pct >= 40 && pct <= 60) return { level: 'ok', text: `Blisko mediany (P50) — typowy rozwój` }
  if (pct >= 25 && pct < 75)  return { level: 'ok', text: `W normie — zdrowy rozwój` }
  if (pct >= 15 && pct < 25)  return { level: 'info', text: `Na niższym końcu normy, ale OK` }
  if (pct > 75  && pct <= 85) return { level: 'info', text: `Na wyższym końcu normy, ale OK` }
  if (pct > 3   && pct < 15)  return { level: 'info', text: `Niższy percentyl — obserwuj trend` }
  if (pct > 85  && pct < 97)  return { level: 'info', text: `Wyższy percentyl — obserwuj trend` }
  return { level: 'ok', text: 'W normie' }
}
