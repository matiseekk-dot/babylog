import { useStorage } from './useStorage'

/**
 * usePremium()
 *
 * Prosty feature flag dla systemu freemium.
 * Stan zapisywany w localStorage — trwa między sesjami.
 *
 * Zwraca:
 *   isPremium  – boolean
 *   activate() – aktywuje premium (do podpięcia pod płatność)
 *   deactivate() – przywraca free (dev/debug)
 *
 * Gdy będziesz integrować płatności (np. Stripe, RevenueCat, Play Billing):
 *   1. Wywołaj activate() po potwierdzeniu zakupu
 *   2. Wywołaj deactivate() po wygaśnięciu subskrypcji
 *   Reszta aplikacji nie wymaga zmian.
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useStorage('premium_active', false)

  const activate   = () => setIsPremium(true)
  const deactivate = () => setIsPremium(false)

  return { isPremium, activate, deactivate }
}
