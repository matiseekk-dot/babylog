import { useState, useEffect, useCallback } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db, getMessagingIfSupported, VAPID_KEY } from '../firebase'
import { addBreadcrumb } from '../sentry'

/**
 * useFCM — Firebase Cloud Messaging hook.
 *
 * Odpowiada za:
 * - Pobieranie FCM tokena (po nadaniu zgody na powiadomienia)
 * - Zapis tokena do Firestore pod userId, żeby Cloud Function mogła wysyłać push
 * - Odbiór foreground messages (gdy apka otwarta) i pokazywanie notyfikacji
 *
 * Token jest unikalny per-urządzenie. Jeden user może mieć kilka tokenów
 * (telefon, tablet, laptop), więc używamy subkolekcji users/{uid}/tokens/{token}.
 *
 * Token może wygasnąć / zmienić się — Firebase czasem rotuje. Dlatego przy
 * każdym mount (gdy permission jest granted), odświeżamy.
 */
export function useFCM(userId) {
  const [fcmToken, setFcmToken] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Pobiera token i zapisuje do Firestore. Wywoływane po nadaniu zgody.
  const refreshToken = useCallback(async () => {
    if (!userId) return null
    if (typeof Notification === 'undefined') return null
    if (Notification.permission !== 'granted') return null

    const messaging = await getMessagingIfSupported()
    if (!messaging) {
      addBreadcrumb('fcm', 'not-supported')
      return null
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      })

      if (!token) {
        addBreadcrumb('fcm', 'no-token-permission-blocked')
        return null
      }

      // Zapis do Firestore pod ID = sam token (idempotentne)
      const tokenRef = doc(db, 'users', userId, 'tokens', token)
      await setDoc(tokenRef, {
        token,
        platform: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      }, { merge: true })

      setFcmToken(token)
      addBreadcrumb('fcm', 'token-registered', { tokenPrefix: token.substring(0, 12) })
      return token
    } catch (err) {
      console.error('[useFCM] getToken failed:', err)
      addBreadcrumb('fcm', 'token-failed', { error: err.message })
      return null
    }
  }, [userId])

  // Wyrejestrowanie tokena (przy logout / disable notifications)
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

  // Foreground message handler — gdy apka jest otwarta, push przychodzi
  // przez onMessage (nie przez SW). Trzeba ręcznie pokazać notyfikację.
  useEffect(() => {
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

        // Pokazujemy notyfikację przez SW registration (TWA wymaga)
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

  // Auto-refresh token gdy permission jest granted
  useEffect(() => {
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
  }
}
