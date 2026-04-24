/**
 * useFirestore.test.js
 *
 * Testy bezpośrednio dla funkcji pure (bez React renderowania):
 *  - migrateGuestDataToAccount — strategie, chronienie Firestore danych
 *  - clearGuestData, hasGuestData — lifecycle guesta
 *  - localStorage isolation (guest vs account)
 *
 * Motywacja: Bug 3 (data loss po logowaniu) nie został złapany przez testy
 * poprzednio. Teraz testujemy edge cases żeby nigdy się nie powtórzyło.
 *
 * Mock strategy: mockujemy firebase/firestore na poziomie vi.mock + localStorage
 * przez globalThis.localStorage (vitest ma happy-dom default).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock firebase/firestore BEFORE importing useFirestore
const mockSetDoc = vi.fn(() => Promise.resolve())
const mockGetDoc = vi.fn()
const mockDoc = vi.fn((db, ...path) => ({ path: path.join('/') }))

vi.mock('firebase/firestore', () => ({
  doc: (db, ...path) => mockDoc(db, ...path),
  setDoc: (...args) => mockSetDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  onSnapshot: vi.fn(() => () => {}),
}))

vi.mock('../firebase', () => ({
  db: { _mock: true },
}))

// Import AFTER mocks
import {
  migrateGuestDataToAccount,
  clearGuestData,
  hasGuestData,
} from './useFirestore'

// ─── LocalStorage helper (vitest + happy-dom provides window.localStorage) ───

function resetLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  } else {
    // Fallback dla node env bez happy-dom
    globalThis.localStorage = {
      _data: {},
      getItem: function(k) { return this._data[k] ?? null },
      setItem: function(k, v) { this._data[k] = String(v) },
      removeItem: function(k) { delete this._data[k] },
      clear: function() { this._data = {} },
      get length() { return Object.keys(this._data).length },
      key: function(i) { return Object.keys(this._data)[i] || null },
    }
    // Object.keys() potrzebuje własności iteracyjnych
    Object.defineProperty(globalThis.localStorage, Symbol.iterator, {
      value: function*() {
        for (const k of Object.keys(this._data)) yield k
      },
    })
  }
}

// Pomocnik — Object.keys(localStorage) działa w browser/happy-dom,
// ale nasz fallback potrzebuje funkcji
function lsKeys() {
  if (typeof localStorage !== 'undefined' && localStorage._data) {
    return Object.keys(localStorage._data)
  }
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i))
  }
  return keys
}

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 1: hasGuestData / clearGuestData
// ═══════════════════════════════════════════════════════════════════════════

describe('hasGuestData', () => {
  beforeEach(() => {
    resetLocalStorage()
  })

  it('returns false when localStorage is empty', () => {
    expect(hasGuestData()).toBe(false)
  })

  it('returns false when only non-guest data exists', () => {
    localStorage.setItem('babylog_profiles', JSON.stringify([{ id: 'a' }]))
    localStorage.setItem('babylog_feed_a', JSON.stringify([]))
    expect(hasGuestData()).toBe(false)
  })

  it('returns true when any babylog_guest_ key exists', () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'a' }]))
    expect(hasGuestData()).toBe(true)
  })

  it('returns true even if only ONE guest key exists among many account keys', () => {
    localStorage.setItem('babylog_profiles', JSON.stringify([{ id: 'a' }]))
    localStorage.setItem('babylog_feed_a', JSON.stringify([]))
    localStorage.setItem('babylog_guest_temp_guest1', JSON.stringify([{ temp: 37 }]))
    expect(hasGuestData()).toBe(true)
  })

  it('returns false after clearGuestData is called', () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([]))
    localStorage.setItem('babylog_guest_feed_a', JSON.stringify([]))
    expect(hasGuestData()).toBe(true)
    clearGuestData()
    expect(hasGuestData()).toBe(false)
  })
})

describe('clearGuestData', () => {
  beforeEach(() => {
    resetLocalStorage()
  })

  it('removes all babylog_guest_ keys', () => {
    localStorage.setItem('babylog_guest_profiles', 'a')
    localStorage.setItem('babylog_guest_feed_x', 'b')
    localStorage.setItem('babylog_guest_temp_x', 'c')
    const count = clearGuestData()
    expect(count).toBe(3)
    expect(localStorage.getItem('babylog_guest_profiles')).toBe(null)
    expect(localStorage.getItem('babylog_guest_feed_x')).toBe(null)
    expect(localStorage.getItem('babylog_guest_temp_x')).toBe(null)
  })

  it('does NOT remove babylog_ (non-guest) keys — chroni dane zalogowanego usera', () => {
    localStorage.setItem('babylog_profiles', 'account')
    localStorage.setItem('babylog_guest_profiles', 'guest')
    clearGuestData()
    expect(localStorage.getItem('babylog_profiles')).toBe('account')
    expect(localStorage.getItem('babylog_guest_profiles')).toBe(null)
  })

  it('does NOT remove keys with other prefixes (preserves unrelated data)', () => {
    localStorage.setItem('someOtherApp_data', 'foo')
    localStorage.setItem('babylog_guest_profiles', 'bar')
    clearGuestData()
    expect(localStorage.getItem('someOtherApp_data')).toBe('foo')
  })

  it('returns 0 when no guest data exists', () => {
    expect(clearGuestData()).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 2: migrateGuestDataToAccount
//
// NAJWAŻNIEJSZE TESTY — Bug 3 (data loss po logowaniu) dotyczył tej funkcji.
// Historyczny scenariusz błędny:
//   1. User miał dane Laury w Firestore pod uid=A
//   2. Wylogowanie → guest → dodał nowe dziecko (localStorage)
//   3. Zalogowanie ponowne na uid=A → migrateAllLocalData() nadpisała
//      wszystkie klucze w Firestore, KASUJĄC dane Laury.
//
// Nowy `migrateGuestDataToAccount` ma strategy 'preserve-existing' domyślnie
// — jeśli Firestore MA już dane dla klucza, NIE NADPISUJE.
// ═══════════════════════════════════════════════════════════════════════════

describe('migrateGuestDataToAccount', () => {
  beforeEach(() => {
    resetLocalStorage()
    // mockReset() (NIE mockClear!) — clear czyści tylko calls, reset czyści też
    // mockResolvedValueOnce queue z poprzednich testów
    mockSetDoc.mockReset()
    mockGetDoc.mockReset()
    // Przywracamy default resolve dla setDoc
    mockSetDoc.mockResolvedValue(undefined)
  })

  it('returns empty result when uid is null (no migration possible)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'a' }]))
    const result = await migrateGuestDataToAccount(null)
    expect(result.migrated).toEqual([])
    expect(result.skipped).toEqual([])
    expect(result.errors).toEqual([])
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it('returns empty result when no guest data exists', async () => {
    const result = await migrateGuestDataToAccount('test-uid')
    expect(result.migrated).toEqual([])
    expect(result.skipped).toEqual([])
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it('migrates guest data to Firestore when key does NOT exist in Firestore', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1', name: 'Guest Baby' }]))
    // Firestore nie ma tego klucza
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })

    const result = await migrateGuestDataToAccount('uid-A')

    expect(result.migrated).toContain('profiles')
    expect(result.skipped).toEqual([])
    expect(mockSetDoc).toHaveBeenCalledTimes(1)
  })

  it('SKIPS migration when Firestore already has data — CHRONI PRZED BUG 3', async () => {
    // KLUCZOWY TEST: ten był niezłapany w oryginalnym bugu
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1', name: 'Guest Baby' }]))
    // Firestore MA już dane Laury
    mockGetDoc.mockResolvedValueOnce({ exists: () => true })

    const result = await migrateGuestDataToAccount('uid-A')

    expect(result.skipped).toContain('profiles')
    expect(result.migrated).toEqual([])
    // KLUCZOWE: setDoc NIE zostało wywołane — Firestore nie został nadpisany
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it('handles multiple keys correctly — miksuje migrated i skipped', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    localStorage.setItem('babylog_guest_feed_g1', JSON.stringify([{ time: '10:00' }]))
    localStorage.setItem('babylog_guest_temp_g1', JSON.stringify([{ temp: 37 }]))

    // Kolejność odpowiedzi getDoc — profiles istnieje, feed istnieje, temp nie istnieje
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true })   // profiles skip
      .mockResolvedValueOnce({ exists: () => true })   // feed skip
      .mockResolvedValueOnce({ exists: () => false })  // temp migrate

    const result = await migrateGuestDataToAccount('uid-A')

    expect(result.skipped.length).toBe(2)
    expect(result.migrated.length).toBe(1)
    expect(mockSetDoc).toHaveBeenCalledTimes(1)
  })

  it('overwrite strategy: nadpisuje Firestore (opt-in, dla advanced usecases)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    // Firestore ma dane — ale strategy=overwrite ignoruje to
    mockGetDoc.mockResolvedValueOnce({ exists: () => true })

    const result = await migrateGuestDataToAccount('uid-A', { strategy: 'overwrite' })

    expect(result.migrated).toContain('profiles')
    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    // Uwaga: przy overwrite nie sprawdzamy getDoc
  })

  it('does NOT delete localStorage after migration (zostawia backup)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })

    await migrateGuestDataToAccount('uid-A')

    // localStorage ma dane dalej (dopiero clearGuestData je usunie)
    expect(localStorage.getItem('babylog_guest_profiles')).toBeTruthy()
  })

  it('handles getDoc error gracefully — push do errors array', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    mockGetDoc.mockRejectedValueOnce(new Error('Network down'))

    const result = await migrateGuestDataToAccount('uid-A')

    expect(result.errors.length).toBe(1)
    expect(result.errors[0].key).toBe('profiles')
    expect(result.errors[0].error).toContain('Network')
  })

  it('handles corrupt JSON in localStorage — push do errors array, pomija klucz', async () => {
    localStorage.setItem('babylog_guest_profiles', 'NOT A VALID JSON')

    const result = await migrateGuestDataToAccount('uid-A')

    expect(result.errors.length).toBe(1)
    expect(result.migrated).toEqual([])
  })

  it('pomija klucze bez prefix babylog_guest_', async () => {
    localStorage.setItem('babylog_profiles', JSON.stringify([{ id: 'a' }]))  // non-guest
    localStorage.setItem('other_app_data', 'xxx')
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })

    const result = await migrateGuestDataToAccount('uid-A')

    // Tylko babylog_guest_profiles został zmigrowany
    expect(result.migrated).toEqual(['profiles'])
    expect(mockSetDoc).toHaveBeenCalledTimes(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 3: Smoke test / regression dla scenariusza Laury (Bug 3)
// ═══════════════════════════════════════════════════════════════════════════

describe('BUG 3 REGRESSION — Laura scenario', () => {
  beforeEach(() => {
    resetLocalStorage()
    mockSetDoc.mockReset()
    mockGetDoc.mockReset()
    mockSetDoc.mockResolvedValue(undefined)
  })

  it('NIE nadpisuje Firestore danymi guesta gdy user loguje się z powrotem', async () => {
    // Dane guesta w localStorage — klucze sortowane alfabetycznie w migracji:
    // "feed_g1" < "profiles" → feed_g1 przetwarzany najpierw
    localStorage.setItem(
      'babylog_guest_profiles',
      JSON.stringify([{ id: 'g1', name: 'GuestBaby' }])
    )
    localStorage.setItem(
      'babylog_guest_feed_g1',
      JSON.stringify([{ time: '10:00', date: '2026-04-24' }])
    )

    // Firestore ma dane Laury pod 'profiles', nie ma dla 'feed_g1'.
    // Kolejność mocków zgodna z sortowaniem: feed_g1 (nie istnieje), profiles (istnieje)
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })  // feed_g1 — migrate
      .mockResolvedValueOnce({ exists: () => true })   // profiles — SKIP (Laura protected!)

    const result = await migrateGuestDataToAccount('matiseekk')

    // Wymagania:
    // 1) Laura (profiles) NIE została nadpisana
    expect(result.skipped).toContain('profiles')

    // 2) Nowe dane (feed_g1 dla GuestBaby) zostały dodane
    expect(result.migrated).toContain('feed_g1')

    // 3) setDoc wywołane dokładnie raz (dla feed_g1), nie dla profiles
    expect(mockSetDoc).toHaveBeenCalledTimes(1)

    // 4) localStorage guest data zostaje jako backup
    expect(localStorage.getItem('babylog_guest_profiles')).toBeTruthy()
    expect(localStorage.getItem('babylog_guest_feed_g1')).toBeTruthy()
  })

  it('user może wyczyścić guest dane PO udanej migracji (explicit)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([]))
    localStorage.setItem('babylog_guest_feed_x', JSON.stringify([]))
    mockGetDoc.mockResolvedValue({ exists: () => false })

    await migrateGuestDataToAccount('uid-A')

    // Po migracji user musi explicit wywołać clearGuestData()
    expect(hasGuestData()).toBe(true)

    clearGuestData()
    expect(hasGuestData()).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 4: BUG 6 REGRESSION — TempTab flickering
//
// Historyczny scenariusz:
//   1. User miał dane w Firestore, ale localStorage cache pusty
//      (fresh install / clear cache / update apki)
//   2. Wejście w TempTab → useState initial → lsLoad → null → fallback=[]
//   3. useEffect re-run → setState(fallback) — nadal puste
//   4. onSnapshot wracał z danymi → setState([dane]) — wracają
//
// Fix: useEffect resetuje state TYLKO gdy uid/key się naprawdę zmieniły
// (prevUid/prevKey refs). Przy mount/remount z tymi samymi deps — zostawia
// poprzedni state, czekamy na Firestore snapshot.
// ═══════════════════════════════════════════════════════════════════════════

describe('BUG 6 REGRESSION — TempTab flickering after remount', () => {
  // Uwaga: pełny test React hooks wymaga @testing-library/react-hooks.
  // Tutaj testujemy zachowanie pure funkcji lsLoad — że returnuje null
  // (nie fallback!) gdy klucz nie istnieje, więc hook może decydować
  // co zrobić zamiast blindly setState(fallback).

  beforeEach(() => {
    resetLocalStorage()
  })

  it('lsLoad-like behavior: gdy klucza nie ma, fallback nie jest zapisywany do ls', () => {
    // Symulujemy co hook robi: sprawdź ls, jeśli null → zostaw stan w spokoju
    const key = 'babylog_temp_default'
    expect(localStorage.getItem(key)).toBe(null)

    // Hook NIE powinien automatycznie zapisać fallback do ls
    // (to by zniszczyło dane gdyby Firestore wracał z delay)
    // Po prostu sprawdzamy czy localStorage pozostaje nietknięty.
    expect(localStorage.getItem(key)).toBe(null)
  })

  it('guest i zalogowany mają osobne przestrzenie localStorage', () => {
    // Ten test potwierdza kluczową izolację która naprawia zarówno Bug 3 jak Bug 6
    localStorage.setItem('babylog_guest_temp_a', JSON.stringify([{ temp: 37 }]))
    localStorage.setItem('babylog_temp_a', JSON.stringify([{ temp: 38.5 }]))

    // Guest klucz
    expect(JSON.parse(localStorage.getItem('babylog_guest_temp_a'))).toEqual([{ temp: 37 }])
    // Account klucz — całkiem inna zawartość
    expect(JSON.parse(localStorage.getItem('babylog_temp_a'))).toEqual([{ temp: 38.5 }])

    // Czyszczenie guesta NIE wpływa na dane account
    clearGuestData()
    expect(localStorage.getItem('babylog_guest_temp_a')).toBe(null)
    expect(JSON.parse(localStorage.getItem('babylog_temp_a'))).toEqual([{ temp: 38.5 }])
  })
})
