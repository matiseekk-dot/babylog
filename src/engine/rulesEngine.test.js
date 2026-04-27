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

// v2.9.4: pomocniki spójnej LOKALNEJ daty i czasu.
// Apka zapisuje wpisy jako { date: 'YYYY-MM-DD', time: 'HH:MM' } gdzie OBA
// pochodzą ze stref lokalnej. Reguła `med_daily_limit` rekonstruuje
// timestamp przez `new Date(date + 'T' + time)` (też lokalna interpretacja).
//
// Mieszanie `d.toISOString().slice(0,10)` (UTC) z `d.toTimeString().slice(0,5)`
// (lokalny) tworzyło wpisy które wyglądały jak przesunięte o ±24h przy filtrach
// 24-godzinnych — paracCount=3 zamiast 4 i alert nie triggerował.
function localISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function localTimeHM(d) {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// v2.9.4: ctxBase ma teraz "healthy baseline" — normalne sleepLogs i feedLogs
// dla 12-miesięcznego dziecka.
// Powód: reguła `combined_critical` (rulesEngine.js linia 382) triggeruje
// gdy `temp >= 38 AND lowSleep AND lowFeed`. Z pustymi sleepLogs/feedLogs
// `lowSleep` i `lowFeed` zawsze były TRUE → false-positive critical alert
// dla testów które chciały izolować inne reguły (np. temp_critical).
// Z baseline: 480 min snu (8h) + 4 karmienia → combined_critical NIE odpala.
const baselineSleep = [
  { id: 's1', date: today, durationMin: 480, label: 'Drzemka', startTs: Date.now() - 8*60*60*1000, endTs: Date.now() - 1*60*60*1000 },
]
const baselineFeed = [
  { id: 'f1', date: today, time: '08:00', type: 'Pierś lewa',  amount: '15' },
  { id: 'f2', date: today, time: '11:00', type: 'Pierś prawa', amount: '15' },
  { id: 'f3', date: today, time: '14:00', type: 'Butelka',     amount: '120' },
  { id: 'f4', date: today, time: '17:00', type: 'Pierś lewa',  amount: '15' },
]

const ctxBase = {
  tempLogs: [],
  sleepLogs: baselineSleep,
  feedLogs: baselineFeed,
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
        // v2.9.4: lokalne (oba pola), spójne z apką
        date: localISODate(d),
        time: localTimeHM(d),
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
      { id: '1', med: 'Paracetamol', date: localISODate(now),     time: localTimeHM(now) },
      { id: '2', med: 'Paracetamol', date: localISODate(earlier), time: localTimeHM(earlier) },
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
