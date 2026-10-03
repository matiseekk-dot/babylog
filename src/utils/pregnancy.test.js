import { describe, it, expect } from 'vitest'
import {
  daysBetween, addDays, dueDateFromLmp, pregnancyProgress,
  isValidDueDate, isValidLmp, isValidBirthDate,
  withContractionTimes, contractionStats, formatMinSec, termDaysForLocale,
} from './pregnancy'

const at = (ymd, hm = '10:00') => new Date(`${ymd}T${hm}:00`)

describe('daty', () => {
  it('daysBetween liczy dni kalendarzowe, także przez zmianę czasu', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)   // 25.10 ma 25 godzin
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)   // 29.03 ma 23 godziny
    expect(daysBetween(at('2026-10-02', '23:59'), '2026-10-03')).toBe(1)
  })
  it('addDays i termin z ostatniej miesiączki (+280 dni)', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(dueDateFromLmp('2026-01-01')).toBe('2026-10-08')
  })
})

describe('pregnancyProgress', () => {
  it('25+5 to 26. tydzień, 2. trymestr', () => {
    // termin 2027-01-08 → początek 2026-04-03; 2026-09-30 = 180 dni = 25+5
    const p = pregnancyProgress('2027-01-08', at('2026-09-30'))
    expect(p.weeks).toBe(25)
    expect(p.days).toBe(5)
    expect(p.week).toBe(26)
    expect(p.trimester).toBe(2)
    expect(p.daysLeft).toBe(100)
  })
  it('granice trymestrów: 13+6 to jeszcze 1., 14+0 już 2., 28+0 już 3.', () => {
    const due = '2027-01-08'
    const start = addDays(due, -280)
    expect(pregnancyProgress(due, at(addDays(start, 13 * 7 + 6))).trimester).toBe(1)
    expect(pregnancyProgress(due, at(addDays(start, 14 * 7))).trimester).toBe(2)
    expect(pregnancyProgress(due, at(addDays(start, 28 * 7))).trimester).toBe(3)
  })
  it('w dniu terminu 40+0, po terminie daysLeft ujemne, procent nie ponad 100', () => {
    expect(pregnancyProgress('2026-10-02', at('2026-10-02'))).toMatchObject({ weeks: 40, days: 0, daysLeft: 0, percent: 100 })
    expect(pregnancyProgress('2026-10-02', at('2026-10-05'))).toMatchObject({ weeks: 40, days: 3, daysLeft: -3, percent: 100 })
  })
  it('zła data → null', () => {
    expect(pregnancyProgress('', at('2026-10-02'))).toBeNull()
  })
})

describe('walidacja dat', () => {
  const now = at('2026-10-02')
  it('termin: do 280 dni naprzód, do 4 tygodni wstecz', () => {
    expect(isValidDueDate('2027-07-09', now)).toBe(true)
    expect(isValidDueDate('2027-07-10', now)).toBe(false)
    expect(isValidDueDate('2026-09-04', now)).toBe(true)
    expect(isValidDueDate('2026-09-03', now)).toBe(false)
  })
  it('ostatnia miesiączka: nie w przyszłości, do 44 tygodni wstecz', () => {
    expect(isValidLmp('2026-10-03', now)).toBe(false)
    expect(isValidLmp('2026-10-02', now)).toBe(true)
    expect(isValidLmp(addDays('2026-10-02', -308), now)).toBe(true)
    expect(isValidLmp(addDays('2026-10-02', -309), now)).toBe(false)
  })
  it('data urodzenia: nie w przyszłości, od 22. tygodnia', () => {
    expect(isValidBirthDate('2026-10-02', '2026-10-10', now)).toBe(true)
    expect(isValidBirthDate('2026-10-03', '2026-10-10', now)).toBe(false)
    expect(isValidBirthDate('2026-09-01', '2027-01-05', now)).toBe(true)   // 126 dni przed terminem
    expect(isValidBirthDate('2026-08-31', '2027-01-05', now)).toBe(false)
  })
})

describe('skurcze', () => {
  const t0 = at('2026-10-02', '10:00').getTime()
  const min = 60 * 1000
  const list = [
    { id: 'c', start: t0 + 12 * min, end: null },                 // trwa
    { id: 'b', start: t0 + 6 * min, end: t0 + 6 * min + 50000 },  // 50 s
    { id: 'a', start: t0, end: t0 + 60000 },                      // 60 s
  ]
  it('czas trwania i odstęp od poprzedniego początku', () => {
    const rows = withContractionTimes(list)
    expect(rows.map(r => r.id)).toEqual(['c', 'b', 'a'])
    expect(rows[0]).toMatchObject({ durationSec: null, intervalSec: 360 })
    expect(rows[1]).toMatchObject({ durationSec: 50, intervalSec: 360 })
    expect(rows[2]).toMatchObject({ durationSec: 60, intervalSec: null })
  })
  it('podsumowanie ostatniej godziny pomija trwający skurcz i stare wpisy', () => {
    const old = { id: 'z', start: t0 - 2 * 60 * min, end: t0 - 2 * 60 * min + 30000 }
    const s = contractionStats([...list, old], t0 + 13 * min)
    expect(s).toEqual({ count: 2, avgDurationSec: 55, avgIntervalSec: 360 })
    expect(contractionStats([], t0)).toBeNull()
  })
  it('formatMinSec', () => {
    expect(formatMinSec(65)).toBe('1:05')
    expect(formatMinSec(0)).toBe('0:00')
    expect(formatMinSec(null)).toBe('')
  })
})

describe('Francja: termin 41 SA (287 dni)', () => {
  it('termDaysForLocale', () => {
    expect(termDaysForLocale('fr')).toBe(287)
    expect(termDaysForLocale('pl')).toBe(280)
    expect(termDaysForLocale('de')).toBe(280)
  })
  it('ten sam dzień od ostatniej miesiączki daje ten sam tydzień przy terminie +280 i +287', () => {
    const lmp = '2026-04-03'
    const now = at('2026-09-30')
    const pl = pregnancyProgress(dueDateFromLmp(lmp), now)
    const fr = pregnancyProgress(dueDateFromLmp(lmp, 287), now, 287)
    expect(dueDateFromLmp(lmp, 287)).toBe('2027-01-15')
    expect([fr.weeks, fr.days]).toEqual([pl.weeks, pl.days])
    expect(fr.daysLeft).toBe(pl.daysLeft + 7)
  })
  it('termin do 287 dni naprzód jest poprawny tylko przy 287', () => {
    const now = at('2026-10-02')
    expect(isValidDueDate(addDays('2026-10-02', 285), now)).toBe(false)
    expect(isValidDueDate(addDays('2026-10-02', 285), now, 287)).toBe(true)
  })
})
