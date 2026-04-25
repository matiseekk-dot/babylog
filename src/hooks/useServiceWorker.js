import { useEffect } from 'react'
import { captureError, addBreadcrumb } from '../sentry'

/**
 * useServiceWorker — rejestruje SW przy starcie apki.
 *
 * MUSI być wywołane w App.jsx, żeby SW był dostępny zanim user otworzy
 * Meds tab. Wcześniej rejestracja siedziała w useMedReminder, czyli SW startował
 * dopiero kiedy user wszedł do leków — co oznacza że notyfikacje nigdy nie
 * miały szans zadziałać przy świeżej instalacji.
 *
 * Zwraca: nic (efekt uboczny — rejestracja).
 */
export function useServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      addBreadcrumb('sw', 'not-supported', {})
      return
    }
    navigator.serviceWorker
      .register('/babylog/sw.js', { scope: '/babylog/' })
      .then(reg => {
        addBreadcrumb('sw', 'registered', { scope: reg.scope })
      })
      .catch(e => {
        addBreadcrumb('sw', 'register-failed', { msg: e?.message })
        captureError(e, { context: 'sw-startup-registration' })
      })
  }, [])
}
