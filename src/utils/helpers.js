import { t, getLocale } from '../i18n'
export function nowTime() {
  const d = new Date()
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0')
}

export function todayDate() {
  return dateYMD(new Date())
}

/**
 * dateYMD(d) — zwraca YYYY-MM-DD dla podanej daty w **lokalnej strefie czasowej**.
 *
 * UWAGA: Nie używaj `d.toISOString().slice(0,10)` — toISOString zawsze zwraca UTC,
 * co powoduje bug: wpis dodany 25 kwietnia o 01:17 PL (CEST, UTC+2) jest zapisywany
 * jako 2026-04-24 (23:17 UTC) i pojawia się w sekcji "wczoraj". Od v2.7.5 cała
 * apka liczy daty lokalnie.
 */
export function dateYMD(d) {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
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

/**
 * formatDate(dateStr) — "25 kwi 2026" / "Apr 25, 2026" wg aktualnego locale.
 *
 * UWAGA: NIE używamy Intl.DateTimeFormat ani toLocaleDateString() z parametrem
 * locale/options, bo iOS Safari bywa niespójny (ignoruje 'short' month, zwraca
 * pełną nazwę; czasem ignoruje locale). Ręczne stringi są deterministyczne.
 */
const MONTHS_SHORT_PL = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']
const MONTHS_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDate(dateStr) {
  if (!dateStr) return ''
  // T12:00:00 (midday lokalnie) — bezpieczne w każdej strefie czasowej i przy DST
  const d = new Date(dateStr + 'T12:00:00')
  if (isNaN(d.getTime())) return ''
  const day = d.getDate()
  const mIdx = d.getMonth()
  const year = d.getFullYear()
  const lang = getLocale()
  if (lang === 'en') {
    return `${MONTHS_SHORT_EN[mIdx]} ${day}, ${year}`
  }
  return `${day} ${MONTHS_SHORT_PL[mIdx]} ${year}`
}

/**
 * parseNum(str) — parsuje liczbę z inputa użytkownika akceptując
 * przecinek LUB kropkę jako decimal separator. Polska klawiatura numeryczna
 * domyślnie wpisuje przecinek; HTML `type="number"` nie zawsze to zjada.
 * Zwraca Number lub NaN.
 */
export function parseNum(str) {
  if (str === null || str === undefined || str === '') return NaN
  return Number(String(str).replace(',', '.'))
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
