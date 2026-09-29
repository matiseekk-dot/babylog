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

/**
 * Wpis snu ze stopera (v2.16.18). Data = dzień zakończenia: noc 20:00-6:00
 * liczy się do dnia, w którym się skończyła (tak jak wpis ręczny robiony rano),
 * inaczej rano "Dziś" pokazywało brak snu. Długi sen zaczęty wieczorem to sen
 * nocny, nie drzemka.
 */
export function timerSleepEntry(startTs, endTs = Date.now()) {
  const durationMin = Math.max(0, Math.round((endTs - startTs) / 60000))
  const startHour = new Date(startTs).getHours()
  const night = durationMin >= 180 && (startHour >= 18 || startHour < 6)
  return {
    id: genId(),
    date: dateYMD(new Date(endTs)),
    durationMin,
    label: night ? 'Sen nocny' : 'Drzemka',
    manual: false,
    startTs,
    endTs,
  }
}

/**
 * Wpis z formularza (v2.16.17): wyczyszczone pole daty = dziś, godziny = teraz.
 * Bez tego wpis bez daty znikał z listy (nie należał do żadnego dnia).
 */
export function fillDateTime(form) {
  const filled = { ...form, date: form.date || todayDate() }
  if ('time' in form) filled.time = form.time || nowTime()
  return filled
}

/**
 * Wiek dziecka (v2.16.17). Wcześniej profil trzymał tylko liczbę `months`
 * z dnia onboardingu, więc wiek nigdy nie rósł (ibuprofen zablokowany na stałe,
 * percentyle WHO liczone dla wieku sprzed miesięcy). Teraz źródłem jest
 * birthDate, a months liczymy na dziś.
 */
export function monthsFromBirthDate(birthDate, now = new Date()) {
  const d = new Date(`${birthDate}T12:00:00`)
  if (!birthDate || isNaN(d.getTime())) return null
  let m = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  if (now.getDate() < d.getDate()) m--
  return Math.max(0, m)
}

/** Data urodzenia, przy której dziecko ma `months` pełnych miesięcy w dniu `at`. */
export function birthDateFromMonths(months, at = new Date()) {
  const d = new Date(at.getFullYear(), at.getMonth(), 1, 12)
  d.setMonth(d.getMonth() - (Number(months) || 0))
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(at.getDate(), lastDay))
  return dateYMD(d)
}

/** Profil z `months` policzonym na dziś (gdy znamy datę urodzenia). */
export function withCurrentAge(profile) {
  if (!profile?.birthDate) return profile
  const months = monthsFromBirthDate(profile.birthDate)
  return months == null || months === profile.months ? profile : { ...profile, months }
}

/**
 * sleepMinutes(date, startTime, endTime) — minuty snu od startTime do endTime
 * (HH:MM), start w dniu date, koniec wcześniej niż start = następny dzień.
 * Liczone z prawdziwych dat, nie z tarczy zegara (v2.16.15), więc noc zmiany
 * czasu wychodzi poprawnie: 25.10, 20:00 do 7:00 = 12 h, a nie 11 h.
 */
export function sleepMinutes(date, startTime, endTime) {
  const start = new Date(`${date}T${startTime}:00`)
  const end = new Date(`${date}T${endTime}:00`)
  if (endTime < startTime) end.setDate(end.getDate() + 1)
  return Math.round((end - start) / 60000)
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
// v2.16.10: DE/FR/ES widziały wcześniej polskie skróty miesięcy ("29 wrz 2026").
const MONTHS_SHORT_DE = ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sept.','Okt.','Nov.','Dez.']
const MONTHS_SHORT_FR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
const MONTHS_SHORT_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic']

/** Krótka data na osi wykresu: 28.09 (PL/DE/FR/ES) albo 09/28 (EN). */
export function shortDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || '')
  if (!m) return ''
  return getLocale() === 'en' ? `${m[2]}/${m[3]}` : `${m[3]}.${m[2]}`
}

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
  if (lang === 'de') return `${day}. ${MONTHS_SHORT_DE[mIdx]} ${year}`
  if (lang === 'fr') return `${day} ${MONTHS_SHORT_FR[mIdx]} ${year}`
  if (lang === 'es') return `${day} ${MONTHS_SHORT_ES[mIdx]} ${year}`
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

/**
 * displayFeedType — mapuje wewnętrzną (polską) nazwę typu karmienia na
 * przetłumaczony label z i18n. Analogicznie do displayMethod.
 * Używane w CSV/PDF eksportach + w dowolnym UI gdzie pokazujemy l.type.
 */
export function displayFeedType(type) {
  switch (type) {
    case 'Pierś lewa':         return t('feed.type.left')
    case 'Pierś prawa':        return t('feed.type.right')
    case 'Butelka':            return t('feed.type.bottle')
    case 'Odciągnięte mleko':  return t('feed.type.pumped')
    default:                   return type || ''
  }
}

/**
 * displaySleepLabel / displayDiaperType — jak wyżej, dla rodzaju snu i pieluchy
 * (v2.16.16: raport PDF i CSV pokazywały te wartości po polsku w każdym języku).
 */
const SLEEP_LABEL_KEYS = {
  'Drzemka': 'sleep.type.nap', nap: 'sleep.type.nap',
  'Sen nocny': 'sleep.type.night', night: 'sleep.type.night',
}
export function displaySleepLabel(label) {
  const key = SLEEP_LABEL_KEYS[label]
  return key ? t(key) : (label || '')
}

const DIAPER_TYPE_KEYS = {
  'Mokra': 'diaper.wet', 'Brudna': 'diaper.dirty', 'Obydwie': 'diaper.both',
  'Nocnik-siku': 'diaper.potty_pee', 'Nocnik-kupa': 'diaper.potty_poo',
  'Siku': 'diaper.toilet_pee', 'Kupa': 'diaper.toilet_poo',
}
export function displayDiaperType(type) {
  const key = DIAPER_TYPE_KEYS[type]
  return key ? t(key) : (type || '')
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
