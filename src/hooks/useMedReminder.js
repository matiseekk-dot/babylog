import { useState, useEffect, useCallback } from 'react'
import { t, getLocale } from '../i18n'
import { loadFromStorage } from './useStorage'
import { addBreadcrumb } from '../sentry'

/**
 * useMedReminder(babyId)
 *
 * WZORZEC PS5 VAULT — apka przy każdym otwarciu wysyła do SW listę wpisów
 * leków i SW iteruje, sprawdza, pokazuje notyfikacje dla overdue dawek.
 *
 * Notyfikacje pokazują się TYLKO gdy user otworzy apkę. To uczciwy compromise:
 * nie obiecujemy działania w tle (które i tak nie działa niezawodnie w PWA),
 * ale za to działa deterministycznie kiedy user wraca do apki.
 *
 * Zwraca:
 *   permission        – 'default' | 'granted' | 'denied' | 'unsupported'
 *   askPermission()   – prośba o zgodę
 *   testNotification() – pokaż testową notyfikację
 *   pendingReminders  – lista aktywnych przypomnień dla UI badge'a
 *
 * scheduleReminder/cancelReminder są w API zachowane, ale są no-opami —
 * cała logika dzieje się w checkAllReminders() wywoływanym automatycznie.
 */

const MED_DURATION = {
  paracetamol: 360,  // 6h
  ibuprofen:   480,  // 8h
}

function getDurationMin(medName) {
  const lc = (medName || '').toLowerCase()
  if (lc.includes('paracetamol')) return MED_DURATION.paracetamol
  if (lc.includes('ibuprofen'))   return MED_DURATION.ibuprofen
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
  return await Notification.requestPermission()
}

function sendToSW(message) {
  if (!navigator.serviceWorker?.controller) return false
  navigator.serviceWorker.controller.postMessage(message)
  return true
}

/**
 * Wyślij do SW listę wpisów leków + obecne strings i18n.
 * SW sam zdecyduje którym wpisom pokazać notyfikację.
 */
function checkAllReminders(babyId) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const logs = loadFromStorage(`meds_${babyId}`, [])
  if (!logs.length) return

  // Bierzemy tylko 10 najnowszych wpisów — starsze już dawno wygasły
  const recent = logs.slice(0, 10)

  sendToSW({
    type: 'CHECK_MED_REMINDERS',
    payload: {
      logs: recent.map(l => ({
        id: l.id,
        med: l.med,
        dose: l.dose,
        date: l.date,
        time: l.time,
      })),
      locale: getLocale(),
      strings: {
        title: t('reminder.med.title'),
        body: t('reminder.med.body', { med: '{med}', dose: '{dose}', hours: '{hours}' }),
      },
    },
  })

  addBreadcrumb('reminder', 'check-sent', { babyId, count: recent.length })
}

export function useMedReminder(babyId) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [pending, setPending] = useState([])

  // ── Wywołuj checkAllReminders przy każdym wznowieniu apki ──
  // To jest serce wzorca PS5 Vault. Apka otwarta → SW dostaje listę → pokazuje co trzeba.
  useEffect(() => {
    if (!babyId || permission !== 'granted') return

    const trigger = () => {
      if (document.visibilityState === 'visible') {
        checkAllReminders(babyId)
      }
    }

    // 1) Na mount
    trigger()

    // 2) Gdy apka wraca z tła
    document.addEventListener('visibilitychange', trigger)
    window.addEventListener('focus', trigger)

    // 3) Co 5 minut gdy apka jest otwarta — łapie wpisy które przekroczyły próg
    //    podczas otwartej sesji (user dał lek 5h temu, siedzi w apce, po godzinie
    //    minie 6h — chcemy żeby dostał notyfikację bez zamykania/otwierania)
    const interval = setInterval(trigger, 5 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', trigger)
      window.removeEventListener('focus', trigger)
      clearInterval(interval)
    }
  }, [babyId, permission])

  // ── Lista pending dla UI badge'a (osobne od logiki notyfikacji) ──
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

  const askPermission = useCallback(async () => {
    const result = await requestPermission()
    setPermission(result)
    addBreadcrumb('reminder', 'permission-result', { result })
    // Po przyznaniu zgody — od razu sprawdź czy są overdue wpisy do pokazania
    if (result === 'granted' && babyId) {
      setTimeout(() => checkAllReminders(babyId), 100)
    }
    return result
  }, [babyId])

  // scheduleReminder / cancelReminder — zachowane dla zgodności z MedsTab,
  // ale są no-opami. Cała logika jest w checkAllReminders.
  // (Po zapisie wpisu, useEffect powyżej i tak wystrzeli check, więc OK.)
  const scheduleReminder = useCallback(() => {
    if (babyId && permission === 'granted') {
      // Trigger ad-hoc check po zapisie wpisu — gdyby właśnie minął odstęp.
      setTimeout(() => checkAllReminders(babyId), 100)
    }
  }, [babyId, permission])

  const cancelReminder = useCallback(() => { /* no-op */ }, [])

  const testNotification = useCallback(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
    return sendToSW({
      type: 'TEST_NOTIFICATION',
      payload: {
        title: t('reminder.test.title'),
        body: t('reminder.test.body'),
      },
    })
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
