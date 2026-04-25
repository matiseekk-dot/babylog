import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            "AIzaSyBDpM68v2BAdMX3sxcMe6ypnOIoNMR2Z4w",
  authDomain:        "babylog-3c1cc.firebaseapp.com",
  projectId:         "babylog-3c1cc",
  storageBucket:     "babylog-3c1cc.firebasestorage.app",
  messagingSenderId: "955437303426",
  appId:             "1:955437303426:web:fbb2637420255e5561969b",
}

// VAPID public key — używany przy getToken() do uwierzytelnienia push subscription.
// Bezpieczny do publikacji (publiczny klucz; prywatna część jest po stronie Firebase).
export const VAPID_KEY = "BD8PEaif5K4Wdkll17LNMI4eUZScDLeeYieTNjeNTZ9-GftEFaEFM-L7l4ssMzgYeGjpqPZLwz9Uw-ueO2PsVPs"

const app = initializeApp(firebaseConfig)

export const auth     = getAuth(app)
export const provider = new GoogleAuthProvider()

// Nowoczesna konfiguracja cache (zastępuje enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// Messaging — lazy init, bo isSupported() jest async i nie każda przeglądarka
// to wspiera (np. Safari iOS przed 16.4, niektóre wersje TWA).
let messagingInstance = null
let messagingChecked = false

export async function getMessagingIfSupported() {
  if (messagingChecked) return messagingInstance
  messagingChecked = true
  try {
    const supported = await isSupported()
    if (!supported) {
      console.warn('[firebase] FCM not supported in this browser')
      return null
    }
    messagingInstance = getMessaging(app)
    return messagingInstance
  } catch (err) {
    console.error('[firebase] FCM init failed:', err)
    return null
  }
}
