import { useState, useEffect } from 'react'
import { evaluateRules, getGlobalStatus, getSectionMessages } from '../engine/rulesEngine'
import { loadFromStorage } from './useStorage'
import { readCached } from './useFirestore'
import { useLocale } from '../i18n'

/**
 * useChildStatus(babyId, ageMonths, weightKg)
 *
 * Czyta dane z localStorage, odpala silnik reguł i zwraca:
 *   globalStatus  – najważniejszy aktywny komunikat
 *   topStatus     – string: 'ok' | 'info' | 'warning' | 'alert' | 'critical'
 *   messages      – lista wszystkich aktywnych komunikatów
 *   sectionMessages(section) – komunikaty dla danej sekcji
 *   refresh()     – ręczne odświeżenie (po każdym zapisie danych)
 */
export function useChildStatus(babyId, ageMonths, weightKg, dataUid, sleepTimerTs = null) {
  const [result, setResult] = useState({ messages: [], topStatus: 'ok' })
  const [tick, setTick] = useState(0)
  // Re-render hook na zmianę języka + wymuś re-ewaluację reguł
  // (messages mają title/message stringi, które liczą się przez t() w momencie ewaluacji)
  const { locale } = useLocale()

  useEffect(() => {
    if (!babyId) return

    // v2.16.18: te same dane co w zakładkach (także u partnera na wspólnym
    // koncie, gdzie pamięć podręczna ma przedrostek babylog_shared_<owner>_).
    const read = (key) => (dataUid !== undefined ? readCached(dataUid, key, []) : loadFromStorage(key, []))
    const ctx = {
      tempLogs:   read(`temp_${babyId}`),
      sleepLogs:  read(`sleep_${babyId}`),
      feedLogs:   read(`feed_${babyId}`),
      medLogs:    read(`meds_${babyId}`),
      diaperLogs: read(`diaper_${babyId}`),
      ageMonths:  ageMonths || 0,
      weightKg:   weightKg  || 5,
      sleepTimerTs,
    }

    setResult(evaluateRules(ctx))
  }, [babyId, ageMonths, weightKg, dataUid, sleepTimerTs, tick, locale])

  // Auto-odświeżanie co 5 minut (reguły czasowe)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const refresh = () => setTick(t => t + 1)

  const globalStatus = getGlobalStatus(result.messages, result.topStatus)

  const sectionMessages = (section) =>
    getSectionMessages(result.messages, section).filter(m => m.status !== 'ok')

  return {
    globalStatus,
    topStatus: result.topStatus,
    messages: result.messages,
    sectionMessages,
    refresh,
  }
}
