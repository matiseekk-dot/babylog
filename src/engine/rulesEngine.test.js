import { describe, it, expect } from 'vitest'
import { evaluateRules, getSectionObservations } from './rulesEngine'

/**
 * Smoke tests dla rulesEngine — v2.10.5 MDR EXIT REFACTOR.
 *
 * GŁÓWNA ZMIANA vs v2.10.4:
 *   Engine NIE generuje już clinical assessments z statusami severity.
 *   Zwraca neutralne observations (type: 'info' | 'reference').
 *
 * Reguły usunięte (NIE wracają — to MDR exit):
 *   temp_infant_emergency, temp_extreme, temp_critical, temp_alert,
 *   temp_young_infant, combined_critical, sleep_deficit, med_not_working,
 *   med_too_soon, med_daily_limit, med_expired, no_entries_today, all_ok
 *
 *   Apka pokazuje statyczne tabele PTP/AAP w komponentach ReferenceLibrary
 *   i WhenToSeekHelpCard zamiast personalized clinical output.
 *
 * Reguły zachowane (jako neutralne observations):
 *   temp_rising, temp_reference_available, feed_time, med_interval_passed,
 *   med_count_24h
 */

const today = new Date().toISOString().slice(0, 10)
const recentTime = new Date().toTimeString().slice(0, 5)

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

describe('rulesEngine — struktura odpowiedzi (v2.10.5)', () => {
  it('zwraca obiekt z polem observations', () => {
    const result = evaluateRules(ctxBase)
    expect(result).toHaveProperty('observations')
    expect(Array.isArray(result.observations)).toBe(true)
  })

  it('puste konteksty → brak crashu', () => {
    const result = evaluateRules({})
    expect(result.observations).toBeDefined()
    expect(Array.isArray(result.observations)).toBe(true)
  })

  it('null logs → brak crashu', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: null,
      medLogs: null,
      sleepLogs: null,
      feedLogs: null,
    })
    expect(result.observations).toBeDefined()
  })

  it('observations mają type bez severity', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 37.2 }],
    })
    result.observations.forEach(obs => {
      expect(['info', 'reference']).toContain(obs.type)
      expect(obs.status).toBeUndefined()
    })
  })
})

describe('rulesEngine — temp observations (neutralne)', () => {
  it('trzy kolejne pomiary rosnące → temp_rising', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [
        { id: '1', date: today, time: '10:00', temp: 37.0 },
        { id: '2', date: today, time: '11:00', temp: 37.5 },
        { id: '3', date: today, time: '12:00', temp: 38.0 },
      ],
    })
    const rising = result.observations.find(o => o.id === 'temp_rising')
    expect(rising).toBeDefined()
    expect(rising.type).toBe('info')
    expect(rising.title).toBeTruthy()
  })

  it('jakikolwiek pomiar w ciągu 24h → bez observation w TempTab', () => {
    // v2.10.5b: usunięto regułę temp_reference_available — link do
    // ReferenceLibrary jest tylko w TodaySummaryCard (jeden punkt wejścia).
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 37.2 }],
    })
    const tempObs = result.observations.filter(o => o.section === 'temp')
    // Jedyny temp observation to temp_rising — wymaga 3 pomiarów rosnących
    // (tutaj tylko 1 pomiar, więc lista pusta)
    expect(tempObs.length).toBe(0)
  })

  it('brak pomiarów temp → brak temp observations', () => {
    const result = evaluateRules({ ...ctxBase, tempLogs: [] })
    const tempObs = result.observations.filter(o => o.section === 'temp')
    expect(tempObs.length).toBe(0)
  })

  it('wysoka temp NIE generuje severity (kluczowy test MDR exit)', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 40.6 }],
    })
    expect(result.observations.some(o => o.status === 'critical')).toBe(false)
    expect(result.observations.some(o => o.status === 'alert')).toBe(false)
    expect(result.observations.some(o => o.status === 'warning')).toBe(false)
    const allNeutral = result.observations.every(o =>
      ['info', 'reference'].includes(o.type)
    )
    expect(allNeutral).toBe(true)
  })
})

describe('rulesEngine — medication observations', () => {
  it('paracetamol >6h temu → med_interval observation (info)', () => {
    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000)
    const logs = [
      {
        id: '1',
        med: 'Paracetamol',
        date: localISODate(sevenHoursAgo),
        time: localTimeHM(sevenHoursAgo),
      },
    ]
    const result = evaluateRules({ ...ctxBase, medLogs: logs })
    const interval = result.observations.find(o => o.id === 'med_interval_passed')
    expect(interval).toBeDefined()
    expect(interval.type).toBe('info')
  })

  it('3× paracetamol w 24h → med_count observation (info, NIE alert)', () => {
    const logs = []
    for (let i = 0; i < 3; i++) {
      const d = new Date(Date.now() - i * 5 * 60 * 60 * 1000)
      logs.push({
        id: String(i),
        med: 'Paracetamol',
        date: localISODate(d),
        time: localTimeHM(d),
      })
    }
    const result = evaluateRules({ ...ctxBase, medLogs: logs })
    const count = result.observations.find(o => o.id === 'med_count_24h')
    expect(count).toBeDefined()
    expect(count.type).toBe('info')
    expect(count.status).toBeUndefined()
  })

  it('1× paracetamol → bez med_count', () => {
    const now = new Date()
    const logs = [
      { id: '1', med: 'Paracetamol', date: localISODate(now), time: localTimeHM(now) },
    ]
    const result = evaluateRules({ ...ctxBase, medLogs: logs })
    const count = result.observations.find(o => o.id === 'med_count_24h')
    expect(count).toBeUndefined()
  })
})

describe('rulesEngine — getSectionObservations', () => {
  it('filtruje observations po sekcji', () => {
    const result = evaluateRules({
      ...ctxBase,
      tempLogs: [{ id: '1', date: today, time: recentTime, temp: 37.2 }],
    })
    const tempObs = getSectionObservations(result.observations, 'temp')
    expect(Array.isArray(tempObs)).toBe(true)
    tempObs.forEach(o => expect(o.section).toBe('temp'))
  })

  it('nieistniejąca sekcja → pusta tablica', () => {
    const result = evaluateRules(ctxBase)
    const obs = getSectionObservations(result.observations, 'nieistniejaca')
    expect(obs).toEqual([])
  })
})
