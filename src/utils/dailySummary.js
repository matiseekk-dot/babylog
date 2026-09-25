import { getLocale } from '../i18n'

/**
 * Wieczorne podsumowanie dnia (v2.16.4).
 *
 * Ustawienie users/{uid}/data/daily_summary = { hour } — osobiste (u partnera
 * jego własne), push wysyła Cloud Function o tej godzinie w strefie
 * użytkownika (functions/index.js → processDailySummary). null = wyłączone.
 */

export const DAILY_SUMMARY_HOURS = [19, 20, 21, 22]
export const DEFAULT_SUMMARY_HOUR = 20

/** 20 → "20:00" (pl/de/fr/es) / "8:00 PM" (en). */
export function formatHourLabel(hour) {
  const tag = { pl: 'pl-PL', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' }[getLocale()] || 'en-US'
  const d = new Date(2026, 0, 1, hour, 0)
  return new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit' }).format(d)
}
