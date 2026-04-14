import { useState, useEffect, useCallback } from 'react'
import { loadFromStorage } from './useStorage'

// Czas działania leków w minutach
const MED_DURATION = {
  paracetamol: 360,  // 6h
  ibuprofen:   480,  // 8h
}

function matchesMed(medName, key) {
  return (medName || '').toLowerCase().includes(key)
}

function getDurationMin(medName) {
  if (matchesMed(medName, 'paracetamol')) return MED_DURATION.paracetamol
  if (matchesMed(medName, 'ibuprofen'))   return MED_DURATION.ibuprofen
  return null // inne leki — bez przypomnienia
}

function minutesUntil(dateStr, timeStr, durationMin) {
  if (!dateStr || !timeStr) return null
  const ref = new Date(dateStr)
  const [h, m] = timeStr.split(':').map(Number)
  ref.setHours(h, m, 0, 0)
  const readyAt = new Date(ref.getTime() + durationMin * 60000)
  const diffMs = readyAt - Date.now()
  return Math.floor(diffMs / 60000) // ujemna = już można podać
}

// ─── Service Worker utils ─────────────────────────────────────────────────────

async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/babylog/sw.js', { scope: '/babylog/' })
    await navigator.serviceWorker.ready
    return reg
  } catch (e) {
    console.warn('SW registration failed:', e)
    return null
  }
}

async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

function sendToSW(type, payload) {
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({ type, payload })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useMedReminder(babyId)
 *
 * Zwraca:
 *   permission       – 'default' | 'granted' | 'denied' | 'unsupported'
 *   requestPermission() – prośba o zgodę (wywołać po akcji użytkownika)
 *   scheduleReminder(logEntry) – zaplanuj przypomnienie dla danego podania leku
 *   cancelReminder(logId) – anuluj przypomnienie
 *   pendingReminders – lista aktywnych przypomnień z czasem pozostałym
 */
export function useMedReminder(babyId) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [pending, setPending] = useState([]) // { id, medName, readyAt, minutesLeft }
  const [swReady, setSwReady] = useState(false)

  // Zarejestruj SW przy montowaniu
  useEffect(() => {
    registerSW().then(reg => setSwReady(!!reg))
  }, [])

  // Odśwież stan pending co minutę
  useEffect(() => {
    const refresh = () => {
      const logs = loadFromStorage(`meds_${babyId}`, [])
      const now = Date.now()
      const active = []

      logs.slice(0, 10).forEach(log => {
        const dur = getDurationMin(log.med)
        if (!dur) return
        const minsLeft = minutesUntil(log.date, log.time, dur)
        if (minsLeft === null) return
        if (minsLeft < -60) return // więcej niż godzinę po wygaśnięciu — nie pokazuj

        const ref = new Date(log.date)
        const [h, m] = (log.time || '00:00').split(':').map(Number)
        ref.setHours(h, m, 0, 0)
        const readyAt = new Date(ref.getTime() + dur * 60000)

        active.push({
          id: log.id,
          medName: log.med,
          readyAt,
          minutesLeft: minsLeft,
          dose: log.dose,
        })
      })

      setPending(active)
    }

    refresh()
    const id = setInterval(refresh, 60000)
    return () => clearInterval(id)
  }, [babyId])

  const askPermission = useCallback(async () => {
    const result = await requestPermission()
    setPermission(result)
    if (result === 'granted') await registerSW()
    return result
  }, [])

  const scheduleReminder = useCallback((log) => {
    if (permission !== 'granted') return
    const dur = getDurationMin(log.med)
    if (!dur) return

    const minsLeft = minutesUntil(log.date, log.time, dur)
    if (minsLeft === null || minsLeft <= 0) return

    const delayMs = minsLeft * 60000
    const tag = `med-reminder-${log.id}`

    sendToSW('SCHEDULE_MED_REMINDER', {
      tag,
      title: 'Czas na kolejną dawkę 💊',
      body: `Możesz podać ${log.med}${log.dose ? ` (${log.dose})` : ''} — minęło ${Math.floor(dur / 60)}h od ostatniej dawki.`,
      delayMs,
    })
  }, [permission])

  const cancelReminder = useCallback((logId) => {
    sendToSW('CANCEL_MED_REMINDER', { tag: `med-reminder-${logId}` })
  }, [])

  return {
    permission,
    swReady,
    askPermission,
    scheduleReminder,
    cancelReminder,
    pendingReminders: pending,
  }
}
