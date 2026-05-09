/**
 * vaccinations.js — router LATAM-aware dla locale 'es'.
 *
 * v2.12.0 — Phase 3 LATAM: dodano warianty per kraj (MX/AR/CO).
 *
 * Hispanic America to gigantyczny rynek — 600M+ użytkowników. Każdy kraj
 * ma WŁASNY oficjalny calendar vacunal:
 *   - España (ES) → Calendario común CISNS / CAV-AEP (default fallback)
 *   - México (MX) → Cartilla Nacional CENSIA / Secretaría de Salud
 *   - Argentina (AR) → Calendario Nacional / Ministerio de Salud
 *   - Colombia (CO) → Esquema PAI / Minsalud
 *   - Inne LATAM (CL/PE/UY/etc.) → fallback do España + disclaimer
 *
 * Strategia: detect country sub-tag z navigator.language (es-MX, es-AR...)
 * przy module load, wybiera odpowiedni calendar. UI zawsze po hiszpańsku
 * (locale = 'es'), tylko content medyczny zmienia się per kraj.
 *
 * EDGE CASE: w środowisku bez navigator (SSR / testy) używamy default = ES.
 */

import calendarES from './calendars/spain'
import calendarMX from './calendars/mexico'
import calendarAR from './calendars/argentina'
import calendarCO from './calendars/colombia'

const CALENDARS = {
  ES: calendarES,
  MX: calendarMX,
  AR: calendarAR,
  CO: calendarCO,
}

/**
 * Wykrywa kod kraju z navigator.language.
 * Przykłady: 'es-MX' → 'MX', 'es-ES' → 'ES', 'es' (no region) → null.
 *
 * @returns {string|null} ISO 3166 country code lub null
 */
function detectSpanishCountry() {
  if (typeof navigator === 'undefined') return null
  // navigator.languages może mieć ['es-MX', 'es', 'en'] — łapiemy pierwszy es-XX
  const langs = navigator.languages || [navigator.language || '']
  for (const lang of langs) {
    const m = String(lang).match(/^es[-_]([A-Z]{2})/i)
    if (m) return m[1].toUpperCase()
  }
  return null
}

/**
 * Wybiera calendar dla danego country code.
 * Fallback: ES (Spain).
 */
export function getVaccinationsForCountry(countryCode) {
  return CALENDARS[countryCode] || CALENDARS.ES
}

// Default export: auto-detected calendar.
// Module init runs once — wartość jest "frozen" na czas trwania sesji.
// Jeśli user zmieni język w settings na es-MX z es-ES, refresh app jest
// potrzebny żeby content się zmienił (acceptable trade-off — calendar
// to nie data input użytkownika, tylko reference table).
const detectedCountry = detectSpanishCountry()
const selected = getVaccinationsForCountry(detectedCountry)

// Dla LATAM users innych niż MX/AR/CO — pokazujemy ES content z disclaimerem
// (powyższy CALENDARS lookup zwróci ES jako fallback, ale dodajemy meta-flag).
const isLatamFallback = detectedCountry &&
  !['ES', 'MX', 'AR', 'CO'].includes(detectedCountry)

export default {
  ...selected,
  // Meta info dla UI — czy pokazujemy disclaimer "to schemat hiszpański,
  // skonsultuj się z lokalnym pediatrą"
  _isLatamFallback: isLatamFallback,
  _detectedCountry: detectedCountry || 'ES',
}
