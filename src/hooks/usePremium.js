import { useFirestore } from './useFirestore'

/**
 * usePremium(uid)
 * Feature flag — premium status per user w Firestore.
 */
export function usePremium(uid) {
  const [isPremium, setIsPremium] = useFirestore(uid, 'premium_active', false)
  const activate   = () => setIsPremium(true)
  const deactivate = () => setIsPremium(false)
  return { isPremium, activate, deactivate }
}
