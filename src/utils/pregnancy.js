// Tryb ciąży (v2.17.0): obliczenia na datach, bez stanu i bez Reacta.
//
// Wiek ciąży liczymy jak lekarze: od pierwszego dnia ostatniej miesiączki,
// termin porodu = ten dzień + 280 dni (reguła Naegelego). Gdy znamy tylko
// termin z USG, początek = termin - 280 dni.
//
// Wyjątek: Francja ustala termin na 41 SA (CNGOF), czyli 287 dni. Długość
// zapisujemy w profilu (termDays) przy zakładaniu, żeby partner z inną
// wersją językową liczył tak samo. "24+3" = 24 pełne tygodnie i 3 dni,
// czyli trwa 25. tydzień ciąży.
//
// Daty jako 'YYYY-MM-DD' w strefie telefonu; liczymy w południe, żeby zmiana
// czasu (23 albo 25 godzin w dobie) nie przesuwała wyniku o dzień.

import { dateYMD } from './helpers'

export const GESTATION_DAYS = 280

/** Dni od ostatniej miesiączki do terminu w danym języku aplikacji. */
export function termDaysForLocale(locale) {
  return locale === 'fr' ? 287 : GESTATION_DAYS
}
const DAY_MS = 24 * 60 * 60 * 1000

function noon(ymd) {
  const d = new Date(`${ymd}T12:00:00`)
  return isNaN(d.getTime()) ? null : d
}

/** Różnica w pełnych dniach kalendarzowych: b - a (obie jako 'YYYY-MM-DD' albo Date). */
export function daysBetween(a, b) {
  const da = typeof a === 'string' ? noon(a) : noon(dateYMD(a))
  const db = typeof b === 'string' ? noon(b) : noon(dateYMD(b))
  if (!da || !db) return null
  return Math.round((db - da) / DAY_MS)
}

export function addDays(ymd, days) {
  const d = noon(ymd)
  if (!d) return null
  d.setDate(d.getDate() + days)
  return dateYMD(d)
}

/** Termin porodu z pierwszego dnia ostatniej miesiączki. */
export function dueDateFromLmp(lmp, termDays = GESTATION_DAYS) {
  return addDays(lmp, termDays)
}

/**
 * Postęp ciąży na dany dzień.
 * @returns {{ weeks, days, week, trimester, daysLeft, percent } | null}
 *   weeks+days — pełne tygodnie i dni (24+3), week — trwający tydzień (25),
 *   trimester — 1 do 13+6, 2 do 27+6, 3 potem; daysLeft < 0 po terminie.
 */
export function pregnancyProgress(dueDate, now = new Date(), termDays = GESTATION_DAYS) {
  const daysLeft = daysBetween(now, dueDate)
  if (daysLeft == null) return null
  const elapsed = Math.max(0, termDays - daysLeft)
  const weeks = Math.floor(elapsed / 7)
  const days = elapsed % 7
  return {
    weeks,
    days,
    week: weeks + 1,
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    daysLeft,
    percent: Math.min(100, Math.round((elapsed / termDays) * 100)),
  }
}

// Termin wpisany przy zakładaniu: najwyżej 4 tygodnie po (ktoś zakłada profil
// po terminie) i najwyżej 280 dni przed (ostatnia miesiączka dziś).
export function isValidDueDate(ymd, now = new Date(), termDays = GESTATION_DAYS) {
  const left = daysBetween(now, ymd)
  return left != null && left >= -28 && left <= termDays
}

// Ostatnia miesiączka: nie w przyszłości i nie dawniej niż 44 tygodnie.
export function isValidLmp(ymd, now = new Date()) {
  const ago = daysBetween(ymd, now)
  return ago != null && ago >= 0 && ago <= 44 * 7
}

// Data urodzenia przy "Urodziło się": nie w przyszłości, nie dawniej niż rok
// i nie wcześniej niż w 22. tygodniu ciąży (18 tygodni przed terminem).
export function isValidBirthDate(ymd, dueDate, now = new Date()) {
  const ago = daysBetween(ymd, now)
  if (ago == null || ago < 0 || ago > 366) return false
  const beforeDue = dueDate ? daysBetween(ymd, dueDate) : 0
  return beforeDue == null || beforeDue <= 18 * 7
}

// ─── Skurcze ───────────────────────────────────────────────────────────────
// Wpis: { id, start, end } (ms); end = null, dopóki skurcz trwa. Lista od
// najnowszego. Odstęp = od początku poprzedniego skurczu do początku tego.

/** Wpisy z dopisanym czasem trwania i odstępem (sekundy, null gdy brak). */
export function withContractionTimes(list) {
  const sorted = [...(list || [])].filter(c => c && typeof c.start === 'number')
    .sort((a, b) => b.start - a.start)
  return sorted.map((c, i) => {
    const prev = sorted[i + 1]
    return {
      ...c,
      durationSec: typeof c.end === 'number' ? Math.max(0, Math.round((c.end - c.start) / 1000)) : null,
      intervalSec: prev ? Math.round((c.start - prev.start) / 1000) : null,
    }
  })
}

/**
 * Podsumowanie skurczy zakończonych w ostatniej godzinie: liczba, średni czas
 * trwania i średni odstęp. Same liczby, bez oceny (to robi położna).
 */
export function contractionStats(list, now = Date.now()) {
  const recent = withContractionTimes(list)
    .filter(c => c.durationSec != null && now - c.start <= 60 * 60 * 1000)
  if (!recent.length) return null
  const avg = arr => (arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null)
  // Odstęp liczy się tylko między skurczami z tej godziny.
  const intervals = recent.slice(0, -1).map(c => c.intervalSec).filter(x => x != null)
  return {
    count: recent.length,
    avgDurationSec: avg(recent.map(c => c.durationSec)),
    avgIntervalSec: avg(intervals),
  }
}

/** 65 → "1:05", 3725 → "62:05". */
export function formatMinSec(sec) {
  if (sec == null || !isFinite(sec)) return ''
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
