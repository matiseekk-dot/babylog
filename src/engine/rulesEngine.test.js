import { describe, it, expect } from 'vitest'
import { evaluateRules } from './rulesEngine'

/**
 * Smoke tests dla rulesEngine — sanity check że krytyczne reguły kliniczne
 * nadal działają. Nie pokrywa wszystkiego, ale chroni przed regresjami
 * w najbardziej ryzykownych progach (gorączka u niemowlaka, ekstremalna temp,
 * przekroczenie limitu dobowego dawek).
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

describe('rulesEngine — fever rules', () => {
  it('niemowlak <3mo + temp >=38°C → critical (AAP 2021)', () => {
    const result = evaluateRules({
      ...ctxBase,
      ageMonths: 2,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 38.2 }],
    })
    const critical = result.messages.find(m => m.status === 'critical')
    expect(critical).toBeDefined()
    expect(critical.title).toBeTruthy()
  })

  it('temp >=40.5°C → critical w każdym wieku', () => {
    const result = evaluateRules({
      ...ctxBase,
      ageMonths: 36,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 40.6 }],
    })
    expect(result.messages.some(m => m.status === 'critical')).toBe(true)
  })

  it('temp 38.5-39 + dziecko >=6mo → alert (nie critical)', () => {
    const result = evaluateRules({
      ...ctxBase,
      ageMonths: 12,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 38.7 }],
    })
    expect(result.messages.some(m => m.status === 'alert')).toBe(true)
    expect(result.messages.some(m => m.status === 'critical')).toBe(false)
  })

  it('temp poniżej progów → brak fever alertu', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 37.2 }],
    })
    const feverMsgs = result.messages.filter(m =>
      m.status === 'alert' || m.status === 'critical'
    )
    expect(feverMsgs.length).toBe(0)
  })
})

describe('rulesEngine — medication rules', () => {
  it('4× paracetamol w 24h → med_daily_limit alert', () => {
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
    const limitMsg = result.messages.find(m => m.status === 'alert')
    expect(limitMsg).toBeDefined()
  })

  it('paracetamol 2× w odstępie 5h → bez med_daily_limit', () => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 5 * 60 * 60 * 1000)
    const logs = [
      { id: '1', med: 'Paracetamol', date: now.toISOString().slice(0,10), time: now.toTimeString().slice(0,5) },
      { id: '2', med: 'Paracetamol', date: earlier.toISOString().slice(0,10), time: earlier.toTimeString().slice(0,5) },
    ]
    const result = evaluateRules({ ...ctxBase, medLogs: logs })
    // Może mieć alerty z innych powodów, ale nie z med_daily_limit
    const limitMsg = result.messages.find(m =>
      m.title?.toLowerCase().includes('limit') || m.title?.toLowerCase().includes('dobow')
    )
    expect(limitMsg).toBeUndefined()
  })
})

describe('rulesEngine — wynik ma poprawną strukturę', () => {
  it('zawsze zwraca {messages, topStatus}', () => {
    const result = evaluateRules(ctxBase)
    expect(result).toHaveProperty('messages')
    expect(result).toHaveProperty('topStatus')
    expect(Array.isArray(result.messages)).toBe(true)
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
