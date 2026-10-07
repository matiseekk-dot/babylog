import { describe, it, expect } from 'vitest'
import { WEEKS, WEEK_MIN, WEEK_MAX, weekContent } from './pregnancyWeeks'

const LOCALES = ['pl', 'en', 'de', 'fr', 'es']

describe('pregnancyWeeks', () => {
  it('każdy tydzień od 4 do 41, wszystkie języki, bez myślników', () => {
    for (let w = WEEK_MIN; w <= WEEK_MAX; w++) {
      const d = WEEKS[w]
      expect(d, `tydzień ${w}`).toBeTruthy()
      expect(d.emoji).toBeTruthy()
      for (const field of ['size', 'baby', 'you']) {
        for (const l of LOCALES) {
          const text = d[field][l]
          expect(text, `${w} ${field} ${l}`).toBeTruthy()
          expect(text, `${w} ${field} ${l}`).not.toMatch(/[—–]/)
        }
      }
    }
  })

  it('weekContent: szablon z wielkością, zakres przycięty', () => {
    const c = weekContent(13, 'pl')
    expect(c.size).toBe('Maluszek jest mniej więcej wielkości cytryny')
    expect(c.week).toBe(13)
    expect(weekContent(2, 'en').week).toBe(4)
    expect(weekContent(43, 'de').week).toBe(41)
    expect(weekContent(20, 'xx').baby).toBe(WEEKS[20].baby.en)
  })
})
