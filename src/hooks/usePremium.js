import { useEffect, useState, useRef } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useFirestore } from './useFirestore'
import { addBreadcrumb, captureError } from '../sentry'

const TRIAL_DAYS = 14

/**
 * usePremium(uid)
 *
 * Model: Trial-led freemium z server-side weryfikacją.
 *
 * - Nowy użytkownik: 14 dni pełnego Premium za darmo, bez karty
 * - Po 14 dniach: downgrade do free (dopóki nie kupi)
 * - Po kupnie przez Google Play: RevenueCat webhook ustawia
 *   `premium_purchased = true` w Firestore. Client tylko czyta.
 * - Po EXPIRATION/REFUND: RevenueCat webhook ustawia false.
 *
 * v2.11.31 — TRIAL CALC SERVER-SIDE (audit P0-1 fix).
 *
 * HISTORIA:
 *   v2.11.16: 2s setTimeout — race condition na slow networks
 *   v2.11.17: getDoc + 5s fallback — wciąż client-writable, abuse possible
 *   v2.11.20: auth.currentUser.metadata.creationTime — IMMUTABLE ale BUG
 *             dla każdego z istniejącym Firebase Auth account creationTime
 *             może być w przeszłości → trial=0 dla legitymnych userów.
 *   v2.11.31: Cloud Function callable `initTrial` zapisuje trial_start
 *             przy pierwszym wywołaniu. Idempotentny, server-side, zgodny
 *             z firestore.rules (które blokują client write na trial_start).
 *
 * FLOW:
 *   1. uid pojawia się (login OK)
 *   2. usePremium uruchamia useEffect → wywołuje CF `initTrial`
 *   3. CF sprawdza Firestore: jeśli trial_start istnieje → zwraca; jeśli
 *      nie → tworzy z `Date.now()` i zwraca
 *   4. Hook ustawia `trialStart` ze zwróconej wartości
 *   5. onSnapshot z useFirestore (na trial_start) odbiera zmianę i
 *      synchronizuje state w tle dla kolejnych mount'ów
 *
 * ANTI-ABUSE:
 *   - firestore.rules blokują client write na trial_start
 *   - CF jest idempotentny — drugie wywołanie nie nadpisuje
 *   - Reinstall apki + reload + login z tym samym kontem → ten sam trial
 *   - Aby zresetować trial, user musi utworzyć nowe konto Google
 *
 * GUEST MODE:
 *   - Bez auth → guest trial start w localStorage (nie zsynchronizowane
 *     z serwerem). Guest mode jest limited (no purchase, no sync), więc
 *     abuse impact niski. Po zalogowaniu apka przechodzi na server-side trial.
 */
export function usePremium(uid) {
  // Guest fallback — używamy useFirestore tylko dla guesta
  // (uid=null → useFirestore zwraca z localStorage, bez Firestore)
  const [guestTrialStart, setGuestTrialStart] = useFirestore(null, 'trial_start_guest', null)

  // Server-side trial start dla zalogowanych. useFirestore wraca z localStorage
  // initial state + onSnapshot live updates z Firestore. CF write triggeruje
  // onSnapshot listener więc state synchronizuje się automatycznie.
  // UWAGA: useFirestore.set NIE działa na trial_start (firestore.rules block) —
  // to jest celowe, write tylko przez Admin SDK w CF.
  const [authTrialStart] = useFirestore(uid, 'trial_start', null)

  // Premium status z RC webhook (read-only z client)
  const [purchased] = useFirestore(uid, 'premium_purchased', false)

  // Init trial przy pierwszym logowaniu (idempotentny, server-side)
  // Ref żeby nie re-callować CF przy każdym re-render (uid stable).
  const initCalledRef = useRef(null)
  useEffect(() => {
    if (!uid) return
    // Zostało już wywołane dla tego uid w tym session — skip
    if (initCalledRef.current === uid) return
    initCalledRef.current = uid

    // Jeśli authTrialStart już ma wartość z lokalnego cache, CF call w tle
    // (CF jest idempotentny więc to OK — nie nadpisze).
    const callInit = async () => {
      try {
        const fn = httpsCallable(functions, 'initTrial')
        const result = await fn()
        addBreadcrumb('trial', 'init-result', {
          alreadyExisted: result.data?.alreadyExisted,
          trialStartMs: result.data?.trialStartMs,
        })
      } catch (err) {
        // Network down / CF not deployed / permission denied — kontynuujemy
        // z lokalnym cache (authTrialStart). Niekrytyczne — przy następnym
        // uruchomieniu spróbujemy znowu.
        console.warn('[usePremium] initTrial CF failed:', err?.message || err)
        captureError(err, { context: 'usePremium-initTrial', uid })
      }
    }
    callInit()
  }, [uid])

  // Zapisz trial_start dla guesta jeśli nie ma jeszcze (no-CF, localStorage)
  useEffect(() => {
    if (uid) return
    if (guestTrialStart === null) {
      setGuestTrialStart(Date.now())
    }
  }, [uid, guestTrialStart])

  // Wybierz właściwy trial source
  let trialStart = null
  if (uid) {
    // Zalogowany: wartość z Firestore (server-side, immutable). Może być null
    // przez moment zanim CF callback zaktualizuje cache.
    trialStart = typeof authTrialStart === 'number' ? authTrialStart : null
  } else {
    trialStart = guestTrialStart
  }

  // Wylicz czy Premium jest aktywny
  const now = Date.now()
  const trialEndMs = trialStart ? trialStart + TRIAL_DAYS * 24 * 60 * 60 * 1000 : 0
  const trialActive = trialStart && now < trialEndMs
  const isPremium = purchased || trialActive

  // Dni trialu pozostałe
  const trialDaysLeft = trialActive
    ? Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000))
    : 0

  // Backwards compat (deprecated, do usunięcia w przyszłości)
  const activate = () => {
    if (typeof console !== 'undefined') {
      console.warn('[usePremium] activate() is no-op since v2.10.0')
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
