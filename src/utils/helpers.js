import { t } from '../i18n'
export function nowTime() {
  const d = new Date()
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0')
}

export function todayDate() {
  return new Date().toISOString().slice(0,10)
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

export function formatAge(months) {
  if (months < 1) return t('age.newborn')
  if (months === 1) return t('profiles.age.month', { count: 1 })
  if (months < 12) return t('profiles.age.months', { count: months })
  const y = Math.floor(months / 12)
  const m = months % 12
  if (m === 0) return y === 1 ? t('profiles.age.year', { count: 1 }) : t('age.years', { count: y })
  return t('profiles.age.years_months', { years: y, months: m })
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * displayMethod — mapuje wewnętrzną (polską) nazwę metody pomiaru temperatury
 * na przetłumaczony label z i18n.
 * Wartości w state to stringi polskie (legacy), ale wyświetlany tekst idzie przez i18n.
 */
export function displayMethod(method) {
  switch (method) {
    case 'Odbytniczo': return t('temp.method.rectal')
    case 'Pod pachą':  return t('temp.method.axillary')
    case 'W uchu':     return t('temp.method.ear')
    case 'Na czole':   return t('temp.method.forehead')
    default:           return method || ''
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USUNIĘTE W v2.7.1: calcParacetamol, calcIbuprofen
//
// Powód: Spokojny Rodzic nie jest wyrobem medycznym i nie wylicza dawek leków.
// Rodzic czyta dawkę z ulotki leku (ChPL) lub konsultuje z pediatrą/farmaceutą.
// Apka pokazuje wyłącznie informacje referencyjne z ulotek leków
// (minimalny wiek, odstępy, max dawek/24h, kontraindykacje) oraz pozwala
// zapisać FAKT podania leku (lek, ilość w ml, godzina) — bez rekomendacji
// co do ilości.
//
// Ta decyzja obniża ryzyko regulacyjne (MDR, URPL) i klasyfikację apki
// jako medical device software.
// ═══════════════════════════════════════════════════════════════════════════

export function getTempClass(temp) {
  if (temp < 36.0) return 'temp-sub'
  if (temp < 37.5) return 'temp-normal'
  if (temp < 38.5) return 'temp-fever'
  return 'temp-high'
}

export function getTempLabel(temp) {
  if (temp < 36.0) return t('temp.label.hypothermia')
  if (temp < 37.5) return t('temp.label.normal')
  if (temp < 38.5) return t('temp.label.fever')
  return t('temp.label.high_fever')
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6)
}

export const genId = uid
