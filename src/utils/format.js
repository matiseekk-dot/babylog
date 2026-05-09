/**
 * format.js — locale-aware formatters
 *
 * v2.11.33 — Phase 0.2 (Foundation for multi-country expansion).
 *
 * Każdy kraj ma własne konwencje:
 *   - PL: 1,5 kg | 38°C | 12.05.2026 | 99,99 zł
 *   - EN-US: 3.3 lb | 100.4°F | 05/12/2026 | $24.99
 *   - EN-GB: 1.5 kg | 38°C | 12/05/2026 | £19.99
 *   - DE: 1,5 kg | 38°C | 12.05.2026 | 24,99 €
 *
 * Apka wewnętrznie zawsze trzyma metric (kg, °C). Wyświetla per locale.
 * Storage: zawsze metric SI (interoperability + analytics).
 *
 * Decyzja temperatura: Polska + Niemcy + UK używają °C. Tylko US używa °F.
 * Dla US locale (planowanego) trzeba dodać konwersję °C → °F.
 *
 * Decyzja waga: Polska, Niemcy, UK, FR, ES używają kg. Tylko US używa lb/oz.
 *
 * Dla MVP DE+PL+EN: wszystko metric. US conversion dodany jako placeholder
 * gdy zacznie się Phase 2.
 */

import { getLocale } from '../i18n'

// ─── Date format ─────────────────────────────────────────────────────────────

/**
 * Format daty dla aktualnego locale.
 * @param {Date|number|string} date — Date, timestamp ms, lub ISO string
 * @param {object} options — { short: bool } — short = "12.05" zamiast "12.05.2026"
 * @returns {string}
 *
 * PL: "12.05.2026" / "12.05"
 * EN-US: "05/12/2026" / "05/12"
 * EN-GB: "12/05/2026" / "12/05"
 * DE: "12.05.2026" / "12.05."
 */
export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''

  const locale = getLocale()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  if (options.short) {
    if (locale === 'pl' || locale === 'de') return `${day}.${month}`
    return `${day}/${month}` // EN default
  }

  if (locale === 'pl') return `${day}.${month}.${year}`
  if (locale === 'de') return `${day}.${month}.${year}`
  // EN — US format (mm/dd/yyyy). UK będzie rozróżniony w Phase 2 jako 'en-GB'.
  return `${month}/${day}/${year}`
}

// ─── Time format ─────────────────────────────────────────────────────────────

/**
 * Format czasu (HH:MM 24h dla wszystkich naszych locales).
 * US używa AM/PM ale 24h jest też akceptowane → trzymamy 24h dla simplicity.
 * Phase 2 (en-US): rozważyć AM/PM toggle w settings.
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// ─── Number format ───────────────────────────────────────────────────────────

/**
 * Format liczby z separatorem dziesiętnym.
 *   PL/DE: przecinek (1,5)
 *   EN: kropka (1.5)
 *
 * @param {number} value
 * @param {object} options — { decimals: 1, unit: 'kg' }
 */
export function formatNumber(value, options = {}) {
  if (typeof value !== 'number' || isNaN(value)) return ''
  const decimals = options.decimals ?? 1
  const fixed = value.toFixed(decimals)

  const locale = getLocale()
  const formatted = (locale === 'pl' || locale === 'de')
    ? fixed.replace('.', ',')
    : fixed

  return options.unit ? `${formatted} ${options.unit}` : formatted //   = non-breaking space
}

// ─── Weight ──────────────────────────────────────────────────────────────────

/**
 * Format wagi. Storage zawsze w kg. Display per locale.
 * MVP: wszystkie wspierane locale używają kg. US (Phase 2) → konwersja na lb.
 *
 * @param {number} kg — waga w kilogramach
 * @param {object} options — { decimals: 2 } domyślnie
 */
export function formatWeight(kg, options = {}) {
  // const locale = getLocale()
  // if (locale === 'en-US') return formatNumber(kg * 2.20462, { decimals: 2, unit: 'lb' })
  return formatNumber(kg, { decimals: options.decimals ?? 2, unit: 'kg' })
}

// ─── Height ──────────────────────────────────────────────────────────────────

/**
 * Format wzrostu. Storage zawsze w cm. Display per locale.
 * @param {number} cm
 */
export function formatHeight(cm) {
  // const locale = getLocale()
  // if (locale === 'en-US') {
  //   const totalInches = cm / 2.54
  //   const feet = Math.floor(totalInches / 12)
  //   const inches = Math.round(totalInches % 12)
  //   return `${feet}'${inches}"`
  // }
  return formatNumber(cm, { decimals: 0, unit: 'cm' })
}

// ─── Temperature ─────────────────────────────────────────────────────────────

/**
 * Format temperatury. Storage zawsze w °C. Display per locale.
 * @param {number} celsius
 */
export function formatTemperature(celsius) {
  // const locale = getLocale()
  // if (locale === 'en-US') {
  //   const f = (celsius * 9/5) + 32
  //   return formatNumber(f, { decimals: 1, unit: '°F' })
  // }
  return formatNumber(celsius, { decimals: 1, unit: '°C' })
}

// ─── Currency ────────────────────────────────────────────────────────────────

/**
 * Format ceny per locale. Aktualnie używane przez paywall preview gdy ceny
 * są podawane jako liczby (premiumPlans.js już ma pre-formatted strings dla
 * MVP, ale gdy w przyszłości pricing będzie dynamic per region, te helpery
 * tu zadziałają).
 *
 * @param {number} amount
 * @param {string} currency — 'PLN' | 'EUR' | 'USD' | 'GBP'
 */
export function formatCurrency(amount, currency = null) {
  const locale = getLocale()
  // Default per locale jeśli currency nie podane
  const cur = currency ?? (locale === 'pl' ? 'PLN' : locale === 'de' ? 'EUR' : 'USD')

  const fixed = amount.toFixed(2)
  const formatted = (locale === 'pl' || locale === 'de') ? fixed.replace('.', ',') : fixed

  // Symbol position per currency
  switch (cur) {
    case 'PLN': return `${formatted} zł`
    case 'EUR': return locale === 'de' ? `${formatted} €` : `€${formatted}`
    case 'USD': return `$${formatted}`
    case 'GBP': return `£${formatted}`
    default: return `${formatted} ${cur}`
  }
}

// ─── Helpers dla relative time ───────────────────────────────────────────────

/**
 * "2h temu" / "2 godz. temu" / "vor 2 Std." / "2h ago"
 */
export function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  const locale = getLocale()
  if (locale === 'pl') {
    if (mins < 1) return 'teraz'
    if (mins < 60) return `${mins} min temu`
    if (hours < 24) return `${hours} godz. temu`
    return `${days} dni temu`
  }
  if (locale === 'de') {
    if (mins < 1) return 'jetzt'
    if (mins < 60) return `vor ${mins} Min.`
    if (hours < 24) return `vor ${hours} Std.`
    return `vor ${days} Tagen`
  }
  // EN default
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
