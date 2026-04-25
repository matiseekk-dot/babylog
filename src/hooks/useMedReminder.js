import { useState, useEffect, useCallback, useRef } from 'react'
import { t } from '../i18n'
import { loadFromStorage } from './useStorage'
import { captureError, addBreadcrumb } from '../sentry'

/**
 * useMedReminder(babyId)
 *
 * Architektura przypomnień (v2.7.5):
 *
 *   1) APKA OTWARTA — foreground timer w window (setTimeout). Niezawodny ale
 *      wymaga, żeby apka była uruchomiona. Każde planowanie wysyła też event
 *      do SW z absolute timestamp `fireAt`, który leci do persystentnej
 *      kolejki w Cache API.
 *
 *   2) APKA W TLE — SW dostaje wakeup przez periodicsync (jeśli przeglądarka
 *      go obsługuje) i sprawdza kolejkę przez `flushDue()`.
 *
 *   3) APKA ZAMKNIĘTA — best-effort: gdy user otworzy apkę później, ona
 *      wyśle CHECK_REMINDERS_NOW i SW dostarczy zaległe notyfikacje.
 *
 * Pełna niezawodność wymaga FCM (push z serwera) — TODO v1.1.
 */

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
  return null
}

function fireAtTimestamp(dateStr, timeStr, durationMin) {
  if (!dateStr || !timeStr) return null
  const ref = new Date(dateStr + 'T00:00:00')
  const [h, m] = timeStr.split(':').map(Number)
  ref.setHours(h, m, 0, 0)
  return ref.getTime() + durationMin * 60000
}

async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

function sendToSW(message) {
  if (!navigator.serviceWorker?.controller) return false
  navigator.serviceWorker.controller.postMessage(message)
  return true
}

export function useMedReminder(babyId) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [pending, setPending] = useState([])
  // Foreground timery — działają tylko gdy apka otwarta. Klucz: tag, value: timeoutId.
  const fgTimers = useRef(new Map())

  // Po wznowieniu apki (visibility change / focus) — poproś SW o sprawdzenie kolejki.
  // To dostarczy zaległe notyfikacje, które SW przegapił bo był uśpiony.
  useEffect(() => {
    const checkOnResume = () => {
      if (document.visibilityState === 'visible') {
        sendToSW({ type: 'CHECK_REMINDERS_NOW' })
      }
    }
    document.addEventListener('visibilitychange', checkOnResume)
    window.addEventListener('focus', checkOnResume)
    checkOnResume()
    return () => {
      document.removeEventListener('visibilitychange', checkOnResume)
      window.removeEventListener('focus', checkOnResume)
    }
  }, [])

  // Lista pending dla UI — odświeżana co minutę
  useEffect(() => {
    const refresh = () => {
      const logs = loadFromStorage(`meds_${babyId}`, [])
      const now = Date.now()
      const active = []

      logs.slice(0, 10).forEach(log => {
        const dur = getDurationMin(log.med)
        if (!dur) return
        const fireAt = fireAtTimestamp(log.date, log.time, dur)
        if (fireAt === null) return
        const minsLeft = Math.floor((fireAt - now) / 60000)
        if (minsLeft < -60) return

        active.push({
          id: log.id,
          medName: log.med,
          readyAt: new Date(fireAt),
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

  // Cleanup foreground timerów przy unmount
  useEffect(() => {
    const map = fgTimers.current
    return () => {
      map.forEach(id => clearTimeout(id))
      map.clear()
    }
  }, [])

  const askPermission = useCallback(async () => {
    const result = await requestPermission()
    setPermission(result)
    addBreadcrumb('reminder', 'permission-result', { result })
    return result
  }, [])

  const scheduleReminder = useCallback((log) => {
    if (!log) return
    const dur = getDurationMin(log.med)
    if (!dur) return

    const fireAt = fireAtTimestamp(log.date, log.time, dur)
    if (fireAt === null) return
    const delayMs = fireAt - Date.now()
    if (delayMs <= 0) return

    const tag = `med-reminder-${log.id}`
    const title = t('reminder.med.title')
    const body = t('reminder.med.body', {
      med: log.med,
      dose: log.dose ? ` (${log.dose})` : '',
      hours: Math.floor(dur / 60),
    })

    // Czytamy aktualny stan permission — useCallback deps może być stary
    // (race condition gdy user akceptuje permission i od razu zapisuje wpis).
    const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    if (perm !== 'granted') {
      addBreadcrumb('reminder', 'schedule-skipped-no-permission', { tag })
      return
    }

    // 1) Persystentna kolejka w SW
    sendToSW({
      type: 'SCHEDULE_MED_REMINDER',
      payload: { tag, title, body, fireAt },
    })

    // 2) Foreground timer (backup gdy apka jest otwarta przez całe okno).
    //    Maks. 24h żeby uniknąć overflow w setTimeout (limit ~24.8 dni).
    if (delayMs < 24 * 60 * 60 * 1000) {
      const existing = fgTimers.current.get(tag)
      if (existing) clearTimeout(existing)
      const id = setTimeout(() => {
        fgTimers.current.delete(tag)
        try {
          new Notification(title, {
            body,
            icon: '/babylog/icon-192.png',
            tag,
          })
        } catch (e) {
          // PWA czasem blokuje `new Notification()` — zostawiamy SW
          captureError(e, { context: 'fg-notification', tag })
        }
      }, delayMs)
      fgTimers.current.set(tag, id)
    }

    addBreadcrumb('reminder', 'scheduled', { tag, fireAt, delayMin: Math.floor(delayMs / 60000) })
  }, [])

  const cancelReminder = useCallback((logId) => {
    const tag = `med-reminder-${logId}`
    sendToSW({ type: 'CANCEL_MED_REMINDER', tag })
    const existing = fgTimers.current.get(tag)
    if (existing) {
      clearTimeout(existing)
      fgTimers.current.delete(tag)
    }
  }, [])

  // Test button — pokazuje notyfikację natychmiast, żeby user mógł zweryfikować
  // że uprawnienia + SW + system notyfikacji działają poprawnie.
  const testNotification = useCallback(() => {
    const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    if (perm !== 'granted') return false
    sendToSW({
      type: 'TEST_NOTIFICATION',
      payload: {
        title: t('reminder.test.title'),
        body: t('reminder.test.body'),
      },
    })
    return true
  }, [])

  return {
    permission,
    askPermission,
    scheduleReminder,
    cancelReminder,
    testNotification,
    pendingReminders: pending,
  }
}
