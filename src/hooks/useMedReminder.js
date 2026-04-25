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

  // TWA fix: Notification.permission może się zmieniać poza naszym kontrolą
  // (system Android sam zarządza zgodą). Synchronizujemy state na każde
  // wznowienie apki + co 5s przez pierwsze 30s po mount (gdy user właśnie
  // klikał "Zezwalaj" w popupie).
  useEffect(() => {
    if (typeof Notification === 'undefined') return

    const sync = () => {
      const current = Notification.permission
      setPermission(prev => prev !== current ? current : prev)
    }

    // Sync na visibilitychange / focus (gdy user wraca z systemowego popupu)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)

    // Pierwszy okres po mount — agresywne sprawdzanie co 1s przez 10s
    const fastSync = setInterval(sync, 1000)
    const stopFastSync = setTimeout(() => clearInterval(fastSync), 10000)

    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
      clearInterval(fastSync)
      clearTimeout(stopFastSync)
    }
  }, [])

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
    let result = await requestPermission()

    // TWA fix: Android czasem ma opóźnienie przy aktualizacji Notification.permission
    // po systemowym popupie. Jeśli wynik to 'default' (user nie odpowiedział lub
    // event się zgubił), poczekaj 500ms i sprawdź ponownie — często system już
    // wie że zgoda jest, tylko TWA o tym nie wiedział.
    if (result === 'default' && 'Notification' in window) {
      await new Promise(r => setTimeout(r, 500))
      const recheck = Notification.permission
      if (recheck !== 'default') {
        result = recheck
      }
    }

    setPermission(result)
    addBreadcrumb('reminder', 'permission-result', { result })
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

  const testNotification = useCallback(async () => {
    if (typeof Notification === 'undefined') return false

    const title = t('reminder.test.title')
    const body = t('reminder.test.body')

    // TWA fix: NIE sprawdzamy Notification.permission przed wysłaniem,
    // bo TWA może mieć stary cached state mimo że system Android już
    // udzielił zgody. Próbujemy wysłać; jeśli system odmówi, łapiemy błąd.

    // Strategia 1: SW przez controller
    if (navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_NOTIFICATION',
          payload: { title, body },
        })
        return true
      } catch { /* fallthrough */ }
    }

    // Strategia 2: SW przez registration.ready
    try {
      const reg = await Promise.race([
        navigator.serviceWorker?.ready,
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
      ])
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'TEST_NOTIFICATION',
          payload: { title, body },
        })
        return true
      }
    } catch { /* fallthrough */ }

    // Strategia 3: registration.showNotification (TWA preferred)
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/babylog/icon-192.png',
          badge: '/babylog/icon-72.png',
          tag: 'test-notification',
        })
        return true
      }
    } catch { /* fallthrough */ }

    // Strategia 4: bezpośrednie new Notification (legacy fallback)
    try {
      new Notification(title, { body, icon: '/babylog/icon-192.png' })
      return true
    } catch {
      return false
    }
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
