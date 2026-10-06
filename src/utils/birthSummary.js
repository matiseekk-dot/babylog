// Podsumowanie ciąży przy narodzinach (v2.17.7): liczby z danych, które para
// zebrała w trybie ciąży. Bez ocen, same fakty do karty i wspomnień.
import { pregnancyProgress, daysBetween, GESTATION_DAYS } from './pregnancy'
import { listProgress } from '../data/pregnancyLists'

/**
 * @returns {{ ga: {weeks, days}|null, earlyDays: number|null, contractions: number,
 *   kicks: number, bag: {done, total}, exams: number }}
 *   earlyDays > 0: tyle dni przed terminem, < 0: po terminie, 0: w dniu terminu.
 */
export function birthSummary({ profile, contractions, kicks, lists, exams, locale }) {
  const { dueDate, birthDate } = profile || {}
  const termDays = profile?.termDays || GESTATION_DAYS
  const p = dueDate && birthDate ? pregnancyProgress(dueDate, birthDate, termDays) : null
  const count = list => (Array.isArray(list) ? list.filter(x => x && typeof x.start === 'number').length : 0)
  const examState = exams && typeof exams === 'object' && !Array.isArray(exams) ? exams : {}
  return {
    ga: p ? { weeks: p.weeks, days: p.days } : null,
    earlyDays: dueDate && birthDate ? daysBetween(birthDate, dueDate) : null,
    contractions: count(contractions),
    kicks: count(kicks),
    bag: listProgress('bag', locale, lists && typeof lists === 'object' && !Array.isArray(lists) ? lists : {}),
    exams: Object.entries(examState).filter(([k, v]) => !k.startsWith('note:') && v === true).length,
  }
}

/**
 * Waga z formularza porodu w gramach. "3450" → 3450, "3,45" albo "3.45" → 3450
 * (ktoś wpisał kilogramy). Poza 300 do 7000 g → NaN; puste → null.
 */
export function parseBirthWeight(str) {
  const s = String(str ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n)) return NaN
  const g = n < 10 ? Math.round(n * 1000) : Math.round(n)
  return g >= 300 && g <= 7000 ? g : NaN
}

/** Długość w cm (20 do 65), puste → null, poza zakresem → NaN. */
export function parseBirthLength(str) {
  const s = String(str ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n)) return NaN
  return n >= 20 && n <= 65 ? Math.round(n * 10) / 10 : NaN
}
