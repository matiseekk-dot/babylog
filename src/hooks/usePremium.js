import { useEffect, useState } from 'react'
import { useFirestore } from './useFirestore'

const TRIAL_DAYS = 14

/**
 * usePremium(uid)
 *
 * Model: Trial-led freemium z server-side weryfikacją (v2.10.0)
 *
 * - Nowy użytkownik: 14 dni pełnego Premium za darmo, bez karty
 * - Po 14 dniach: downgrade do free (dopóki nie kupi)
 * - Po kupnie przez Google Play: RevenueCat webhook ustawia
 *   `premium_purchased = true` w Firestore. Client tylko czyta.
 * - Po EXPIRATION/REFUND: RevenueCat webhook ustawia false.
 *
 * Dlaczego read-only client:
 * Wcześniej client mógł sobie sam zapisać `premium_purchased = true`
 * przez DevTools w Firestore SDK. Od v2.10.0 firestore.rules blokuje
 * write na to pole — tylko Admin SDK (Cloud Function `revenueCatWebhook`)
 * może je zmieniać.
 *
 * Stan:
 *   trialStart    – timestamp pierwszej wizyty (client zapisuje, OK)
 *   purchased     – status Premium z RC (read-only z client-side)
 */
export function usePremium(uid) {
  const [trialStart, setTrialStart] = useFirestore(uid, 'trial_start', null)
  // v2.10.0: useFirestore w trybie read-only dla `premium_purchased`.
  // Zwraca [value, setter], ale setter dla tego pola będzie failować
  // z permission-denied — to OK, nikt go nie wywołuje od v2.10.0.
  const [purchased] = useFirestore(uid, 'premium_purchased', false)

  // v2.11.16: Race-condition fix dla "trial reset on refresh".
  //
  // Wcześniej: przy refresh apki, useFirestore zwracało initialState z
  // localStorage. Jeśli localStorage był pusty (clear data, reinstall, fresh
  // device, TWA cache wyczyszczony), trialStart = null. useEffect natychmiast
  // wywoływał setTrialStart(Date.now()) — overwriting prawdziwego trial_start
  // który dopiero ładował się z Firestore (~200-1500ms).
  //
  // Skutek: każdy refresh apki resetował trial do "14 dni od teraz", nawet
  // jeśli user był na trialu od miesiąca.
  //
  // Fix:
  //   - Dla guesta (no uid): zapisuj od razu (Firestore nie istnieje, race nie ma)
  //   - Dla zalogowanego: czekaj 2s na onSnapshot. Jeśli w międzyczasie Firestore
  //     dostarczy starszą wartość, useEffect odpali się ponownie ze świeżym
  //     trialStart, a cleanup cancluje stary setTimeout. Jeśli po 2s wciąż null,
  //     to faktycznie nowy user — wtedy zapisujemy.
  useEffect(() => {
    if (trialStart !== null) return // już ustawione, no-op
    if (!uid) {
      // Guest — Firestore nie wchodzi, brak race condition
      setTrialStart(Date.now())
      return
    }
    // Zalogowany — daj 2s na onSnapshot żeby załadował z Firestore
    const t = setTimeout(() => {
      setTrialStart(Date.now())
    }, 2000)
    return () => clearTimeout(t)
  }, [trialStart, uid])

  // Wylicz czy Premium jest aktywny
  const now = Date.now()
  const trialEndMs = trialStart ? trialStart + TRIAL_DAYS * 24 * 60 * 60 * 1000 : 0
  const trialActive = trialStart && now < trialEndMs
  const isPremium = purchased || trialActive

  // Dni trialu pozostałe
  const trialDaysLeft = trialActive
    ? Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000))
    : 0

  // v2.10.0: activate/deactivate USUNIĘTE.
  //   - activate() był wywołany przez useRevenueCat po pozytywnym checkEntitlement
  //     — zastępujemy webhookiem od RC (server → server, nie client → server)
  //   - deactivate() w ogóle nie był używany w produkcji
  // Backwards compat: jeśli ktoś z kodu wywoła starą activate(), nic się nie
  // zdarzy (no-op + warning), ale i tak ten kod ścieżki został usunięty z
  // useRevenueCat.js (patrz v2.10.0 changes).
  const activate = () => {
    if (typeof console !== 'undefined') {
      console.warn('[usePremium] activate() is no-op since v2.10.0 — Premium status comes from RevenueCat webhook')
    }
  }
  const deactivate = () => {
    if (typeof console !== 'undefined') {
      console.warn('[usePremium] deactivate() is no-op since v2.10.0')
    }
  }

  return {
    isPremium,
    isOnTrial: trialActive && !purchased,
    trialDaysLeft,
    purchased,
    activate,
    deactivate,
  }
}
