import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'
import { captureError, addBreadcrumb, setUserContext } from '../sentry'

/**
 * useAuth()
 * Zwraca: { user, loading, signIn, signOut }
 * user: null = niezalogowany, obiekt = zalogowany
 */
export function useAuth() {
  const [user, setUser]       = useState(undefined) // undefined = ładowanie
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      return await signInWithPopup(auth, provider)
    } catch (e) {
      captureError(e, { context: 'auth-signin' })
      throw e
    }
  }
  const logout = () => signOut(auth)

  return { user, loading, login, logout }
}
