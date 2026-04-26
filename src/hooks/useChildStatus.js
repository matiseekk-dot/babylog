import { useState, useEffect } from 'react'
import { evaluateRules, getSectionObservations } from '../engine/rulesEngine'
import { loadFromStorage } from './useStorage'
import { useLocale } from '../i18n'
import { todayDate } from '../utils/helpers'

/**
 * useChildStatus(babyId, ageMonths, weightKg) — v2.10.3 MDR EXIT REFACTOR
 *
 * GŁÓWNA ZMIANA vs v2.10.2:
 *   - NIE zwraca severity (globalStatus, topStatus, critical/alert/warning).
 *   - Zwraca journal summary (statystyki dnia) + observations (neutralne).
 *
 * Powód: severity classification + clinical decision support = MDR.
 *   Apka po refactorze pokazuje user'owi jego DANE (nie ocenia).
 *
 * Zwraca:
 *   summary    – statystyki dzisiejsze {feeds, sleeps, sleepHours, lastTemp, medsToday}
 *   observations  – neutralne info (timer, fakty z timeline) — bez severity
 *   sectionObservations(section) — observations dla danej sekcji
 *   refresh()  – ręczne odświeżenie po zapisie
 *
 *   getGlobalStatus / topStatus / messages SĄ USUNIĘTE z public API.
 *   Jeśli App.jsx jeszcze ich używa — dostanie undefined; to jest celowe,
 *   żeby kompilator/runtime pokazał miejsca które wymagają update.
 *
 *   Backwards-compat shim w rulesEngine.js zwraca puste/legacy values,
 *   ale UI komponenty powinny być migrowane na nowy API.
 */
export function useChildStatus(babyId, ageMonths, weightKg) {
  const [observations, setObservations] = useState([])
  const [summary, setSummary] = useState({
    feeds: 0,
    sleeps: 0,
    sleepHours: 0,
    sleepRemainder: 0,
    lastTemp: null,
    medsToday: 0,
    diapersToday: 0,
  })
  const [tick, setTick] = useState(0)
  const { locale } = useLocale()

  useEffect(() => {
    if (!babyId) return

    const tempLogs = loadFromStorage(`temp_${babyId}`, [])
    const sleepLogs = loadFromStorage(`sleep_${babyId}`, [])
    const feedLogs = loadFromStorage(`feed_${babyId}`, [])
    const medLogs = loadFromStorage(`meds_${babyId}`, [])
    const diaperLogs = loadFromStorage(`diaper_${babyId}`, [])

    // ── Observations (neutralne, bez severity) ────────────────────────────
    const ctx = {
      tempLogs, sleepLogs, feedLogs, medLogs, diaperLogs,
      ageMonths: ageMonths || 0,
      weightKg: weightKg || 5,
    }
    const { observations: newObs } = evaluateRules(ctx)
    setObservations(newObs)

    // ── Journal summary (raw stats, bez clinical assessment) ──────────────
    const today = todayDate()
    const todayFeeds = feedLogs.filter(l => l.date === today)
    const todaySleeps = sleepLogs.filter(l => l.date === today)
    const todayDiapers = diaperLogs.filter(l => l.date === today)
    const todayTemps = tempLogs.filter(l => l.date === today)
    const todayMeds = medLogs.filter(l => l.date === today)

    const totalSleepMin = todaySleeps.reduce((s, l) => s + (l.durationMin || 0), 0)
    const sleepHours = Math.floor(totalSleepMin / 60)
    const sleepRemainder = totalSleepMin % 60

    const lastTemp = todayTemps.length > 0
      ? [...todayTemps].sort((a, b) => b.time.localeCompare(a.time))[0]
      : null

    setSummary({
      feeds: todayFeeds.length,
      sleeps: todaySleeps.length,
      sleepHours,
      sleepRemainder,
      lastTemp: lastTemp ? Number(lastTemp.temp) : null,
      lastTempTime: lastTemp ? lastTemp.time : null,
      medsToday: todayMeds.length,
      diapersToday: todayDiapers.length,
    })
  }, [babyId, ageMonths, weightKg, tick, locale])

  // Auto-refresh co 5 min (niezbędne dla med interval timera)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const refresh = () => setTick(t => t + 1)

  const sectionObservations = (section) =>
    getSectionObservations(observations, section)

  return {
    summary,
    observations,
    sectionObservations,
    refresh,

    // ── Backwards compat shim (deprecated, usunąć w v2.11) ────────────────
    // App.jsx i komponenty mogą jeszcze używać tych pól. Zwracamy neutralne
    // placeholdery, żeby UI nie crashował podczas migracji.
    globalStatus: { status: 'ok', title: '', message: '' },
    topStatus: 'ok',
    messages: observations, // shim — observations w miejscu messages
    sectionMessages: sectionObservations,
  }
}
