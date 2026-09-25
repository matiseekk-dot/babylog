/**
 * Czas lokalny rodzica → timestamp (v2.16.3).
 *
 * Wpisy w apce mają datę i godzinę lokalną ("2026-09-25", "14:00") bez strefy.
 * Cloud Functions działa w UTC, więc `new Date('2026-09-25T14:00:00')` dawało
 * 14:00 UTC = 16:00 w Polsce latem — push o lekach przychodził 2 h (zimą 1 h)
 * za późno. Apka zapisuje strefę użytkownika w users/{uid}/data/timezone,
 * a tutaj przeliczamy godzinę w tej strefie (Intl z pełnym ICU w Node 20).
 */

const DEFAULT_TIME_ZONE = 'Europe/Warsaw'

function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// Przesunięcie strefy względem UTC (ms) w danej chwili — uwzględnia czas letni.
function timeZoneOffsetMs(ts, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ts))
  const get = type => Number(parts.find(p => p.type === type).value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(ts / 1000) * 1000
}

/**
 * @param {string} date — YYYY-MM-DD (lokalnie u rodzica)
 * @param {string} time — HH:MM
 * @param {string} tz   — strefa IANA, np. 'Europe/Warsaw'
 * @returns {number|null} timestamp ms albo null przy złym formacie
 */
function localToTimestamp(date, time, tz = DEFAULT_TIME_ZONE) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '')
  const t = /^(\d{1,2}):(\d{2})$/.exec(time || '')
  if (!d || !t) return null
  const zone = isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE
  const naive = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2])
  // Dwa przebiegi — przy zmianie czasu przesunięcie w "naive" i w wyniku
  // może się różnić o godzinę.
  let ts = naive - timeZoneOffsetMs(naive, zone)
  ts = naive - timeZoneOffsetMs(ts, zone)
  return ts
}

module.exports = { DEFAULT_TIME_ZONE, isValidTimeZone, localToTimestamp }
