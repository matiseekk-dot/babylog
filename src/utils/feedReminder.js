import { t, getLocale } from '../i18n'

/**
 * Przypomnienie o karmieniu (v2.16.3).
 *
 * Po wpisie karmienia apka zapisuje users/{uid}/data/reminder_feed_{profileId}
 * = { fireAt, title, body, notified } — Cloud Function scheduleNotifications
 * wysyła push do rodzica i partnerów (functions/index.js → processFeedReminder).
 * fireAt to timestamp, więc strefa czasowa nie ma znaczenia; treść jest już
 * w języku apki. Preferencja (co ile przypominać) jest per urządzenie.
 */

const PREF_KEY = 'babylog_feed_reminder'          // minuty | 'off'
const SNOOZE_KEY = 'babylog_feed_reminder_snooze'  // timestamp "Nie teraz"
const SNOOZE_MS = 24 * 60 * 60 * 1000

export const FEED_REMINDER_OPTIONS = [120, 150, 180, 240]

/** @returns {number|'off'|null} minuty, 'off' albo null (jeszcze nie pytaliśmy) */
export function getFeedReminderPref() {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === 'off') return 'off'
    const n = Number(v)
    return n > 0 ? n : null
  } catch { return null }
}

export function setFeedReminderPref(value) {
  try { localStorage.setItem(PREF_KEY, String(value)) } catch {}
}

export function snoozeFeedReminderPrompt(now = Date.now()) {
  try { localStorage.setItem(SNOOZE_KEY, String(now)) } catch {}
}

/** Czy zapytać o przypomnienie po tym karmieniu. */
export function shouldAskFeedReminder(feedTs, now = Date.now()) {
  if (getFeedReminderPref() !== null) return false
  // Wpis z przeszłości (np. uzupełniany wieczorem) — przypomnienie bez sensu.
  if (now - feedTs > 60 * 60 * 1000) return false
  try {
    const snoozedAt = Number(localStorage.getItem(SNOOZE_KEY))
    if (snoozedAt && now - snoozedAt < SNOOZE_MS) return false
  } catch {}
  return true
}

/** Data i godzina wpisu (lokalne) → timestamp; bez nich — teraz. */
export function entryTimestamp(entry, now = Date.now()) {
  if (entry?.date && entry?.time) {
    const ts = new Date(`${entry.date}T${entry.time}:00`).getTime()
    if (!Number.isNaN(ts)) return ts
  }
  return now
}

export function formatClock(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 150 → "2,5 h" (PL/DE/FR/ES) / "2.5 h" (EN). */
export function formatHours(minutes) {
  const tag = { pl: 'pl-PL', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' }[getLocale()] || 'en-US'
  return `${new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }).format(minutes / 60)} h`
}

/**
 * Dokument przypomnienia albo null, gdy termin już minął (np. wpis sprzed
 * kilku godzin).
 */
export function buildFeedReminder({ feedTs, intervalMin, childName, now = Date.now() }) {
  const fireAt = feedTs + intervalMin * 60 * 1000
  if (fireAt < now + 60 * 1000) return null
  return {
    fireAt,
    feedTs,
    intervalMin,
    title: t('feed_reminder.push_title'),
    body: t('feed_reminder.push_body', { name: childName || '', time: formatClock(feedTs) }).replace(/^\s*—\s*/, ''),
    notified: false,
    createdAt: now,
  }
}
