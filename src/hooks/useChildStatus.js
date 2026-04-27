import { useState, useEffect } from 'react'
import { evaluateRules, getGlobalStatus, getSectionMessages } from '../engine/rulesEngine'
import { loadFromStorage } from './useStorage'
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
export function useChildStatus(babyId, ageMonths, weightKg) {
  const [result, setResult] = useState({ messages: [], topStatus: 'ok' })
  const [tick, setTick] = useState(0)
  // Re-render hook na zmianę języka + wymuś re-ewaluację reguł
  // (messages mają title/message stringi, które liczą się przez t() w momencie ewaluacji)
  const { locale } = useLocale()

  useEffect(() => {
    if (!babyId) return

    const ctx = {
      tempLogs:   loadFromStorage(`temp_${babyId}`,   []),
      sleepLogs:  loadFromStorage(`sleep_${babyId}`,  []),
      feedLogs:   loadFromStorage(`feed_${babyId}`,   []),
      medLogs:    loadFromStorage(`meds_${babyId}`,   []),
      diaperLogs: loadFromStorage(`diaper_${babyId}`, []),
      ageMonths:  ageMonths || 0,
      weightKg:   weightKg  || 5,
    }

    setResult(evaluateRules(ctx))
  }, [babyId, ageMonths, weightKg, tick, locale])

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
