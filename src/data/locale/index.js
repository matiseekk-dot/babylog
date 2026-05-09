/**
 * locale/index.js — content abstraction layer per kraj
 *
 * v2.11.33 — Phase 0.3 Foundation dla multi-country.
 * v2.12.0 — Phase 2+3: dodano FR (Calendrier vaccinal + RCP) i ES (CAV-AEP + Ficha técnica AEMPS).
 *
 * Każdy kraj ma własne pediatric content (vaccination schedules, medication
 * leaflets, growth references). Zamiast hard-coded "PSO" w komponentach,
 * wybieramy content per current locale.
 *
 * Aktualnie obsługujemy 2 typy content:
 *   - vaccinations (PSO PL, STIKO DE, Calendrier FR, CAV-AEP ES, CDC EN-placeholder)
 *   - medicationInfo (ChPL PL, Fachinformation DE, RCP FR, AEMPS ES, FDA EN-placeholder)
 *
 * UŻYCIE:
 *   import { getLocaleContent } from '@/data/locale'
 *   const vaccinations = getLocaleContent('vaccinations')  // current locale
 *
 * Dla EN użytkownika (international default), fallback do US version.
 * Dla DE user → STIKO. Dla PL user → PSO. Dla FR user → Calendrier vaccinal.
 * Dla ES user → CAV-AEP (Spain). Dla LATAM (es-MX, es-AR...) — też ES content
 * z disclaimerem że to "Calendario español, consultar pediatra para schemat lokalny".
 */

import { getLocale } from '../../i18n'

import vaccinationsPL from './pl/vaccinations'
import vaccinationsDE from './de/vaccinations'
import vaccinationsEN from './en/vaccinations'
import vaccinationsFR from './fr/vaccinations'
import vaccinationsES from './es/vaccinations'

import medicationInfoPL from './pl/medicationInfo'
import medicationInfoDE from './de/medicationInfo'
import medicationInfoEN from './en/medicationInfo'
import medicationInfoFR from './fr/medicationInfo'
import medicationInfoES from './es/medicationInfo'

const CONTENT = {
  vaccinations: {
    pl: vaccinationsPL,
    de: vaccinationsDE,
    en: vaccinationsEN,
    fr: vaccinationsFR,
    es: vaccinationsES,
  },
  medicationInfo: {
    pl: medicationInfoPL,
    de: medicationInfoDE,
    en: medicationInfoEN,
    fr: medicationInfoFR,
    es: medicationInfoES,
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
