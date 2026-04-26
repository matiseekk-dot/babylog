import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
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

// ──────────────────────────────────────────────────────────────────────────
// App Check (v2.10.0)
// ──────────────────────────────────────────────────────────────────────────
//
// Cel: zablokować requesty do Firestore/Auth/Functions które nie pochodzą
// z autentycznej instancji apki. Wcześniej każdy mógł:
//   1. Wziąć Twój `firebaseConfig` (jest publiczny w bundle)
//   2. Napisać własny skrypt który dzwoni Firestore z Twoim `apiKey`
//   3. Spamować Firestore na Twój koszt lub robić mass-export danych
//
// App Check rozwiązuje to przez:
//   - Web (PWA poza TWA): reCAPTCHA v3 — niewidoczny challenge w tle
//   - TWA (Android Chrome wrapper): Play Integrity API (auto-działa przez TWA)
//
// Setup wymaga site key z https://www.google.com/recaptcha/admin/create
// (typ "reCAPTCHA v3", zarejestrowane domeny: matiseekk-dot.github.io,
// localhost dla dev). Wartość przez env var VITE_RECAPTCHA_SITE_KEY.
//
// Jeśli env var nie jest ustawiony (np. dev local), App Check NIE jest
// inicjalizowany — apka działa normalnie, ale request idą bez App Check
// tokenu. Po włączeniu enforce w Console te requesty będą odrzucane
// z 403 — czyli env var musi być ustawiony przed wgraniem do prod.
//
// Faza monitor: pierwsze 7 dni po wdrożeniu w Firebase Console wybieramy
// "Monitor" — nie blokuje, tylko loguje. Sprawdzamy że ~99%+ requestów
// jest verified, dopiero wtedy włączamy "Enforce".

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

export let appCheck = null
if (RECAPTCHA_SITE_KEY && typeof window !== 'undefined') {
  try {
    // Debug mode dla developmentu lokalnego.
    // Jak włączyć:
    //   1. Otwórz DevTools → Application → Service Workers → Unregister
    //   2. W konsoli: self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    //   3. Reload, w konsoli pojawi się debug token
    //   4. Skopiuj do Firebase Console → App Check → Manage debug tokens
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-undef
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
    console.info('[firebase] App Check initialized')
  } catch (err) {
    console.error('[firebase] App Check init failed:', err)
    // Nie crash apki — kontynuuj bez App Check (prod: requesty mogą być
    // odrzucane gdy enforce włączony).
  }
} else if (!RECAPTCHA_SITE_KEY) {
  console.warn('[firebase] App Check skipped — no VITE_RECAPTCHA_SITE_KEY in env')
}

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
