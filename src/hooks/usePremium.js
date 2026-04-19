import { useEffect, useState } from 'react'
import { useFirestore } from './useFirestore'

const TRIAL_DAYS = 14

/**
 * usePremium(uid)
 *
 * Model: Trial-led freemium
 * - Nowy użytkownik: 14 dni pełnego Premium za darmo, bez karty
 * - Po 14 dniach: downgrade do free (dopóki nie kupi)
 * - Po kupnie: isPremium = true, trial się nie resetuje
 *
 * Stan:
 *   trialStart    – timestamp pierwszej wizyty
 *   purchased     – czy kupiono Premium (z RevenueCat)
 */
export function usePremium(uid) {
  const [trialStart, setTrialStart] = useFirestore(uid, 'trial_start', null)
  const [purchased, setPurchased]   = useFirestore(uid, 'premium_purchased', false)

  // Zapisz start trialu przy pierwszym uruchomieniu
  // BUG-007: działa zarówno dla guest (localStorage) jak i zalogowanego (Firestore)
  useEffect(() => {
    if (trialStart === null) {
      setTrialStart(Date.now())
    }
  }, [trialStart])

  // Wylicz czy Premium jest aktywny
  const now = Date.now()
  const trialEndMs = trialStart ? trialStart + TRIAL_DAYS * 24 * 60 * 60 * 1000 : 0
  const trialActive = trialStart && now < trialEndMs
  const isPremium = purchased || trialActive

  // Dni trialu pozostałe
  const trialDaysLeft = trialActive
    ? Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000))
    : 0

  const activate   = () => setPurchased(true)
  const deactivate = () => setPurchased(false)

  return {
    isPremium,
    isOnTrial: trialActive && !purchased,
    trialDaysLeft,
    purchased,
    activate,
    deactivate,
  }
}
