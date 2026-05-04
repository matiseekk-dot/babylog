import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
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

  // v2.11.17: Robust trial loading dla zalogowanych — direct getDoc fallback.
  //
  // History:
  //   v2.11.16 — dodane 2s setTimeout żeby onSnapshot zdążył z odpowiedzią.
  //              W praktyce nie wystarczyło: na slow networks, App Check token
  //              warm-up (~3-5s), albo gdy onSnapshot listener nie odpalił się
  //              w 2s — i tak resetowało trial.
  //
  //   v2.11.17 — dodano explicit getDoc race against timeout. Po wykryciu że
  //              trialStart jest null + uid jest, robimy DWA równoległe asyncy:
  //                1. getDoc(users/{uid}/data/trial_start) — 1 strzał, network roundtrip
  //                2. setTimeout(5s) — fallback gdy network powolny lub doc nie ma
  //              Pierwszy który wraca, decyduje. Jeśli getDoc zwróci wartość →
  //              ustawiamy ją (NIE Date.now). Jeśli getDoc zwróci że doc nie ma,
  //              dopiero wtedy ustawiamy Date.now (świeży trial).
  useEffect(() => {
    if (trialStart !== null) return // już ustawione, no-op
    if (!uid) {
      // Guest — Firestore nie wchodzi, brak race condition
      setTrialStart(Date.now())
      return
    }

    let cancelled = false
    let timer = null

    const tryGetDoc = async () => {
      try {
        const ref = doc(db, 'users', uid, 'data', 'trial_start')
        const snap = await getDoc(ref)
        if (cancelled) return
        if (snap.exists()) {
          // Stary trial znaleziony w Firestore — ustaw go w state (nie zapis,
          // bo onSnapshot też go ustawi; to jest tylko fast-path).
          const v = snap.data()?.value
          if (typeof v === 'number') {
            setTrialStart(v)
            return
          }
        }
        // Doc nie istnieje albo jest dziwny → świeży trial
        setTrialStart(Date.now())
      } catch (e) {
        // Network error / permission denied — czekamy na timeout fallback
        // (nie ustawiamy nic, niech 5s timeout zrobi reset jako last resort)
      }
    }

    tryGetDoc()
    timer = setTimeout(() => {
      if (cancelled) return
      // Last resort — getDoc zawiódł lub nie odpowiedział; ustawiamy fresh trial
      setTrialStart(Date.now())
    }, 5000)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
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
