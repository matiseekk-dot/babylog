import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'
import { captureError, addBreadcrumb, setUserContext } from '../sentry'

/**
 * useAuth()
 * Zwraca: { user, loading, signIn, signOut }
 * user: null = niezalogowany, obiekt = zalogowany
 *
 * Używa signInWithRedirect zamiast signInWithPopup — popup nie działa
 * w Android WebView (Capacitor). Redirect flow działa w każdym środowisku.
 */
export function useAuth() {
  const [user, setUser]       = useState(undefined) // undefined = ładowanie
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obsłuż powrót po redirect Google OAuth (wywoływane po każdym załadowaniu strony)
    getRedirectResult(auth).catch(e => {
      captureError(e, { context: 'auth-redirect-result' })
    })

    const unsub = onAuthStateChanged(auth, u => {
      setUser(u ?? null)
      setLoading(false)
      setUserContext(u?.uid)  // Ustaw UID w Sentry dla filtrowania błędów
      addBreadcrumb('auth', u ? 'signed-in' : 'signed-out', { uid: u?.uid })
    })
    return unsub
  }, [])

  const login = async () => {
    try {
      await signInWithRedirect(auth, provider)
      // signInWithRedirect nawiguje przeglądarkę/WebView do Google OAuth —
      // kod poniżej nie wykona się do czasu powrotu (obsługa w getRedirectResult powyżej)
    } catch (e) {
      captureError(e, { context: 'auth-signin' })
      throw e
    }
  }
  const logout = () => signOut(auth)

  return { user, loading, login, logout }
}
