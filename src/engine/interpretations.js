/**
 * interpretations.js
 *
 * Czyste funkcje interpretacji danych dla każdej sekcji.
 * Zwracają { label, detail?, status } — gotowe do wyświetlenia inline.
 *
 * status: 'ok' | 'info' | 'warning' | 'alert'
 * Brak importów React. Brak efektów ubocznych.
 */

import { minutesSince } from './rulesEngine'

// ─── helpers lokalne ─────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function sortedByTime(logs) {
  return [...(logs || [])].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  )
}

function lastMed(medLogs, fragment) {
  return [...(medLogs || [])]
    .filter(l => l.med?.toLowerCase().includes(fragment.toLowerCase()))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0] || null
}

function fmtDuration(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtAgo(minutes) {
  if (minutes === Infinity || minutes == null) return null
  if (minutes < 60) return `${minutes} min temu`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m temu` : `${h}h temu`
}

// ─── Temperatura ─────────────────────────────────────────────────────────────

/**
 * interpretTemp(logs)
 * → { label, detail?, status }
 *
 * Trend wyznaczany z 3 ostatnich pomiarów (wszystkie daty).
 * Poziom na podstawie ostatniego pomiaru.
 */
export function interpretTemp(logs) {
  if (!logs?.length) return null

  const sorted = sortedByTime(logs)
  const last = sorted[sorted.length - 1]
  const temp = Number(last.temp)

  // Trend
  let trend = null
  if (sorted.length >= 3) {
    const [t1, t2, t3] = sorted.slice(-3).map(l => Number(l.temp))
    if (t1 < t2 && t2 < t3)      trend = 'rising'
    else if (t1 > t2 && t2 > t3) trend = 'falling'
    else                           trend = 'stable'
  }

  const TREND_LABEL = {
    rising:  'Temperatura rośnie ↑',
    falling: 'Temperatura spada ↓',
    stable:  'Temperatura stabilna →',
  }

  // Status na podstawie wartości
  let status = 'ok'
  if (temp >= 39)        status = 'alert'
  else if (temp >= 38.5) status = 'alert'
  else if (temp >= 38.0) status = 'warning'
  else if (temp >= 37.5) status = 'info'

  // Jeśli rośnie — podnieś status o jeden poziom (max alert)
  if (trend === 'rising' && status === 'ok')      status = 'info'
  else if (trend === 'rising' && status === 'info') status = 'warning'

  const label = trend ? TREND_LABEL[trend] : `Ostatni: ${temp.toFixed(1)}°C`
  const detail = sorted.length >= 3
    ? sorted.slice(-3).map(l => `${Number(l.temp).toFixed(1)}°`).join(' → ')
    : `Ostatni pomiar: ${temp.toFixed(1)}°C`

  return { label, detail, status }
}

// ─── Leki ─────────────────────────────────────────────────────────────────────

/**
 * interpretMeds(medLogs)
 * → { label, detail?, status }
 *
 * Pokazuje: kiedy ostatnia dawka + czy można podać kolejną.
 * Paracetamol co 4–6h (maks), ibuprofen co 6–8h.
 */
export function interpretMeds(medLogs) {
  if (!medLogs?.length) return null

  const lastParac = lastMed(medLogs, 'paracetamol')
  const lastIbu   = lastMed(medLogs, 'ibuprofen')

  // Znajdź ostatni istotny lek
  const candidates = [lastParac, lastIbu].filter(Boolean)
  if (!candidates.length) {
    // Inne leki
    const anyLast = [...medLogs]
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
    if (!anyLast) return null
    const ago = minutesSince(anyLast.time, anyLast.date)
    return {
      label: `Ostatnia dawka: ${anyLast.med}`,
      detail: fmtAgo(ago),
      status: 'ok',
    }
  }

  // Paracetamol — max co 4h (240 min), nie bezpieczny po 6h (360 min)
  // Ibuprofen — max co 6h (360 min), nie bezpieczny po 8h (480 min)
  const paracMin = lastParac ? minutesSince(lastParac.time, lastParac.date) : Infinity
  const ibuMin   = lastIbu   ? minutesSince(lastIbu.time,   lastIbu.date)   : Infinity

  // Który lek był podany ostatnio?
  const usedParac = paracMin <= ibuMin
  const lastUsed  = usedParac ? lastParac : lastIbu
  const minAgo    = usedParac ? paracMin  : ibuMin
  const maxInterval = usedParac ? 360 : 480  // 6h / 8h
  const safeInterval = usedParac ? 240 : 360 // 4h / 6h

  const name = lastUsed.med || (usedParac ? 'Paracetamol' : 'Ibuprofen')
  const agoStr = fmtAgo(minAgo)

  if (minAgo >= maxInterval) {
    return {
      label: 'Możliwy czas na kolejną dawkę',
      detail: `${name} — podano ${agoStr}`,
      status: 'info',
    }
  }

  if (minAgo >= safeInterval) {
    const remainMin = maxInterval - minAgo
    return {
      label: 'Kolejna dawka możliwa wkrótce',
      detail: `${name} podano ${agoStr} · za ~${remainMin} min`,
      status: 'info',
    }
  }

  // Za wcześnie na kolejną dawkę
  const remainMin = safeInterval - minAgo
  return {
    label: `Ostatnia dawka: ${name}`,
    detail: `${agoStr} · kolejna za ~${remainMin} min`,
    status: 'ok',
  }
}

// ─── Sen ─────────────────────────────────────────────────────────────────────

/**
 * Norma snu wg wieku (min).
 */
function sleepNormMin(ageMonths) {
  if (ageMonths < 3)  return { min: 14 * 60, max: 17 * 60 }
  if (ageMonths < 6)  return { min: 12 * 60, max: 15 * 60 }
  if (ageMonths < 12) return { min: 11 * 60, max: 14 * 60 }
  if (ageMonths < 24) return { min: 11 * 60, max: 14 * 60 }
  return                     { min: 10 * 60, max: 13 * 60 }
}

/**
 * interpretSleep(sleepLogs, ageMonths)
 * → { label, detail?, status }
 *
 * "Poniżej normy" / "W normie" / "Powyżej normy"
 * + ile godzin i ile do normy (jeśli poniżej).
 */
export function interpretSleep(sleepLogs, ageMonths) {
  const today = todayStr()
  const todayEntries = (sleepLogs || []).filter(l => l.date === today)
  const norm = sleepNormMin(ageMonths || 0)

  if (!todayEntries.length) {
    return {
      label: 'Brak snu dziś',
      detail: `Norma: ${Math.floor(norm.min / 60)}–${Math.floor(norm.max / 60)}h`,
      status: 'info',
    }
  }

  const totalMin = todayEntries.reduce((s, l) => s + (l.durationMin || 0), 0)
  const totalStr = fmtDuration(totalMin)
  const normMinH = Math.floor(norm.min / 60)
  const normMaxH = Math.floor(norm.max / 60)

  if (totalMin < norm.min * 0.75) {
    const brakMin = norm.min - totalMin
    return {
      label: 'Poniżej normy',
      detail: `${totalStr} z ${normMinH}–${normMaxH}h · brakuje ~${fmtDuration(brakMin)}`,
      status: 'warning',
    }
  }

  if (totalMin < norm.min) {
    return {
      label: 'Nieco poniżej normy',
      detail: `${totalStr} z ${normMinH}–${normMaxH}h`,
      status: 'info',
    }
  }

  if (totalMin > norm.max) {
    return {
      label: 'Powyżej normy',
      detail: `${totalStr} — norma to ${normMinH}–${normMaxH}h`,
      status: 'ok',
    }
  }

  return {
    label: 'W normie',
    detail: `${totalStr} z ${normMinH}–${normMaxH}h`,
    status: 'ok',
  }
}
