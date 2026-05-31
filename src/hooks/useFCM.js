import { useState, useEffect, useCallback, useRef } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db, getMessagingIfSupported, VAPID_KEY } from '../firebase'
import { addBreadcrumb, captureError } from '../sentry'

/**
 * useFCM — Firebase Cloud Messaging hook.
 *
 * DWA TRYBY (v2.12.2):
 *  - Capacitor (Android app): NATYWNY push przez @capacitor/push-notifications.
 *    WebView NIE obsługuje webowego Web Push (brak push service), więc webowy
 *    getToken() nigdy nie zwracał tokena w aplikacji. Natywna wtyczka pobiera
 *    token FCM bezpośrednio z systemu Android i zwraca go przez listener
 *    'registration'. Wymaga wtyczki w projekcie natywnym + nowego AAB.
 *  - Przeglądarka (PWA): webowy Firebase Messaging (getToken + VAPID + SW).
 *
 * W obu trybach token zapisujemy do users/{uid}/tokens/{token}, a Cloud
 * Function `sendPush` wysyła do tych tokenów przez Firebase Admin SDK —
 * natywny i webowy token FCM działają z Admin SDK tak samo.
 */

function isCapacitorNative() {
  return !!(window.Capacitor?.isNativePlatform?.())
}

// Lazy import wtyczki natywnej — tylko gdy faktycznie jesteśmy w aplikacji.
// Dzięki temu webowy bundle nie ładuje tego kodu w przeglądarce (code-split).
async function getPushPlugin() {
  const mod = await import('@capacitor/push-notifications')
  return mod.PushNotifications
}

// Zwraca {ok,v} po sukcesie, {ok:false,err} po błędzie, {ok:false,timeout:true}
// po przekroczeniu czasu. KRYTYCZNE dla natywnego mostu Capacitor: niektóre
// wywołania potrafią NIGDY się nie rozwiązać (most v6↔v8 / brak gotowości),
// a wtedy await wisi w nieskończoność i blokuje cały przepływ. Timeout to ratuje.
function withTimeout(p, ms) {
  return Promise.race([
    Promise.resolve(p).then((v) => ({ ok: true, v })).catch((err) => ({ ok: false, err })),
    new Promise((res) => setTimeout(() => res({ ok: false, timeout: true }), ms)),
  ])
}

// Wspólny zapis tokena do Firestore (idempotentny — ID dokumentu = token).
async function saveTokenToFirestore(userId, token, isNative) {
  const tokenRef = doc(db, 'users', userId, 'tokens', token)
  await setDoc(tokenRef, {
    token,
    platform: navigator.userAgent,
    native: !!isNative,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  }, { merge: true })
}

export function useFCM(userId) {
  const [fcmToken, setFcmToken] = useState(null)
  const [isReady, setIsReady] = useState(false)
  // DIAGNOSTYKA push v48 — surowy ślad natywnego przepływu rejestracji tokena.
  // Pokazywany w DIAG w SettingsScreen. Usunąć po zdiagnozowaniu.
  const [pushDebug, setPushDebug] = useState('')
  // Czy natywne listenery push są już podpięte (idempotencja — mount effect
  // bywa zbyt wczesny, gdy most natywny jeszcze nie gotowy → addListener wisi).
  const nativeListenersRef = useRef(false)

  // Podpina natywne listenery TYLKO RAZ, z timeoutami. registration → zapis
  // tokena do Firestore + setFcmToken (to sprawia, że Cloud Function ma dokąd
  // słać push). Zwraca true gdy podpięte/już-podpięte, false gdy addListener
  // zawisł (timeout) — wtedy caller przerywa z czytelnym komunikatem.
  const ensureNativeListeners = useCallback(async (PushNotifications) => {
    if (nativeListenersRef.current) return true
    const la = await withTimeout(PushNotifications.addListener('registration', async (token) => {
      try {
        await saveTokenToFirestore(userId, token.value, true)
        setFcmToken(token.value)
        setPushDebug(`reg ok=${(token.value || '').slice(0, 8)} saved`)
        addBreadcrumb('fcm', 'native-token-registered', {
          tokenPrefix: (token.value || '').substring(0, 12),
        })
      } catch (e) {
        setPushDebug(`save ERR=${(e?.message ?? String(e)).slice(0, 100)}`)
        captureError(e, { context: 'fcm-native-save' })
      }
    }), 5000)
    if (la.timeout) { setPushDebug('addListener=TIMEOUT'); return false }
    if (!la.ok) { setPushDebug(`addListener ERR=${(la.err?.message ?? String(la.err)).slice(0, 80)}`); return false }
    await withTimeout(PushNotifications.addListener('registrationError', (err) => {
      const msg = err?.error ?? err?.message ?? JSON.stringify(err)
      setPushDebug(`regErr=${String(msg).slice(0, 120)}`)
      addBreadcrumb('fcm', 'native-registration-error', { error: err?.error })
    }), 5000)
    nativeListenersRef.current = true
    return true
  }, [userId])

  // ─── Pobranie tokena + zapis do Firestore. Wywoływane po nadaniu zgody. ───
  const refreshToken = useCallback(async () => {
    if (!userId) return null

    // ── ŚCIEŻKA NATYWNA (Capacitor Android) ──
    // WSZYSTKIE natywne wywołania owinięte w timeout — most Capacitor potrafi
    // NIGDY nie rozwiązać promise (v6↔v8 / brak gotowości), co wieszało cały
    // przepływ ("proszę o zgodę…" bez końca). Listenery podpinamy DOPIERO tutaj,
    // po geście usera (w mount effekcie most bywa niegotowy i blokuje kolejkę).
    if (isCapacitorNative()) {
      const imp = await withTimeout(getPushPlugin(), 6000)
      if (imp.timeout) { setPushDebug('import=TIMEOUT'); return null }
      if (!imp.ok) { setPushDebug(`import ERR=${(imp.err?.message ?? String(imp.err)).slice(0, 80)}`); return null }
      const PushNotifications = imp.v

      const listenersOk = await ensureNativeListeners(PushNotifications)
      if (!listenersOk) return null

      const chk = await withTimeout(PushNotifications.checkPermissions(), 5000)
      if (chk.timeout) { setPushDebug('check=TIMEOUT'); return null }
      if (!chk.ok) { setPushDebug(`check ERR=${(chk.err?.message ?? String(chk.err)).slice(0, 80)}`); return null }
      let receive = chk.v?.receive

      if (receive === 'prompt' || receive === 'prompt-with-rationale') {
        const req = await withTimeout(PushNotifications.requestPermissions(), 60000)
        if (req.timeout) { setPushDebug('request=TIMEOUT'); return null }
        if (!req.ok) { setPushDebug(`request ERR=${(req.err?.message ?? String(req.err)).slice(0, 80)}`); return null }
        receive = req.v?.receive
      }

      if (receive !== 'granted') {
        setPushDebug(`perm=${receive}`)
        addBreadcrumb('fcm', 'native-permission-not-granted', { state: receive })
        return receive === 'denied' ? 'denied' : null
      }

      // register() → token przychodzi asynchronicznie przez listener 'registration'.
      setPushDebug('perm=granted · register()…')
      const reg = await withTimeout(PushNotifications.register(), 10000)
      if (reg.timeout) { setPushDebug('register=TIMEOUT'); return null }
      if (!reg.ok) { setPushDebug(`register ERR=${(reg.err?.message ?? String(reg.err)).slice(0, 80)}`); return null }
      addBreadcrumb('fcm', 'native-register-called')
      return 'granted'
    }

    // ── ŚCIEŻKA WEBOWA (PWA w przeglądarce) ──
    if (typeof Notification === 'undefined') return null

    if (Notification.permission === 'denied') {
      addBreadcrumb('fcm', 'permission-denied', { userId })
      console.warn('[useFCM] Notification.permission = "denied" — user musi ręcznie odblokować w ustawieniach systemu')
      return null
    }
    if (Notification.permission !== 'granted') {
      addBreadcrumb('fcm', 'permission-not-granted', { state: Notification.permission })
      return null
    }

    const messaging = await getMessagingIfSupported()
    if (!messaging) {
      addBreadcrumb('fcm', 'not-supported')
      return null
    }

    try {
      // v2.12.1: jawna rejestracja firebase-messaging-sw.js z właściwym scope.
      let swReg
      try {
        swReg = await navigator.serviceWorker.register(
          '/babylog/firebase-messaging-sw.js',
          { scope: '/babylog/' }
        )
      } catch (swErr) {
        addBreadcrumb('fcm', 'messaging-sw-register-failed', { error: swErr?.message })
        swReg = await navigator.serviceWorker.getRegistration('/babylog/')
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
      })

      if (!token) {
        addBreadcrumb('fcm', 'no-token-permission-blocked')
        return null
      }

      await saveTokenToFirestore(userId, token, false)
      setFcmToken(token)
      addBreadcrumb('fcm', 'token-registered', { tokenPrefix: token.substring(0, 12) })
      return token
    } catch (err) {
      console.error('[useFCM] getToken failed:', err)
      addBreadcrumb('fcm', 'token-failed', { error: err.message })
      return null
    }
  }, [userId])

  // ─── Wyrejestrowanie tokena (logout / disable notifications) ───
  const unregisterToken = useCallback(async () => {
    if (!userId || !fcmToken) return
    try {
      await deleteDoc(doc(db, 'users', userId, 'tokens', fcmToken))
      setFcmToken(null)
      addBreadcrumb('fcm', 'token-unregistered')
    } catch (err) {
      console.error('[useFCM] unregister failed:', err)
    }
  }, [userId, fcmToken])

  // ─── NATYWNE (Capacitor): NIE wołamy pluginu na starcie ───
  // KRYTYCZNE: wcześniej mount effect wołał addListener/register zaraz po
  // starcie apki, gdy most natywny nie był jeszcze gotowy → wywołanie wisiało i
  // BLOKOWAŁO kolejkę mostu, przez co późniejszy refreshToken (po kliknięciu)
  // też wisiał ("proszę o zgodę…" bez końca). Teraz całą rejestrację robi
  // refreshToken DOPIERO po geście usera (z timeoutami). Token raz zapisany do
  // Firestore zostaje, więc push działa też po kolejnych otwarciach bez klikania.
  useEffect(() => {
    if (!isCapacitorNative() || !userId) return
    setIsReady(true)
  }, [userId])

  // ─── WEBOWY foreground handler (PWA) — pomijany na natywnym ───
  useEffect(() => {
    if (isCapacitorNative()) {
      return
    }

    let unsubscribe = null

    ;(async () => {
      const messaging = await getMessagingIfSupported()
      if (!messaging) {
        setIsReady(true)
        return
      }

      unsubscribe = onMessage(messaging, async (payload) => {
        const { notification, data } = payload
        if (!notification) return
        try {
          const reg = await navigator.serviceWorker?.getRegistration()
          if (reg) {
            await reg.showNotification(notification.title || 'Spokojny Rodzic', {
              body: notification.body || '',
              icon: '/babylog/icon-192.png',
              badge: '/babylog/icon-72.png',
              tag: data?.tag || 'fcm-foreground',
              renotify: true,
              vibrate: [200, 100, 200],
              data: { url: data?.url || '/babylog/' },
            })
          }
        } catch (err) {
          console.error('[useFCM] foreground notification failed:', err)
        }
      })

      setIsReady(true)
    })()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // ─── Auto-refresh (webowy) gdy permission już granted ───
  // Natywny auto-refresh jest w listener-effect powyżej (po sprawdzeniu zgody).
  useEffect(() => {
    if (isCapacitorNative()) return
    if (!isReady || !userId) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      refreshToken()
    }
  }, [isReady, userId, refreshToken])

  return {
    fcmToken,
    isReady,
    refreshToken,
    unregisterToken,
    pushDebug,
  }
}
