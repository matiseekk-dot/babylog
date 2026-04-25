import { useState, useEffect, useRef } from 'react'
import {
  doc, getDoc, setDoc, onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'
import { captureError, addBreadcrumb } from '../sentry'

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
 * Zwraca listę kluczy z localStorage.
 * Używamy iteracji .key(i) zamiast Object.keys() bo:
 *  - w przeglądarce lsKeys() działa (localStorage jest proxy)
 *  - w vitest/happy-dom/JSDOM — nie działa, bo localStorage to class instance
 *  - iteracja przez length + .key(i) działa wszędzie i jest standardem
 */
function lsKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k) keys.push(k)
  }
  return keys
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
        // Dokument nie istnieje w Firestore.
        //
        // KRYTYCZNE — NIE nadpisujemy lokalnego stanu pustą wartością!
        //
        // Powody:
        // 1. Race condition: chwilowy disconnect, permission cache, sync delay
        //    może spowodować że snap.exists() === false mimo że dane są.
        // 2. Pierwszy zapis: nowy klucz przed setDoc też trafia tutaj — wtedy
        //    nie chcemy nadpisać tego co user już wpisał lokalnie.
        // 3. Bezpieczeństwo: lepiej zostawić starsze dane lokalnie niż je stracić.
        //
        // Dane lokalne pozostają nietknięte. Następne setDoc je wyśle do Firestore.
        firstSnap.current = false
      }
    }, (error) => {
      // Błąd sieci lub permission denied — zostaw initial state
      captureError(error, { context: 'firestore-snapshot', key, uid })
    })

    return unsub
  }, [uid, key])

  const set = (val) => {
    const next = typeof val === 'function' ? val(state) : val
    lsSave(uid, key, next)
    setState(next)
    if (uid) {
      setDoc(docRef(uid, key), { value: next }).catch(e => {
        captureError(e, { context: 'firestore-write', key, uid })
      })
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

  // Sortujemy dla deterministyczności (ważne dla testów + logów)
  const guestKeys = lsKeys().filter(k => k.startsWith(GUEST_PREFIX)).sort()
  addBreadcrumb('migration', 'guest-to-account-started', { keyCount: guestKeys.length, strategy })

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
      captureError(e, { context: 'guest-migration', key, strategy })
    }
  }

  addBreadcrumb('migration', 'guest-to-account-finished', {
    migrated: result.migrated.length,
    skipped: result.skipped.length,
    errors: result.errors.length,
  })
  return result
}

/**
 * clearGuestData() — usuwa wszystkie dane guesta z localStorage.
 */
export function clearGuestData() {
  const keys = lsKeys().filter(k => k.startsWith(GUEST_PREFIX))
  keys.forEach(k => { try { localStorage.removeItem(k) } catch {} })
  return keys.length
}

/**
 * hasGuestData() — sprawdza czy są dane guesta.
 */
export function hasGuestData() {
  return lsKeys().some(k => k.startsWith(GUEST_PREFIX))
}

/**
 * @deprecated — stara funkcja powodowała Bug 3 (data loss).
 * Zachowana jako no-op dla kompatybilności importu.
 */
export async function migrateAllLocalData(_uid) {
  return { migrated: [], skipped: [], errors: [] }
}
