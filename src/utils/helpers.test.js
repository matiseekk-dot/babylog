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

import { describe, test, expect } from 'vitest'
import { getTempClass, getTempLabel, nowTime, todayDate, formatDuration, uid, genId } from './helpers'

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
