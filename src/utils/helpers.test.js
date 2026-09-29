/**
 * TESTY HELPERS
 *
 * W v2.7.1 usunięto kalkulatory dawek leków (calcParacetamol, calcIbuprofen)
 * — apka nie wylicza dawek, tylko pokazuje informacje referencyjne z ulotek.
 * Testy kalkulatorów zostały usunięte wraz z funkcjami.
 *
 * Uruchomienie:
 *   npx vitest run src/utils/helpers.test.js
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { getTempClass, getTempLabel, nowTime, todayDate, formatDuration, uid, genId, sleepMinutes, dateYMD, monthsFromBirthDate, birthDateFromMonths, withCurrentAge, timerSleepEntry, shortDate } from './helpers'

describe('getTempClass', () => {
  test('hipotermia <36.0', () => {
    expect(getTempClass(35.5)).toBe('temp-sub')
    expect(getTempClass(35.9)).toBe('temp-sub')
  })

  test('norma 36.0-37.4', () => {
    expect(getTempClass(36.0)).toBe('temp-normal')
    expect(getTempClass(36.6)).toBe('temp-normal')
    expect(getTempClass(37.4)).toBe('temp-normal')
  })

  test('gorączka 37.5-38.4', () => {
    expect(getTempClass(37.5)).toBe('temp-fever')
    expect(getTempClass(38.0)).toBe('temp-fever')
    expect(getTempClass(38.4)).toBe('temp-fever')
  })

  test('wysoka gorączka ≥38.5', () => {
    expect(getTempClass(38.5)).toBe('temp-high')
    expect(getTempClass(39.5)).toBe('temp-high')
    expect(getTempClass(40.5)).toBe('temp-high')
  })

  test('brzegi przedziałów', () => {
    // 36.0 to granica hipotermia/norma — norma
    expect(getTempClass(36.0)).toBe('temp-normal')
    // 37.5 to granica norma/gorączka — gorączka
    expect(getTempClass(37.5)).toBe('temp-fever')
    // 38.5 to granica gorączka/wysoka — wysoka
    expect(getTempClass(38.5)).toBe('temp-high')
  })
})

describe('nowTime', () => {
  test('zwraca format HH:MM', () => {
    const t = nowTime()
    expect(t).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('todayDate', () => {
  test('zwraca format YYYY-MM-DD', () => {
    const d = todayDate()
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatDuration', () => {
  test('0 sekund', () => {
    expect(formatDuration(0)).toBe('00:00:00')
  })
  test('1 minuta', () => {
    expect(formatDuration(60)).toBe('00:01:00')
  })
  test('1 godzina 30 min', () => {
    expect(formatDuration(5400)).toBe('01:30:00')
  })
  test('2 godziny 15 min 30 s', () => {
    expect(formatDuration(8130)).toBe('02:15:30')
  })
})

describe('uid / genId', () => {
  test('uid zwraca string', () => {
    const id = uid()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(4)
  })
  test('kolejne wywołania są różne', () => {
    const a = uid()
    const b = uid()
    expect(a).not.toBe(b)
  })
  test('genId to alias uid', () => {
    expect(genId).toBe(uid)
  })
})

describe('sleepMinutes (v2.16.15, zmiana czasu)', () => {
  let tz
  beforeAll(() => { tz = process.env.TZ; process.env.TZ = 'Europe/Warsaw' })
  afterAll(() => { if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz })

  test('zwykła noc i drzemka', () => {
    expect(sleepMinutes('2026-09-29', '20:00', '07:00')).toBe(11 * 60)
    expect(sleepMinutes('2026-09-29', '13:15', '14:45')).toBe(90)
  })
  test('25.10 zegar cofa się o godzinę: 20:00 do 7:00 to 12 h', () => {
    expect(sleepMinutes('2026-10-24', '20:00', '07:00')).toBe(12 * 60)
  })
  test('29.03 zegar idzie do przodu: 20:00 do 7:00 to 10 h', () => {
    expect(sleepMinutes('2026-03-28', '20:00', '07:00')).toBe(10 * 60)
  })
})

describe('dateYMD: data lokalna, nie UTC', () => {
  let tz
  beforeAll(() => { tz = process.env.TZ; process.env.TZ = 'Europe/Warsaw' })
  afterAll(() => { if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz })

  test('lokalna północ to ten sam dzień (toISOString dawał poprzedni)', () => {
    const midnight = new Date(2026, 8, 29, 0, 0, 0)
    expect(dateYMD(midnight)).toBe('2026-09-29')
    expect(midnight.toISOString().slice(0, 10)).toBe('2026-09-28')
  })
})

describe('wiek dziecka z daty urodzenia (v2.16.17)', () => {
  const at = new Date(2026, 8, 29, 12)
  test('pełne miesiące, dzień miesiąca się liczy', () => {
    expect(monthsFromBirthDate('2026-06-29', at)).toBe(3)
    expect(monthsFromBirthDate('2026-06-30', at)).toBe(2)
    expect(monthsFromBirthDate('2026-09-29', at)).toBe(0)
    expect(monthsFromBirthDate('', at)).toBe(null)
  })
  test('data urodzenia z wieku i z powrotem', () => {
    expect(birthDateFromMonths(3, at)).toBe('2026-06-29')
    expect(birthDateFromMonths(0, at)).toBe('2026-09-29')
    // 31 marca minus miesiąc = 28 lutego, nie 3 marca
    expect(birthDateFromMonths(1, new Date(2026, 2, 31, 12))).toBe('2026-02-28')
    for (const m of [0, 1, 5, 11, 12, 25, 60]) expect(monthsFromBirthDate(birthDateFromMonths(m, at), at)).toBe(m)
  })
  test('profil: wiek rośnie z czasem, bez daty zostaje jak był', () => {
    const p = { id: 'x', months: 2, birthDate: birthDateFromMonths(2, new Date(2026, 2, 1, 12)) }
    expect(withCurrentAge(p).months).toBeGreaterThanOrEqual(8)
    const old = { id: 'y', months: 4 }
    expect(withCurrentAge(old)).toBe(old)
  })
})

describe('sen ze stopera (v2.16.18)', () => {
  test('noc liczy się do dnia zakończenia i jest snem nocnym', () => {
    const e = timerSleepEntry(new Date(2026, 8, 28, 20, 0).getTime(), new Date(2026, 8, 29, 6, 30).getTime())
    expect(e.date).toBe('2026-09-29')
    expect(e.durationMin).toBe(630)
    expect(e.label).toBe('Sen nocny')
  })
  test('drzemka w dzień zostaje drzemką', () => {
    const e = timerSleepEntry(new Date(2026, 8, 29, 13, 0).getTime(), new Date(2026, 8, 29, 14, 15).getTime())
    expect(e.date).toBe('2026-09-29')
    expect(e.label).toBe('Drzemka')
  })
})

describe('shortDate (oś wykresów)', () => {
  test('dzień.miesiąc, pusta data bez błędu', () => {
    expect(shortDate('2026-09-28')).toMatch(/^(28\.09|09\/28)$/)
    expect(shortDate('')).toBe('')
    expect(shortDate(undefined)).toBe('')
  })
})
