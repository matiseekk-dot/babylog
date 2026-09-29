import { describe, test, expect } from 'vitest'
import { getTipForToday, _TIPS_FOR_TESTS as TIPS } from './dailyTips'

describe('porady dnia (v2.16.18)', () => {
  const LANGS = ['pl', 'en', 'de', 'fr', 'es']
  test('każda porada w 5 językach, bez długich myślników', () => {
    for (const [bucket, tips] of Object.entries(TIPS)) {
      for (const tip of tips) {
        for (const l of LANGS) {
          expect(tip[l], `${bucket} ${tip.emoji} ${l}`).toBeTruthy()
          expect(tip[l]).not.toMatch(/[—–]/)
        }
      }
    }
  })
  test('DE/FR/ES dostają własny tekst, nieznany język angielski', () => {
    const pl = getTipForToday(4, 'pl').text
    for (const l of ['de', 'fr', 'es']) expect(getTipForToday(4, l).text).not.toBe(pl)
    expect(getTipForToday(4, 'it').text).toBe(getTipForToday(4, 'en').text)
  })
})
