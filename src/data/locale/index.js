/**
 * locale/index.js — content abstraction layer per kraj
 *
 * v2.11.33 — Phase 0.3 Foundation dla multi-country.
 *
 * Każdy kraj ma własne pediatric content (vaccination schedules, medication
 * leaflets, growth references). Zamiast hard-coded "PSO" w komponentach,
 * wybieramy content per current locale.
 *
 * Aktualnie obsługujemy 2 typy content:
 *   - vaccinations (PSO PL, STIKO DE, CDC US — placeholder)
 *   - medicationInfo (ChPL PL, Fachinformation DE, FDA labels US — placeholder)
 *
 * UŻYCIE:
 *   import { getLocaleContent } from '@/data/locale'
 *   const vaccinations = getLocaleContent('vaccinations')  // current locale
 *
 * Dla EN użytkownika (international default), fallback do US version.
 * Dla DE user → STIKO. Dla PL user → PSO.
 */

import { getLocale } from '../../i18n'

import vaccinationsPL from './pl/vaccinations'
import vaccinationsDE from './de/vaccinations'
import vaccinationsEN from './en/vaccinations'

import medicationInfoPL from './pl/medicationInfo'
import medicationInfoDE from './de/medicationInfo'
import medicationInfoEN from './en/medicationInfo'

const CONTENT = {
  vaccinations: {
    pl: vaccinationsPL,
    de: vaccinationsDE,
    en: vaccinationsEN,
  },
  medicationInfo: {
    pl: medicationInfoPL,
    de: medicationInfoDE,
    en: medicationInfoEN,
  },
}

/**
 * Pobiera content per aktualnego locale, z fallback do EN.
 * @param {string} type — 'vaccinations' | 'medicationInfo'
 */
export function getLocaleContent(type) {
  const locale = getLocale()
  const bucket = CONTENT[type]
  if (!bucket) {
    console.warn(`[locale] Unknown content type: ${type}`)
    return null
  }
  return bucket[locale] ?? bucket.en ?? bucket.pl
}
