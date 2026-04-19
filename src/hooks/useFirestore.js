import { useState, useEffect, useRef } from 'react'
import {
  doc, collection, getDocs, setDoc, deleteDoc, onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'

// Offline persistence jest teraz skonfigurowana w firebase.js
// przez initializeFirestore z persistentLocalCache
export function enableOffline() { /* no-op, handled at init */ }

const LS_PREFIX = 'babylog_'

function lsLoad(key, fallback) {
  try {
    const v = localStorage.getItem(LS_PREFIX + key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

// ─── Ścieżka dokumentu w Firestore ───────────────────────────────────────────
// users/{uid}/data/{key}  →  pole "value"

function docRef(uid, key) {
  return doc(db, 'users', uid, 'data', key)
}

/**
 * useFirestore(uid, key, fallback)
 *
 * Drop-in zamiennik useStorage — identyczny API:
 *   const [value, setValue] = useFirestore(uid, 'feed_default', [])
 *
 * - Gdy uid === null → działa jak localStorage (offline / niezalogowany)
 * - Przy pierwszym logowaniu migruje dane z localStorage do Firestore
 * - Subskrybuje real-time updates (onSnapshot)
 */
export function useFirestore(uid, key, fallback) {
  const [state, setState] = useState(() => lsLoad(key, fallback))
  const migrated = useRef(false)

  useEffect(() => {
    if (!uid) {
      // Tryb offline — czytaj z localStorage
      setState(lsLoad(key, fallback))
      return
    }

    // Migracja localStorage → Firestore (tylko raz)
    if (!migrated.current) {
      migrated.current = true
      const local = lsLoad(key, null)
      if (local !== null) {
        setDoc(docRef(uid, key), { value: local }).catch(() => {})
      }
    }

    // Real-time subscription
    const unsub = onSnapshot(docRef(uid, key), snap => {
      if (snap.exists()) {
        const val = snap.data().value ?? fallback
        // Keep localStorage in sync so rule engine can read latest data
        try { localStorage.setItem('babylog_' + key, JSON.stringify(val)) } catch {}
        setState(val)
      } else {
        setState(fallback)
      }
    }, () => {
      // Błąd sieci — fallback do localStorage
      setState(lsLoad(key, fallback))
    })

    return unsub
  }, [uid, key])

  const set = (val) => {
    const next = typeof val === 'function' ? val(state) : val

    // Zawsze zapisz lokalnie (instant UI + offline backup)
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(next)) } catch {}
    setState(next)

    // Zapisz do Firestore jeśli zalogowany
    if (uid) {
      setDoc(docRef(uid, key), { value: next }).catch(() => {})
    }
  }

  return [state, set]
}

/**
 * migrateAllLocalData(uid)
 * Migruje wszystkie klucze babylog_ z localStorage do Firestore.
 * Wywołaj raz po zalogowaniu.
 */
export async function migrateAllLocalData(uid) {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
  const migratedKeys = []
  const promises = keys.map(async fullKey => {
    const key = fullKey.slice(LS_PREFIX.length)
    try {
      const value = JSON.parse(localStorage.getItem(fullKey))
      await setDoc(doc(db, 'users', uid, 'data', key), { value })
      migratedKeys.push(fullKey)
    } catch { /* skip */ }
  })
  await Promise.all(promises)
  // BUG-010: Po udanej migracji usuń z localStorage żeby nie duplikować
  // Ale zachowaj guest flag i locale preference
  const PRESERVE = ['babylog_locale', 'babylog_guest']
  migratedKeys.forEach(k => {
    if (!PRESERVE.includes(k)) {
      try { localStorage.removeItem(k) } catch {}
    }
  })
}
