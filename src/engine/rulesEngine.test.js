import { describe, it, expect } from 'vitest'
import { evaluateRules } from './rulesEngine'

/**
 * v2.11.0 — MDR EXIT REFACTOR.
 *
 * Wcześniej testy weryfikowały reguły kliniczne klasyfikujące severity
 * (gorączka u niemowlaka → critical, 4× paracetamol → alert). v2.11.0
 * usuwa te reguły z silnika (apka wyłącza się z definicji MDSW pod MDR
 * Rule 11). Testy zostają pod hookiem nowej funkcjonalności:
 *   - reguły zachowane (temp_rising, feed_time) generują neutralne `info`
 *   - reguły usunięte NIE produkują już żadnych messages
 *   - kontrakt `{messages, topStatus}` niezmieniony — UI nie wybucha
 */

const today = new Date().toISOString().slice(0, 10)
const recentTime = new Date().toTimeString().slice(0, 5)

const ctxBase = {
  tempLogs: [],
  sleepLogs: [],
  feedLogs: [],
  medLogs: [],
  diaperLogs: [],
  ageMonths: 12,
  weightKg: 10,
}

describe('rulesEngine — MDR exit (severity rules removed)', () => {
  it('niemowlak <3mo + temp 38.2°C → BRAK critical/alert (MDR exit)', () => {
    const result = evaluateRules({
      ...ctxBase,
      ageMonths: 2,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 38.2 }],
    })
    expect(result.messages.some(m => m.status === 'critical')).toBe(false)
    expect(result.messages.some(m => m.status === 'alert')).toBe(false)
    // topStatus może być 'ok' lub 'info' — nigdy critical/alert/warning
    expect(['ok', 'info']).toContain(result.topStatus)
  })

  it('temp 40.6°C → BRAK critical (MDR exit, brak progów klinicznych)', () => {
    const result = evaluateRules({
      ...ctxBase,
      ageMonths: 36,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 40.6 }],
    })
    expect(result.messages.some(m => m.status === 'critical')).toBe(false)
    expect(result.messages.some(m => m.status === 'alert')).toBe(false)
  })

  it('4× paracetamol w 24h → BRAK alert (MDR exit, neutralny silnik)', () => {
    const logs = []
    for (let i = 0; i < 4; i++) {
      const d = new Date(Date.now() - i * 4 * 60 * 60 * 1000)
      logs.push({
        id: String(i),
        med: 'Paracetamol',
        date: d.toISOString().slice(0, 10),
        time: d.toTimeString().slice(0, 5),
      })
    }
    const result = evaluateRules({ ...ctxBase, medLogs: logs })
    expect(result.messages.some(m => m.status === 'alert')).toBe(false)
    expect(result.messages.some(m => m.status === 'critical')).toBe(false)
  })
})

describe('rulesEngine — observations zachowane', () => {
  it('temp_rising: 3 rosnące pomiary → info observation', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [
        { id: '1', date: today, time: '08:00', temp: 37.2 },
        { id: '2', date: today, time: '10:00', temp: 37.6 },
        { id: '3', date: today, time: '12:00', temp: 38.0 },
      ],
    })
    const rising = result.messages.find(m => m.id === 'temp_rising')
    expect(rising).toBeDefined()
    expect(rising.status).toBe('info')
  })

  it('temp_rising NIE odpala dla pomiarów nierosnących', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [
        { id: '1', date: today, time: '08:00', temp: 37.5 },
        { id: '2', date: today, time: '10:00', temp: 37.2 },
        { id: '3', date: today, time: '12:00', temp: 37.8 },
      ],
    })
    expect(result.messages.find(m => m.id === 'temp_rising')).toBeUndefined()
  })
})

describe('rulesEngine — wynik ma poprawną strukturę', () => {
  it('zawsze zwraca {messages, topStatus}', () => {
    const result = evaluateRules(ctxBase)
    expect(result).toHaveProperty('messages')
    expect(result).toHaveProperty('topStatus')
    expect(Array.isArray(result.messages)).toBe(true)
  })

  it('topStatus zawsze "ok" lub "info" (brak severity hierarchy)', () => {
    const result = evaluateRules(ctxBase)
    expect(['ok', 'info']).toContain(result.topStatus)
  })

  it('puste konteksty → brak crashu', () => {
    const result = evaluateRules({})
    expect(result.messages).toBeDefined()
  })

  it('null logs → brak crashu', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: null,
      medLogs: null,
    })
    expect(result.messages).toBeDefined()
  })
})
