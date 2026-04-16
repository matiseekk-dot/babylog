import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'

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
    })
    return unsub
  }, [])

  const login  = () => signInWithPopup(auth, provider)
  const logout = () => signOut(auth)

  return { user, loading, login, logout }
}
