/**
 * Teksty powiadomień push w 5 językach apki (v2.16.4).
 *
 * Wcześniej push o lekach był zawsze po polsku. Apka zapisuje język
 * użytkownika w users/{uid}/data/app_locale; brak → 'pl' (starsze wersje apki).
 *
 * Push o lekach — celowo neutralny (MDR): informuje, że minął odstęp od
 * dawki, decyzję o kolejnej zostawia rodzicowi i ulotce.
 */

const SUPPORTED = ['pl', 'en', 'de', 'fr', 'es']
const DEFAULT_LOCALE = 'pl'

const TEXT = {
  pl: {
    medTitle: med => `Minął odstęp od ostatniej dawki ${med}`,
    medBody: time => `Podałeś/-aś o ${time}. Sprawdź czy potrzebna kolejna dawka (zgodnie z ulotką).`,
    summaryTitle: 'Podsumowanie dnia',
    feeds: 'Karmienia', sleep: 'Sen', diapers: 'Pieluchy', toilet: 'Toaleta',
    duration: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
  },
  en: {
    medTitle: med => `Dose interval passed: ${med}`,
    medBody: time => `Given at ${time}. Check whether another dose is needed (per the leaflet).`,
    summaryTitle: 'Summary of the day',
    feeds: 'Feedings', sleep: 'Sleep', diapers: 'Diapers', toilet: 'Toilet',
    duration: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
  },
  de: {
    medTitle: med => `Dosisabstand für ${med} ist vorbei`,
    medBody: time => `Gegeben um ${time}. Prüfen Sie, ob eine weitere Dosis nötig ist (laut Beipackzettel).`,
    summaryTitle: 'Tageszusammenfassung',
    feeds: 'Mahlzeiten', sleep: 'Schlaf', diapers: 'Windeln', toilet: 'Toilette',
    duration: (h, m) => (h ? `${h} Std. ${m} Min.` : `${m} Min.`),
  },
  fr: {
    medTitle: med => `Intervalle écoulé depuis la dernière dose de ${med}`,
    medBody: time => `Donné à ${time}. Vérifiez si une autre dose est nécessaire (selon la notice).`,
    summaryTitle: 'Résumé de la journée',
    feeds: 'Repas', sleep: 'Sommeil', diapers: 'Couches', toilet: 'Toilettes',
    duration: (h, m) => (h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`),
  },
  es: {
    medTitle: med => `Ha pasado el intervalo desde la última dosis de ${med}`,
    medBody: time => `Administrado a las ${time}. Comprueba si hace falta otra dosis (según el prospecto).`,
    summaryTitle: 'Resumen del día',
    feeds: 'Tomas', sleep: 'Sueño', diapers: 'Pañales', toilet: 'Baño',
    duration: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
  },
}

function normalizeLocale(locale) {
  return SUPPORTED.includes(locale) ? locale : DEFAULT_LOCALE
}

function medPushText(locale, med, time) {
  const L = TEXT[normalizeLocale(locale)]
  return { title: L.medTitle(med), body: L.medBody(time) }
}

/**
 * @param {string} locale
 * @param {{ name: string, feeds: number, sleepMin: number, diapers: number, toiletMode?: string }[]} kids
 * @returns {{ title: string, body: string } | null} null gdy dziś nic nie zapisano
 */
function dailySummaryText(locale, kids) {
  const L = TEXT[normalizeLocale(locale)]
  const lines = kids.map(k => {
    const parts = []
    if (k.feeds) parts.push(`${L.feeds}: ${k.feeds}`)
    if (k.sleepMin) parts.push(`${L.sleep}: ${L.duration(Math.floor(k.sleepMin / 60), k.sleepMin % 60)}`)
    if (k.diapers) parts.push(`${k.toiletMode && k.toiletMode !== 'diapers' ? L.toilet : L.diapers}: ${k.diapers}`)
    return parts.length ? { name: k.name, text: parts.join(' · ') } : null
  }).filter(Boolean)

  if (!lines.length) return null
  if (kids.length === 1) {
    const name = lines[0].name
    return { title: name ? `${L.summaryTitle} — ${name}` : L.summaryTitle, body: lines[0].text }
  }
  return { title: L.summaryTitle, body: lines.map(l => `${l.name}: ${l.text}`).join('\n') }
}

module.exports = { SUPPORTED, DEFAULT_LOCALE, normalizeLocale, medPushText, dailySummaryText }
