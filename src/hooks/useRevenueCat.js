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
// Fallback hardcoded — publiczny klucz SDK, bezpieczny w kodzie.
// GitHub Secrets mają pierwszeństwo gdy ustawione.
const RC_KEY = import.meta.env.VITE_RC_PUBLIC_KEY || 'goog_CePHovfsjHOiYaoKwnFhtcDFnwq'
const ENTITLEMENT = import.meta.env.VITE_RC_ENTITLEMENT || 'Spokojny Rodzic Pro'

// v2.10.3: Whitelist znanych product identifiers które są LIFETIME (one-time
// purchase, nigdy nie wygasają). RC zwraca entitlement bez `expires_date`
// dla:
//   (a) prawdziwych lifetime products (np. "Pro Lifetime")
//   (b) granted promotional bez expiration
//   (c) niespodziewanych przypadków (bug w API, zmiana struktury)
//
// Wcześniej (v2.9.x) traktowaliśmy każde brak `expires_date` jako lifetime →
// można było dostać "permanent Premium" przez granted promotional bez daty.
// Teraz: tylko jeśli product_identifier jest na whiteliście, traktujemy jako
// lifetime. Inaczej → fallback do "wygasłe / nie-Premium".
//
// ZAKTUALIZOWAĆ TO gdy w RC dashboard pojawi się prawdziwy lifetime product.
// Aktualnie apka nie sprzedaje lifetime — tylko monthly/yearly subskrypcje.
const LIFETIME_PRODUCT_IDS = [
  // v2.11.14: lifetime SKU dodany defensywnie. Jest w premiumPlans.js i UI
  // pokazuje go w paywall — gdy user kupi, RC entitlement nie ma `expires_date`
  // (one-time purchase). Bez tej whitelisty checkEntitlement zwracałby false →
  // user płaci za lifetime ale apka nie widzi Premium. Jeśli kiedykolwiek SKU
  // zmieni nazwę w Play Console — ZSYNCHRONIZOWAĆ tutaj.
  'spokojny_rodzic_premium_lifetime',
]

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
  if (!res.ok) {
    // v2.11.14: spróbuj wyciągnąć body — RC zwraca JSON {code, message}
    // przy 4xx/5xx. Wcześniej rzucaliśmy `RC 400` bez kontekstu → niemożliwe
    // do zdiagnozowania w Sentry. Teraz: `RC 400: 7110 - The receipt is invalid`.
    let detail = ''
    try {
      const body = await res.text()
      // Limit do 500 znaków — gdyby RC zwrócił duży payload (mało prawdopodobne)
      detail = body.slice(0, 500)
    } catch {}
    const err = new Error(`RC ${res.status}${detail ? `: ${detail}` : ''}`)
    err.status = res.status
    err.body = detail
    err.path = path
    throw err
  }
  return res.json()
}

/**
 * Pobiera lub tworzy klienta RevenueCat dla danego app_user_id (= Firebase UID)
 */
async function getOrCreateCustomer(uid) {
  return rcFetch(`/subscribers/${uid}`)
}

/**
 * Sprawdza czy użytkownik ma aktywne uprawnienie premium.
 *
 * v2.10.3: defensywne sprawdzenie. Wcześniej brak `expires_date` był
 * automatycznie traktowany jako lifetime — co było zbyt permisywne.
 * Teraz:
 *   - Jeśli `expires_date` jest → sprawdź czy w przyszłości
 *   - Jeśli `expires_date` brak → musi być product na LIFETIME_PRODUCT_IDS
 *     whiteliście, inaczej → false (defensywnie)
 *   - Granted promotional bez expiration → też false (server webhook
 *     zarządza Premium, nie polegamy na takich edge-case'ach)
 */
async function checkEntitlement(uid) {
  try {
    const data = await getOrCreateCustomer(uid)
    if (!data) return false  // RC nie skonfigurowany
    const entitlements = data?.subscriber?.entitlements || {}
    const premium = entitlements[ENTITLEMENT]
    if (!premium) return false

    const expiresAt = premium.expires_date
    const productId = premium.product_identifier

    if (expiresAt) {
      // Standardowa subskrypcja — expires_date musi być w przyszłości
      return new Date(expiresAt) > new Date()
    }

    // Brak expires_date — tylko jeśli product to autentyczny lifetime
    if (productId && LIFETIME_PRODUCT_IDS.includes(productId)) {
      addBreadcrumb('rc', 'lifetime-entitlement-confirmed', { productId })
      return true
    }

    // Brak expires_date + product nie na whiteliście = nie traktujemy jako Premium.
    // To może być granted promotional bez expiration albo niespodziewana
    // struktura — bezpiecznie fail-closed.
    console.warn('[RC] Entitlement bez expires_date i bez whitelisted product:', productId)
    return false
  } catch {
    return false
  }
}

/**
 * Aktywuje zakup przez token Google Play (używane w TWA).
 *
 * v2.11.19 — KRYTYCZNY FIX: usunięto `type: 'android'` z body.
 *
 * Wcześniej (do v2.11.18) wysyłaliśmy `type: 'android'` w body. Nowy RC API
 * (v1) tego pola NIE AKCEPTUJE — zwraca błąd 400:
 *   {"code":7226,"message":"type: Extra inputs are not permitted"}
 *
 * Platforma jest specyfikowana TYLKO przez header `X-Platform: android`
 * (już ustawiamy w rcFetch). Pole `type` w body to leftover ze starej
 * wersji API. To dosłownie blokowało WSZYSTKIE walidacje purchase tokenów —
 * dlatego mieliśmy 13 customers w RC ale 0 active subscriptions.
 *
 * Każdy testowy zakup użytkownika (paid + unpaid) odbijał się o ten 400 →
 * RC nie rejestrował zakupu → webhook nigdy nie firował → Premium nigdy
 * się nie aktywował, mimo że Google Play pobrał kasę i acknowledge zadziałał.
 *
 * Reference: https://www.revenuecat.com/reference/receipts
 */
async function activateGooglePlayPurchase(uid, productId, purchaseToken) {
  return rcFetch(`/receipts`, {
    method: 'POST',
    body: JSON.stringify({
      app_user_id: uid,
      fetch_token: purchaseToken,
      product_id: productId,
      // ❌ NIE WOLNO dodawać `type` — RC zwróci 7226 i całe purchase flow się
      // wywali. Platform = X-Platform header w rcFetch.
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
  //
  // v2.11.13: RZUCA error zamiast cicho catchować. Wcześniej silent catch ukrywał
  // przed handleActivate fakt że RC odrzucił token (np. uprawnienia Service Account
  // brakujące, malformed token, RC API down). User widział fake success toast
  // mimo że pieniądze poszły do Google a Premium nie aktywne.
  // Caller MUSI mieć try/catch + odpowiedni UX dla failure case.
  const activateWithToken = useCallback(async (productId, purchaseToken) => {
    if (!uid) {
      throw new Error('Cannot activate without uid (user not logged in)')
    }
    // v2.11.14: log token prefix (NIGDY pełny token — to secret) + productId.
    // To pojawi się w Sentry breadcrumbs gdy następny zakup się posypie —
    // zobaczymy czy token w ogóle dotarł, jaki SKU, jakiego użył usera.
    const tokenPrefix = (purchaseToken || '').slice(0, 12)
    addBreadcrumb('purchase', 'activate-with-token-start', {
      productId,
      tokenPrefix: `${tokenPrefix}…`,
      tokenLen: purchaseToken?.length || 0,
    })
    try {
      const result = await activateGooglePlayPurchase(uid, productId, purchaseToken)
      if (result === null) {
        // rcFetch returned null → RC API key not configured (env missing).
        throw new Error('RC API key not configured')
      }
      await checkPremium()
      addBreadcrumb('purchase', 'activate-with-token-success', { productId })
      return result
    } catch (e) {
      // v2.11.14: bogatsze logowanie. Status code z RC + body (zawiera RC error code,
      // np. 7110 = invalid receipt → Service Account nie ma perms; 7240 = product
      // not configured w RC dashboard; etc.).
      const ctx = {
        context: 'rc-activation',
        productId,
        uid,
        status: e.status || null,
        body: e.body || null,
        path: e.path || null,
      }
      console.warn('[RC] activation failed:', e.message, ctx)
      addBreadcrumb('purchase', 'activate-with-token-failed', {
        status: e.status || 'unknown',
        message: (e.message || '').slice(0, 200),
      })
      captureError(e, ctx)
      throw e // re-throw so caller can show proper UX
    }
  }, [uid, checkPremium])

  return { isActive, checking, checkPremium, activateWithToken, offerings }
}
