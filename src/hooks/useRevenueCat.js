/**
 * useRevenueCat.js
 *
 * Integracja RevenueCat dla PWA (web).
 * Używa REST API zamiast natywnego SDK.
 *
 * Flow zakupu:
 *   1. User klika "Kup Premium"
 *   2. Otwieramy Google Play checkout URL (gdy jesteśmy w TWA)
 *      lub pokazujemy instrukcję (web fallback)
 *   3. Po zakupie weryfikujemy przez RevenueCat REST API
 *   4. Jeśli aktywna subskrypcja → activate() w Firebase
 *
 * Na etapie PWA (przed Play Store):
 *   - zakup przez web checkout nie jest dostępny
 *   - używamy trybu "manual activation" z kodem promocyjnym
 *   - po wdrożeniu TWA → pełny flow przez Play Billing
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { t, getLocale, useLocale } from '../i18n'
import { captureError, addBreadcrumb } from '../sentry'
import { getPlans } from '../data/premiumPlans'

const RC_API = 'https://api.revenuecat.com/v1'
// API key z .env — Vite wstrzykuje import.meta.env.VITE_*
// W dev używa test key, w produkcji PRODUCTION key z Play Store billing
// Format w .env: VITE_RC_PUBLIC_KEY=goog_xxxxxxx
const RC_KEY = import.meta.env.VITE_RC_PUBLIC_KEY || ''
const ENTITLEMENT = import.meta.env.VITE_RC_ENTITLEMENT || 'Spokojny Rodzic Pro'

// ─── REST API helpers ─────────────────────────────────────────────────────────

async function rcFetch(path, options = {}) {
  // Brak klucza → RC nie skonfigurowany (dev bez .env) → zwracamy null
  // Apka działa normalnie, tylko bez weryfikacji zakupów (wszystko free/trial)
  if (!RC_KEY) {
    console.warn('[RC] API key not configured — add VITE_RC_PUBLIC_KEY to .env')
    return null
  }
  const res = await fetch(`${RC_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${RC_KEY}`,
      'Content-Type': 'application/json',
      'X-Platform': 'android',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`RC ${res.status}`)
  return res.json()
}

/**
 * Pobiera lub tworzy klienta RevenueCat dla danego app_user_id (= Firebase UID)
 */
async function getOrCreateCustomer(uid) {
  return rcFetch(`/subscribers/${uid}`)
}

/**
 * Sprawdza czy użytkownik ma aktywne uprawnienie premium
 */
async function checkEntitlement(uid) {
  try {
    const data = await getOrCreateCustomer(uid)
    if (!data) return false  // RC nie skonfigurowany
    const entitlements = data?.subscriber?.entitlements || {}
    const premium = entitlements[ENTITLEMENT]
    if (!premium) return false
    const expiresAt = premium.expires_date
    if (!expiresAt) return true // lifetime
    return new Date(expiresAt) > new Date()
  } catch {
    return false
  }
}

/**
 * Aktywuje zakup przez token Google Play (używane w TWA)
 */
async function activateGooglePlayPurchase(uid, productId, purchaseToken) {
  return rcFetch(`/receipts`, {
    method: 'POST',
    body: JSON.stringify({
      app_user_id: uid,
      fetch_token: purchaseToken,
      product_id: productId,
      type: 'android',
    }),
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useRevenueCat(uid)
 *
 * v2.10.0: callback onActivate USUNIĘTY. Premium status jest teraz pisany
 * do Firestore wyłącznie przez Cloud Function `revenueCatWebhook` (server-side).
 * Client checkEntitlement wciąż dzwoni RevenueCat REST API żeby aktywnie
 * sprawdzić status — ale tylko `setIsActive(true)` w lokalnym state. Pole
 * `premium_purchased` w Firestore jest read-only z client-side.
 *
 * uid – Firebase UID
 *
 * Zwraca:
 *   isActive         – czy ma aktywną subskrypcję wg RC API (może się różnić
 *                      od `purchased` z Firestore podczas opóźnienia webhook)
 *   checking         – trwa sprawdzanie
 *   checkPremium()   – ręczne sprawdzenie (po zakupie)
 *   activateWithToken(productId, token) – aktywacja przez Play purchase token
 *   offerings        – dostępne plany
 */
export function useRevenueCat(uid) {
  const [isActive, setIsActive]   = useState(false)
  const [checking, setChecking]   = useState(false)
  const { locale } = useLocale()
  const offerings = useMemo(() => getPlans(locale), [locale])

  // Sprawdź przy montowaniu i po zmianie uid
  useEffect(() => {
    if (!uid) return
    setChecking(true)
    checkEntitlement(uid)
      .then(active => {
        setIsActive(active)
        // v2.10.0: NIE wywołujemy już onActivate. Webhook RC obsługuje
        // zapis `premium_purchased` do Firestore.
      })
      .finally(() => setChecking(false))
  }, [uid])

  const checkPremium = useCallback(async () => {
    if (!uid) return false
    setChecking(true)
    try {
      const active = await checkEntitlement(uid)
      setIsActive(active)
      return active
    } finally {
      setChecking(false)
    }
  }, [uid])

  // Aktywacja przez token Play (do użycia w TWA po zakupie).
  // RC po przyjęciu fetch_token wysyła INITIAL_PURCHASE webhook → nasza
  // Cloud Function `revenueCatWebhook` zapisze `premium_purchased = true`.
  // Client zobaczy update przez Firestore real-time listener.
  const activateWithToken = useCallback(async (productId, purchaseToken) => {
    if (!uid) return
    try {
      addBreadcrumb('purchase', 'activate-with-token-start', { productId })
      await activateGooglePlayPurchase(uid, productId, purchaseToken)
      await checkPremium()
      addBreadcrumb('purchase', 'activate-with-token-success', { productId })
    } catch (e) {
      console.warn('RC activation failed:', e)
      captureError(e, { context: 'rc-activation', productId, uid })
    }
  }, [uid, checkPremium])

  return { isActive, checking, checkPremium, activateWithToken, offerings }
}
