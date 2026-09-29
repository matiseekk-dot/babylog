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

// Uid zalogowanego użytkownika (ustawiany z App). Gdy hook dostaje inny uid —
// dane właściciela wspólnego konta — cache idzie pod osobny prefiks, żeby
// po rozłączeniu dane partnera nie zostały pod kluczami własnego konta.
let accountUid = null
export function setAccountUid(uid) { accountUid = uid || null }

// v2.16.1: powiadomienie o nowym wpisie (lista wpisów urosła po akcji usera).
// Listener dostaje (typ, { key, added }) — added to nowe wpisy (po id).
// Jedno miejsce zamiast wywołań w każdej zakładce — App podpina tu analytics
// "pierwszego wpisu". Snapshoty z Firestore (np. wpis partnera) nie przechodzą
// przez set(), więc nie są liczone. *_custom_ to definicje, *_timer_ to stan.
const ENTRY_LIST_KEY = /^(feed|sleep|diaper|temp|meds|growth|cough|symptoms|teething|milestones|vacc|diet)_(?!custom_|timer_)/
let entryAddedListener = null
export function setEntryAddedListener(fn) { entryAddedListener = fn }

function lsPrefix(uid) {
  if (!uid) return GUEST_PREFIX
  if (accountUid && uid !== accountUid) return `babylog_shared_${uid}_`
  return LS_PREFIX
}

/**
 * Load from localStorage — wybiera właściwy prefix zależnie od stanu zalogowania.
 */
function lsLoad(uid, key, fallback) {
  try {
    const v = localStorage.getItem(lsPrefix(uid) + key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function lsSave(uid, key, val) {
  try {
    localStorage.setItem(lsPrefix(uid) + key, JSON.stringify(val))
    if (uid) registerCacheKey(lsPrefix(uid) + key)
  } catch { /* quota exceeded — ignore */ }
}

// ─── Pamięć podręczna konta a zmiana konta (v2.16.9) ─────────────────────────
// Dane zalogowanego konta leżą pod wspólnym prefiksem babylog_, bez uid. Po
// wylogowaniu i zalogowaniu INNYM kontem na tym samym telefonie hooki czytały
// dane poprzedniego konta (dziecko, wpisy), a pierwszy zapis wysyłał je na nowe
// konto. Teraz: rejestr kluczy danych konta + właściciel pamięci podręcznej.
const CACHE_KEYS = 'babylog_cache_keys'
const CACHE_OWNER = 'babylog_cache_owner'
// Klucze sprzed rejestru (starsze wersje): wpisy i podstawowe dane konta.
// feed_reminder to ustawienie urządzenia, nie dane konta.
const LEGACY_ACCOUNT_KEY = /^babylog_(?!feed_reminder$)((feed|sleep|diaper|temp|meds|growth|cough|symptoms|teething|milestones|vacc|diet|doctor|reminder)_|profiles$|activeProfile$|onboarding_done$|linked_owner$|daily_summary$|premium_purchased$)/
let cacheKeys = null

function loadCacheKeys() {
  if (cacheKeys) return cacheKeys
  try { cacheKeys = new Set(JSON.parse(localStorage.getItem(CACHE_KEYS) || '[]')) } catch { cacheKeys = new Set() }
  return cacheKeys
}

function registerCacheKey(fullKey) {
  const keys = loadCacheKeys()
  if (keys.has(fullKey)) return
  keys.add(fullKey)
  try { localStorage.setItem(CACHE_KEYS, JSON.stringify([...keys])) } catch {}
}

/** Usuwa z localStorage dane konta (i wspólnego konta partnera). Dane gościa zostają. */
export function clearAccountCache() {
  const keys = loadCacheKeys()
  for (const k of lsKeys()) {
    if (keys.has(k) || k.startsWith('babylog_shared_') || LEGACY_ACCOUNT_KEY.test(k)) {
      try { localStorage.removeItem(k) } catch {}
    }
  }
  keys.clear()
  try { localStorage.removeItem(CACHE_KEYS) } catch {}
}

/**
 * Wołane przy zalogowaniu (zanim hooki odczytają dane). Pamięć podręczna innego
 * konta jest czyszczona. Właściciela zostawiamy przy wylogowaniu, więc nawet
 * dane zapisane jeszcze po wyczyszczeniu nie trafią do kolejnego konta.
 */
export function claimAccountCache(uid) {
  if (!uid) return
  try {
    const owner = localStorage.getItem(CACHE_OWNER)
    if (owner && owner !== uid) clearAccountCache()
    localStorage.setItem(CACHE_OWNER, uid)
  } catch {}
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
 *
 * v2.10.0: setDoc do Firestore jest debounce'owany (500ms). LocalStorage
 * pisze synchronicznie (instant feedback w UI), Firestore z opóźnieniem.
 * Powód: gdy user szybko zmienia coś (np. slider, wpisuje w input), bez
 * debounce każde naciśnięcie klawisza wywoływałoby setDoc → koszt billing
 * + niepotrzebny ruch sieciowy + ryzyko rate limit. Z debounce: ostatnia
 * wartość wygrywa, jeden zapis na sekwencję zmian.
 */
const FIRESTORE_DEBOUNCE_MS = 500

// v2.16.1: kilka instancji hooka z tym samym kluczem (np. App dla przycisku +
// i TodayTab) trzyma osobne stany. Zalogowanych synchronizował dopiero snapshot
// Firestore po debounce, a gościa nic — wpis z "+" nie pojawiał się na Dziś
// do zmiany zakładki. set() rozsyła teraz nową wartość do pozostałych instancji.
const siblingSetters = new Map()  // klucz localStorage → Set(setState)

export function useFirestore(uid, key, fallback) {
  const [state, setState] = useState(() => lsLoad(uid, key, fallback))
  const firstSnap = useRef(true)

  useEffect(() => {
    const lsKey = lsPrefix(uid) + key
    if (!siblingSetters.has(lsKey)) siblingSetters.set(lsKey, new Set())
    const setters = siblingSetters.get(lsKey)
    setters.add(setState)
    return () => {
      setters.delete(setState)
      if (setters.size === 0) siblingSetters.delete(lsKey)
    }
  }, [uid, key])
  const prevUid = useRef(uid)
  const prevKey = useRef(key)
  // v2.10.0: debounce timer + pending value dla setDoc
  const debounceTimer = useRef(null)
  const pendingValue = useRef(null)

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
    // LocalStorage zapisz natychmiast — instant feedback w UI
    lsSave(uid, key, next)
    setState(next)
    siblingSetters.get(lsPrefix(uid) + key)?.forEach(s => { if (s !== setState) s(next) })
    if (entryAddedListener && ENTRY_LIST_KEY.test(key)
        && Array.isArray(next) && Array.isArray(state) && next.length > state.length) {
      const prevIds = new Set(state.map(e => e?.id))
      const added = next.filter(e => e && !prevIds.has(e.id))
      entryAddedListener(key.slice(0, key.indexOf('_')), { key, added })
    }
    if (uid) {
      // v2.10.0: debounce setDoc. Jeśli user spamuje set(), ostatnia
      // wartość wygrywa po 500ms ciszy. To zmniejsza koszt Firestore
      // i obciążenie sieci dla szybkich zmian (np. slider, autocomplete).
      pendingValue.current = next
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => {
        const valueToWrite = pendingValue.current
        pendingValue.current = null
        debounceTimer.current = null
        setDoc(docRef(uid, key), { value: valueToWrite }).catch(e => {
          captureError(e, { context: 'firestore-write', key, uid })
        })
      }, FIRESTORE_DEBOUNCE_MS)
    }
  }

  // v2.10.0: cleanup pending writes przy unmount żeby uniknąć leaków
  // i write po unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        // Flush pending — najlepszy effort, write idzie w tle
        clearTimeout(debounceTimer.current)
        if (pendingValue.current !== null && uid) {
          setDoc(docRef(uid, key), { value: pendingValue.current }).catch(() => {})
        }
        debounceTimer.current = null
        pendingValue.current = null
      }
    }
  }, [uid, key])

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
