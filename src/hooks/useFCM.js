import { useState, useEffect, useCallback } from 'react'
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

  // ─── Pobranie tokena + zapis do Firestore. Wywoływane po nadaniu zgody. ───
  const refreshToken = useCallback(async () => {
    if (!userId) return null

    // ── ŚCIEŻKA NATYWNA (Capacitor Android) ──
    if (isCapacitorNative()) {
      try {
        const PushNotifications = await getPushPlugin()

        // Android 13+ wymaga zgody runtime (POST_NOTIFICATIONS).
        let perm = await PushNotifications.checkPermissions()
        if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
          perm = await PushNotifications.requestPermissions()
        }
        if (perm.receive !== 'granted') {
          setPushDebug(`perm=${perm.receive}`)
          addBreadcrumb('fcm', 'native-permission-not-granted', { state: perm.receive })
          return perm.receive === 'denied' ? 'denied' : null
        }

        // register() uruchamia pobranie tokena → przychodzi przez listener
        // 'registration' (ustawiony w useEffect niżej), który zapisuje go
        // do Firestore. Tu zwracamy 'granted' dla UX (toast w Ustawieniach).
        setPushDebug(`perm=granted · register()…`)
        await PushNotifications.register()
        addBreadcrumb('fcm', 'native-register-called')
        return 'granted'
      } catch (err) {
        setPushDebug(`register ERR=${(err?.message ?? String(err)).slice(0, 100)}`)
        console.error('[useFCM] native register failed:', err)
        addBreadcrumb('fcm', 'native-register-failed', { error: err?.message })
        captureError(err, { context: 'fcm-native-register' })
        return null
      }
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

  // ─── NATYWNE listenery (Capacitor): token + odbiór push w foreground ───
  // Token z natywnego pluginu przychodzi asynchronicznie przez 'registration'.
  useEffect(() => {
    if (!isCapacitorNative() || !userId) {
      return
    }

    let regListener = null
    let errListener = null
    let recvListener = null
    let cancelled = false

    ;(async () => {
      try {
        const PushNotifications = await getPushPlugin()

        regListener = await PushNotifications.addListener('registration', async (token) => {
          try {
            await saveTokenToFirestore(userId, token.value, true)
            setFcmToken(token.value)
            setPushDebug(`reg ok=${(token.value || '').slice(0, 8)} saved`)
            addBreadcrumb('fcm', 'native-token-registered', {
              tokenPrefix: (token.value || '').substring(0, 12),
            })
          } catch (e) {
            setPushDebug(`save ERR=${(e?.message ?? String(e)).slice(0, 100)}`)
            console.error('[useFCM] native token save failed:', e)
            captureError(e, { context: 'fcm-native-save' })
          }
        })

        errListener = await PushNotifications.addListener('registrationError', (err) => {
          const msg = err?.error ?? err?.message ?? JSON.stringify(err)
          setPushDebug(`regErr=${String(msg).slice(0, 120)}`)
          console.error('[useFCM] native registrationError:', err)
          addBreadcrumb('fcm', 'native-registration-error', { error: err?.error })
        })

        // Foreground: gdy apka otwarta, push przychodzi tutaj. System Android
        // nie pokazuje go sam w foreground — ale w tle (background) wyświetla
        // automatycznie przez MessagingService. Tu tylko breadcrumb.
        recvListener = await PushNotifications.addListener('pushNotificationReceived', (notif) => {
          addBreadcrumb('fcm', 'native-foreground-received', { title: notif?.title })
        })

        if (cancelled) return

        // Jeśli zgoda już nadana — odśwież token po cichu (bez promptu).
        const perm = await PushNotifications.checkPermissions()
        if (perm.receive === 'granted') {
          await PushNotifications.register()
        }

        setIsReady(true)
      } catch (e) {
        console.error('[useFCM] native push init failed:', e)
        captureError(e, { context: 'fcm-native-init' })
        setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
      regListener?.remove?.()
      errListener?.remove?.()
      recvListener?.remove?.()
    }
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
