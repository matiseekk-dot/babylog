import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildFeedReminder, entryTimestamp, formatClock, getFeedReminderPref, setFeedReminderPref,
  shouldAskFeedReminder, snoozeFeedReminderPrompt,
} from './feedReminder'

const H = 60 * 60 * 1000

describe('feedReminder', () => {
  beforeEach(() => localStorage.clear())

  it('entryTimestamp: data i godzina lokalna, bez nich — teraz', () => {
    const ts = entryTimestamp({ date: '2026-09-25', time: '14:30' })
    expect(formatClock(ts)).toBe('14:30')
    expect(entryTimestamp({}, 123)).toBe(123)
  })

  it('pyta tylko o świeże karmienie, bez decyzji i bez odłożenia', () => {
    const now = Date.now()
    expect(shouldAskFeedReminder(now, now)).toBe(true)
    expect(shouldAskFeedReminder(now - 2 * H, now)).toBe(false)   // wpis z przeszłości
    snoozeFeedReminderPrompt(now)
    const later = now + 25 * H
    expect(shouldAskFeedReminder(now + H, now + H)).toBe(false)    // "Nie teraz" < 24 h
    expect(shouldAskFeedReminder(later, later)).toBe(true)
    setFeedReminderPref(180)
    expect(shouldAskFeedReminder(later, later)).toBe(false)        // już wybrał
  })

  it('preferencja: minuty, off albo brak', () => {
    expect(getFeedReminderPref()).toBeNull()
    setFeedReminderPref(150)
    expect(getFeedReminderPref()).toBe(150)
    setFeedReminderPref('off')
    expect(getFeedReminderPref()).toBe('off')
  })

  it('buildFeedReminder: termin, treść, pomija przeszłe', () => {
    const now = Date.now()
    const r = buildFeedReminder({ feedTs: now, intervalMin: 180, childName: 'Zosia', now })
    expect(r.fireAt).toBe(now + 3 * H)
    expect(r.notified).toBe(false)
    expect(r.body).toContain('Zosia')
    expect(r.body).toContain(formatClock(now))
    expect(buildFeedReminder({ feedTs: now - 4 * H, intervalMin: 180, now })).toBeNull()
    expect(buildFeedReminder({ feedTs: now, intervalMin: 180, childName: '', now }).body).not.toMatch(/^\s*—/)
  })
})
