import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { auth, provider } from '../firebase'
import { captureError, addBreadcrumb, setUserContext } from '../sentry'

/**
 * useAuth()
 * Zwraca: { user, loading, login, logout }
 *
 * Dwa tryby logowania:
 *  - Capacitor (Android app): natywny Google Sign-In przez GoogleAuth plugin
 *    → natywny dialog wyboru konta, zero WebView redirects, zero błędu 400
 *  - Przeglądarka (PWA): signInWithRedirect (standardowy Firebase flow)
 */

function isCapacitorNative() {
  return !!(window.Capacitor?.isNativePlatform?.())
}

// Web client ID (oauth_client type 3 z google-services.json / serverClientId).
// Plugin @codetrix-studio/capacitor-google-auth@3.4.0-rc.4 ma PUSTE load(),
// więc googleSignInClient powstaje WYŁĄCZNIE po jawnym initialize().
// Bez tego signIn() rzuca NPE (GoogleSignInClient.getSignInIntent() on null).
const GOOGLE_WEB_CLIENT_ID =
  '955437303426-7leu0fvsj53c75vtvc12qhonq9su91h4.apps.googleusercontent.com'

let googleAuthInitialized = false
async function ensureGoogleAuthInitialized() {
  if (googleAuthInitialized) return
  await GoogleAuth.initialize({
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  })
  googleAuthInitialized = true
}

export function useAuth() {
  const [user, setUser]       = useState(undefined) // undefined = ładowanie
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tylko w przeglądarce obsłuż powrót po redirect OAuth
    if (!isCapacitorNative()) {
      getRedirectResult(auth).catch(e => {
        captureError(e, { context: 'auth-redirect-result' })
      })
    }

    const unsub = onAuthStateChanged(auth, u => {
      setUser(u ?? null)
      setLoading(false)
      setUserContext(u?.uid)
      addBreadcrumb('auth', u ? 'signed-in' : 'signed-out', { uid: u?.uid })
    })
    return unsub
  }, [])

  const login = async () => {
    try {
      if (isCapacitorNative()) {
        // Natywne logowanie — pojawia się Android dialog wyboru konta Google,
        // żadnych przekierowań WebView, żadnego błędu 400.
        // WYMAGANE: initialize() przed signIn() (inaczej NPE w pluginie).
        await ensureGoogleAuthInitialized()
        const googleUser = await GoogleAuth.signIn()
        const idToken = googleUser.authentication.idToken
        const credential = GoogleAuthProvider.credential(idToken)
        return await signInWithCredential(auth, credential)
      } else {
        // Fallback dla PWA w przeglądarce
        await signInWithRedirect(auth, provider)
      }
    } catch (e) {
      captureError(e, { context: 'auth-signin' })
      throw e
    }
  }

  const logout = async () => {
    if (isCapacitorNative()) {
      try { await GoogleAuth.signOut() } catch (_) { /* ignoruj */ }
    }
    return signOut(auth)
  }

  return { user, loading, login, logout }
}
