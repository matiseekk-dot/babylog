import { useState, useEffect, useRef } from 'react'
import {
  doc, getDoc, setDoc, onSnapshot, runTransaction
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

/** Odczyt pamięci podręcznej danego konta (ten sam przedrostek co hook). */
export function readCached(uid, key, fallback) {
  return lsLoad(uid, key, fallback)
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
    if (keys.has(k) || k.startsWith('babylog_shared_') || k.startsWith(PENDING_PREFIX) || LEGACY_ACCOUNT_KEY.test(k)) {
      try { localStorage.removeItem(k) } catch {}
    }
  }
  // Niewysłane zmiany poprzedniego konta nie mogą już pójść (inne logowanie).
  for (const p of pendingOps.values()) if (p.timer) clearTimeout(p.timer)
  pendingOps.clear()
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

// ─── Listy wpisów: scalanie zamiast nadpisywania (v2.16.13) ─────────────────
// Wcześniej każdy zapis wysyłał CAŁĄ listę. Na wspólnym koncie rodzic bez
// zasięgu po powrocie online nadpisywał wpisy drugiego rodzica (znikały bez
// śladu). Teraz dla list obiektów z `id` zapamiętujemy zmiany (dodane,
// zmienione, usunięte) i w transakcji nakładamy je na aktualną listę
// z serwera. Bez sieci zmiany czekają w localStorage i idą po powrocie
// połączenia. Zmiany są wspólne dla wszystkich instancji hooka z tym kluczem.
const PENDING_PREFIX = 'babylog_pending_ops_'
const pendingOps = new Map()  // klucz localStorage → { uid, key, upserts, removes, timer, flushing }

/** Lista obiektów z `id` (wpisy, profile) — scalana po id. */
export function isEntryList(v) {
  return Array.isArray(v) && v.every(e => e && typeof e === 'object' && e.id != null)
}

/**
 * Dopisuje do zebranych zmian różnicę między poprzednią a nową listą.
 * ops: { upserts: Map(id → wpis), removes: Set(id) }
 */
export function recordEntryOps(ops, prev, next) {
  const prevById = new Map((prev || []).map(e => [e.id, e]))
  const nextIds = new Set()
  for (const e of next) {
    nextIds.add(e.id)
    const old = prevById.get(e.id)
    if (!old || JSON.stringify(old) !== JSON.stringify(e)) {
      ops.upserts.set(e.id, e)
      ops.removes.delete(e.id)
    }
  }
  for (const id of prevById.keys()) {
    if (!nextIds.has(id)) { ops.removes.add(id); ops.upserts.delete(id) }
  }
}

/**
 * Nakłada zmiany na listę z serwera. order (lista lokalna) mówi, gdzie wstawić
 * nowe wpisy: tuż za najbliższym wcześniejszym sąsiadem, którego lista już ma,
 * a bez sąsiada na początek (listy są od najnowszego).
 */
export function applyEntryOps(server, ops, order) {
  const result = (server || [])
    .filter(e => !ops.removes.has(e?.id))
    .map(e => (ops.upserts.has(e.id) ? ops.upserts.get(e.id) : e))
  const present = new Set(result.map(e => e.id))
  const local = order || []
  local.forEach((e, i) => {
    if (!ops.upserts.has(e.id) || present.has(e.id)) return
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const k = result.findIndex(x => x.id === local[j].id)
      if (k >= 0) { at = k + 1; break }
    }
    result.splice(at, 0, ops.upserts.get(e.id))
    present.add(e.id)
  })
  for (const [id, entry] of ops.upserts) {
    if (!present.has(id)) { result.unshift(entry); present.add(id) }
  }
  return result
}

function hasOps(p) {
  return !!p && (p.upserts.size > 0 || p.removes.size > 0)
}

function getPending(lsKey, uid, key) {
  let p = pendingOps.get(lsKey)
  if (p && p.uid === uid) return p
  p = { uid, key, upserts: new Map(), removes: new Set(), timer: null, flushing: false }
  try {
    const saved = JSON.parse(localStorage.getItem(PENDING_PREFIX + lsKey) || 'null')
    if (saved && saved.uid === uid && saved.key === key) {
      saved.upserts.forEach(e => p.upserts.set(e.id, e))
      saved.removes.forEach(id => p.removes.add(id))
    }
  } catch {}
  pendingOps.set(lsKey, p)
  return p
}

function savePending(lsKey, p) {
  try {
    if (!hasOps(p)) localStorage.removeItem(PENDING_PREFIX + lsKey)
    else localStorage.setItem(PENDING_PREFIX + lsKey, JSON.stringify({
      uid: p.uid, key: p.key, upserts: [...p.upserts.values()], removes: [...p.removes],
    }))
  } catch { /* quota — zmiany zostają w pamięci */ }
}

function scheduleFlush(lsKey, delay = FIRESTORE_DEBOUNCE_MS) {
  const p = pendingOps.get(lsKey)
  if (!p) return
  if (p.timer) clearTimeout(p.timer)
  p.timer = setTimeout(() => { p.timer = null; flushEntryOps(lsKey) }, delay)
}

async function flushEntryOps(lsKey) {
  const p = pendingOps.get(lsKey)
  if (!hasOps(p) || p.flushing) return
  p.flushing = true
  // Kopia: zmiany dopisane w trakcie transakcji zostają na następny zapis.
  const ops = { upserts: new Map(p.upserts), removes: new Set(p.removes) }
  let order = []
  try { order = JSON.parse(localStorage.getItem(lsKey) || '[]') || [] } catch {}
  try {
    await runTransaction(db, async (tx) => {
      const ref = docRef(p.uid, p.key)
      const snap = await tx.get(ref)
      const value = snap.exists()
        ? applyEntryOps(snap.data().value || [], ops, order)
        // Pierwszy zapis tego klucza: cała lista lokalna.
        : order.filter(e => !ops.removes.has(e.id))
      tx.set(ref, { value })
    })
    for (const [id, e] of ops.upserts) if (p.upserts.get(id) === e) p.upserts.delete(id)
    for (const id of ops.removes) if (!p.upserts.has(id)) p.removes.delete(id)
    savePending(lsKey, p)
    p.flushing = false
    if (hasOps(p)) scheduleFlush(lsKey)
  } catch (e) {
    p.flushing = false
    // Brak sieci to normalny stan (noc, metro) — nie zaśmiecamy Sentry.
    if (e?.code !== 'unavailable' && e?.code !== 'failed-precondition') {
      captureError(e, { context: 'firestore-merge-write', key: p.key, uid: p.uid })
    }
    // Z siecią ponów szybko, bez sieci czekaj (zdarzenie 'online' i tak przyspieszy).
    const online = typeof navigator === 'undefined' || navigator.onLine !== false
    scheduleFlush(lsKey, online ? 3000 : 30000)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    for (const lsKey of pendingOps.keys()) scheduleFlush(lsKey, 1000)
  })
}

/**
 * Wysyła wszystkie czekające zmiany (np. przed wylogowaniem). Najwyżej
 * timeoutMs, żeby wylogowanie nie wisiało bez internetu.
 */
export async function flushAllEntryOps(timeoutMs = 4000) {
  const all = [...pendingOps.keys()].map(k => {
    const p = pendingOps.get(k)
    if (p?.timer) { clearTimeout(p.timer); p.timer = null }
    return flushEntryOps(k)
  })
  await Promise.race([Promise.allSettled(all), new Promise(r => setTimeout(r, timeoutMs))])
}

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

    // v2.16.13: zmiany list zapisane bez sieci (np. przed zamknięciem aplikacji)
    // czekają w localStorage — wyślij je, gdy hook znów działa.
    const lsKey = lsPrefix(uid) + key
    try {
      if (localStorage.getItem(PENDING_PREFIX + lsKey) && hasOps(getPending(lsKey, uid, key))) scheduleFlush(lsKey, 2000)
    } catch {}

    const unsub = onSnapshot(docRef(uid, key), snap => {
      if (snap.exists()) {
        let val = snap.data().value ?? fallback
        // Niewysłane jeszcze zmiany nakładamy na stan z serwera, żeby wpis
        // partnera nie "cofnął" na ekranie tego, co właśnie dodał ten rodzic.
        const p = pendingOps.get(lsKey)
        if (hasOps(p) && p.uid === uid && Array.isArray(val)) {
          val = applyEntryOps(val, p, lsLoad(uid, key, []))
        }
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
    if (uid && isEntryList(next) && (state == null || Array.isArray(state))) {
      // v2.16.13: lista wpisów — zapisujemy tylko zmiany i scalamy na serwerze.
      const lsKey = lsPrefix(uid) + key
      const p = getPending(lsKey, uid, key)
      recordEntryOps(p, Array.isArray(state) ? state : [], next)
      savePending(lsKey, p)
      if (hasOps(p)) scheduleFlush(lsKey)
      return
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
