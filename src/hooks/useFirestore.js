import { useState, useEffect, useRef } from 'react'
import {
  doc, getDoc, setDoc, onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'

// Offline persistence jest teraz skonfigurowana w firebase.js
export function enableOffline() { /* no-op, handled at init */ }

const LS_PREFIX = 'babylog_'
// Guest data ma własny prefix — NIGDY nie miesza się z kontem zalogowanym
const GUEST_PREFIX = 'babylog_guest_'

/**
 * Load from localStorage — wybiera właściwy prefix zależnie od stanu zalogowania.
 */
function lsLoad(uid, key, fallback) {
  try {
    const prefix = uid ? LS_PREFIX : GUEST_PREFIX
    const v = localStorage.getItem(prefix + key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function lsSave(uid, key, val) {
  try {
    const prefix = uid ? LS_PREFIX : GUEST_PREFIX
    localStorage.setItem(prefix + key, JSON.stringify(val))
  } catch { /* quota exceeded — ignore */ }
}

function docRef(uid, key) {
  return doc(db, 'users', uid, 'data', key)
}

/**
 * useFirestore(uid, key, fallback) — BEZPIECZNA WERSJA (fix Bug 3)
 */
export function useFirestore(uid, key, fallback) {
  const [state, setState] = useState(() => lsLoad(uid, key, fallback))
  const firstSnap = useRef(true)
  const prevUid = useRef(uid)
  const prevKey = useRef(key)

  useEffect(() => {
    // Tylko gdy uid/key się RZECZYWIŚCIE zmieniły, zresetuj stan z ls
    // (np. przełączenie konta lub dziecka).
    // Dla zwykłego re-mountu zostaw state jak był — inaczej flickering
    // gdy localStorage jest puste a Firestore ma dane.
    const uidChanged = prevUid.current !== uid
    const keyChanged = prevKey.current !== key
    if (uidChanged || keyChanged) {
      const lsData = lsLoad(uid, key, null)
      if (lsData !== null) {
        setState(lsData)
      } else {
        setState(fallback)
      }
      prevUid.current = uid
      prevKey.current = key
    }
    firstSnap.current = true

    if (!uid) return  // Guest — czytaj tylko localStorage

    const unsub = onSnapshot(docRef(uid, key), snap => {
      if (snap.exists()) {
        const val = snap.data().value ?? fallback
        lsSave(uid, key, val)
        setState(val)
        firstSnap.current = false
      } else {
        // Dokument nie istnieje w Firestore
        if (firstSnap.current) {
          // PIERWSZA próba odczytu — trzymaj initial state (z localStorage cache)
          // Jeśli cache też pusty, initial state = fallback (już ustawione)
          firstSnap.current = false
        } else {
          // Dokument skasowany po pierwszym snapshot — resetuj
          setState(fallback)
          lsSave(uid, key, fallback)
        }
      }
    }, () => { /* błąd sieci — zostaw initial state */ })

    return unsub
  }, [uid, key])

  const set = (val) => {
    const next = typeof val === 'function' ? val(state) : val
    lsSave(uid, key, next)
    setState(next)
    if (uid) {
      setDoc(docRef(uid, key), { value: next }).catch(() => {})
    }
  }

  return [state, set]
}

/**
 * migrateGuestDataToAccount(uid, { strategy })
 *
 * BEZPIECZNA migracja danych z trybu gościa do zalogowanego konta.
 * NIE jest wołana automatycznie — tylko przez explicit user action.
 *
 * Strategia 'preserve-existing' (default): jeśli Firestore ma już dane dla klucza,
 * NIE nadpisuje. Dane guesta zostają w localStorage jako backup.
 */
export async function migrateGuestDataToAccount(uid, { strategy = 'preserve-existing' } = {}) {
  const result = { migrated: [], skipped: [], errors: [] }
  if (!uid) return result

  const guestKeys = Object.keys(localStorage).filter(k => k.startsWith(GUEST_PREFIX))

  for (const fullKey of guestKeys) {
    const key = fullKey.slice(GUEST_PREFIX.length)
    try {
      const guestValue = JSON.parse(localStorage.getItem(fullKey))

      if (strategy === 'preserve-existing') {
        const existing = await getDoc(docRef(uid, key))
        if (existing.exists()) {
          result.skipped.push(key)
          continue
        }
      }

      await setDoc(docRef(uid, key), { value: guestValue })
      result.migrated.push(key)
    } catch (e) {
      result.errors.push({ key, error: e.message })
    }
  }
  return result
}

/**
 * clearGuestData() — usuwa wszystkie dane guesta z localStorage.
 */
export function clearGuestData() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(GUEST_PREFIX))
  keys.forEach(k => { try { localStorage.removeItem(k) } catch {} })
  return keys.length
}

/**
 * hasGuestData() — sprawdza czy są dane guesta.
 */
export function hasGuestData() {
  return Object.keys(localStorage).some(k => k.startsWith(GUEST_PREFIX))
}

/**
 * @deprecated — stara funkcja powodowała Bug 3 (data loss).
 * Zachowana jako no-op dla kompatybilności importu.
 */
export async function migrateAllLocalData(_uid) {
  return { migrated: [], skipped: [], errors: [] }
}
