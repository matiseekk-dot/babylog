import { describe, it, expect, beforeEach } from 'vitest'
import { markFirstEntryTime, markReviewRequested, shouldRequestReview } from './review'

const DAY = 24 * 60 * 60 * 1000

describe('shouldRequestReview', () => {
  beforeEach(() => localStorage.clear())

  it('dopiero po 7 dniach i 10 wpisach', () => {
    const start = Date.now()
    markFirstEntryTime(start)
    expect(shouldRequestReview({ entryCount: 50, now: start + 6 * DAY })).toBe(false)
    expect(shouldRequestReview({ entryCount: 9, now: start + 8 * DAY })).toBe(false)
    expect(shouldRequestReview({ entryCount: 10, now: start + 8 * DAY })).toBe(true)
  })

  it('bez pierwszego wpisu — nie pytamy', () => {
    expect(shouldRequestReview({ entryCount: 100 })).toBe(false)
  })

  it('najwyżej raz na 120 dni; pierwszy wpis zapisywany tylko raz', () => {
    const start = Date.now()
    markFirstEntryTime(start)
    markFirstEntryTime(start + 5 * DAY)  // nie nadpisuje
    markReviewRequested(start + 8 * DAY)
    expect(shouldRequestReview({ entryCount: 20, now: start + 30 * DAY })).toBe(false)
    expect(shouldRequestReview({ entryCount: 20, now: start + 130 * DAY })).toBe(true)
  })
})
