import { useEffect, useState } from 'react'
import { auth } from '../firebase'
import { useFirestore } from './useFirestore'

const TRIAL_DAYS = 14

/**
 * usePremium(uid)
 *
 * Model: Trial-led freemium z server-side weryfikacją (v2.10.0+ → v2.11.20)
 *
 * - Nowy użytkownik: 14 dni pełnego Premium za darmo, bez karty
 * - Po 14 dniach: downgrade do free (dopóki nie kupi)
 * - Po kupnie przez Google Play: RevenueCat webhook ustawia
 *   `premium_purchased = true` w Firestore. Client tylko czyta.
 * - Po EXPIRATION/REFUND: RevenueCat webhook ustawia false.
 *
 * v2.11.20 — TRIAL ANTI-ABUSE.
 * Wcześniej trial_start był zapisywany przez client (do Firestore + localStorage).
 * To pozwalało resetować trial przez:
 *   1. Reinstall apki w guest mode (localStorage clear → świeży 14d)
 *   2. Manipulację DevTools (delete trial_start z Firestore/localStorage)
 *   3. Race condition (refresh przed Firestore load)
 *
 * Teraz dla **zalogowanych** używamy `auth.currentUser.metadata.creationTime`
 * jako trial start. Jest IMMUTABLE — Firebase Auth ustawia raz przy create
 * user account, nikt (nawet Admin SDK bez force) tego nie zmieni. Reinstall
 * apki + login = ten sam timestamp. Single account = single 14d trial. Period.
 *
 * Aby zresetować trial, user musiałby utworzyć nowe konto Google (nie tylko
 * reinstall). To jest naturalna bariera (different email, captcha, phone
 * verification jeśli włączone).
 *
 * Dla **gościa** (no auth) zostawiamy lokalny trial start. Guest mode i tak
 * jest limited (bez sync, bez purchase od v2.11.13), więc abuse jest niski.
 * Plus: gdy guest się zaloguje, automatycznie przechodzi na auth-based trial.
 */
export function usePremium(uid) {
  // Guest fallback — używamy useFirestore tylko dla guesta
  // (uid=null → useFirestore zwraca z localStorage, bez Firestore)
  const [guestTrialStart, setGuestTrialStart] = useFirestore(null, 'trial_start_guest', null)

  // v2.10.0: useFirestore w trybie read-only dla `premium_purchased`.
  // Zwraca [value, setter], ale setter dla tego pola będzie failować
  // z permission-denied — to OK, nikt go nie wywołuje od v2.10.0.
  const [purchased] = useFirestore(uid, 'premium_purchased', false)

  // v2.11.20: Trial start = Firebase Auth account creation time (immutable).
  // Dla zalogowanych. Reinstall + login z tym samym kontem = ten sam timestamp.
  // Nie da się zresetować bez utworzenia nowego konta Google.
  let trialStart = null
  if (uid) {
    const user = auth.currentUser
    const creationTime = user?.metadata?.creationTime
    if (creationTime) {
      const ts = new Date(creationTime).getTime()
      if (!Number.isNaN(ts)) trialStart = ts
    }
  } else {
    // Guest — używamy localStorage. Zapisz raz przy pierwszym uruchomieniu.
    trialStart = guestTrialStart
  }

  // Zapisz trial_start dla guesta jeśli nie ma jeszcze
  useEffect(() => {
    if (uid) return // zalogowany — nie używamy guestTrialStart
    if (guestTrialStart === null) {
      setGuestTrialStart(Date.now())
    }
  }, [uid, guestTrialStart])

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
