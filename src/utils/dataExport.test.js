/**
 * dataExport.test.js
 *
 * Testy eksportu danych — JSON i CSV.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Polyfill localStorage + document (bez wymogu happy-dom/jsdom) ─────────
// Prostszy niż instalowanie env; testujemy pure functions i mock DOM APIs.

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = (() => {
    let store = {}
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
      clear: () => { store = {} },
      get length() { return Object.keys(store).length },
      key: (i) => Object.keys(store)[i] || null,
      // For Object.keys()
      get _store() { return store },
    }
  })()

  // Patch Object.keys żeby działał na localStorage
  const origKeys = Object.keys
  Object.keys = function(obj) {
    if (obj === globalThis.localStorage) {
      return origKeys(obj._store)
    }
    return origKeys(obj)
  }
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: vi.fn((tag) => ({
      click: vi.fn(), href: '', download: '', style: {}, setAttribute: vi.fn(),
    })),
    body: { appendChild: vi.fn(), removeChild: vi.fn() },
  }
}

if (typeof globalThis.URL === 'undefined') globalThis.URL = {}
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalThis.URL.revokeObjectURL = vi.fn()

// Mock firebase/firestore PRZED importem
const mockGetDocs = vi.fn()
const mockCollection = vi.fn((db, ...path) => ({ path: path.join('/') }))
const mockDoc = vi.fn((db, ...path) => ({ path: path.join('/') }))

vi.mock('firebase/firestore', () => ({
  collection: (db, ...path) => mockCollection(db, ...path),
  getDocs: (...args) => mockGetDocs(...args),
  doc: (db, ...path) => mockDoc(db, ...path),
}))

vi.mock('../firebase', () => ({
  db: { _mock: true },
}))

// Mock URL.createObjectURL dla triggerDownload
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

import { collectAllData, exportAllDataAsJson, exportAllDataAsCsv } from './dataExport'

function resetLocalStorage() {
  localStorage.clear()
}

function mockFirestoreSnapshot(docs) {
  return {
    forEach(callback) {
      docs.forEach(d => callback({
        id: d.id,
        data: () => d.data,
      }))
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 1: collectAllData
// ═══════════════════════════════════════════════════════════════════════════

describe('collectAllData', () => {
  beforeEach(() => {
    resetLocalStorage()
    mockGetDocs.mockReset()
  })

  it('zwraca pusty obiekt gdy zero danych', async () => {
    mockGetDocs.mockResolvedValueOnce(mockFirestoreSnapshot([]))
    const data = await collectAllData('uid-A')
    expect(data).toEqual({})
  })

  it('zwraca dane z Firestore gdy zalogowany', async () => {
    mockGetDocs.mockResolvedValueOnce(mockFirestoreSnapshot([
      { id: 'profiles', data: { value: [{ id: 'p1', name: 'Laura' }] } },
      { id: 'feed_p1', data: { value: [{ time: '10:00' }] } },
    ]))

    const data = await collectAllData('uid-A')

    expect(data.profiles).toEqual([{ id: 'p1', name: 'Laura' }])
    expect(data.feed_p1).toEqual([{ time: '10:00' }])
  })

  it('zwraca dane z localStorage gdy guest (uid=null)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    localStorage.setItem('babylog_guest_temp_g1', JSON.stringify([{ temp: 37 }]))

    const data = await collectAllData(null)

    expect(data.profiles).toEqual([{ id: 'g1' }])
    expect(data.temp_g1).toEqual([{ temp: 37 }])
    // Firestore NIE był odpytany (guest = brak uid)
    expect(mockGetDocs).not.toHaveBeenCalled()
  })

  it('Firestore ma pierwszeństwo przed localStorage cache (gdy zalogowany)', async () => {
    // localStorage cache ma stare dane
    localStorage.setItem('babylog_profiles', JSON.stringify([{ id: 'old', name: 'Stare' }]))
    // Firestore ma świeże dane
    mockGetDocs.mockResolvedValueOnce(mockFirestoreSnapshot([
      { id: 'profiles', data: { value: [{ id: 'new', name: 'Świeże' }] } },
    ]))

    const data = await collectAllData('uid-A')

    expect(data.profiles).toEqual([{ id: 'new', name: 'Świeże' }])
  })

  it('gdy Firestore read failed, fallback do localStorage (offline mode)', async () => {
    localStorage.setItem('babylog_profiles', JSON.stringify([{ id: 'cache', name: 'Cache' }]))
    mockGetDocs.mockRejectedValueOnce(new Error('Network error'))

    const data = await collectAllData('uid-A')

    // Po errorze, dostaliśmy dane z localStorage
    expect(data.profiles).toEqual([{ id: 'cache', name: 'Cache' }])
  })

  it('corrupt JSON w localStorage jest zachowywany jako string (nie crash)', async () => {
    localStorage.setItem('babylog_guest_corrupted', 'NOT A VALID JSON {')

    const data = await collectAllData(null)

    // Zachowane jako raw string, nie crash
    expect(data.corrupted).toBe('NOT A VALID JSON {')
  })

  it('pomija klucze z innymi prefixami (nie-babylog)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    localStorage.setItem('otherApp_data', 'foo')
    localStorage.setItem('randomKey', 'bar')

    const data = await collectAllData(null)

    expect(data.profiles).toBeDefined()
    expect(data.otherApp_data).toBeUndefined()
    expect(data.randomKey).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 2: exportAllDataAsJson — format wyjściowy
// ═══════════════════════════════════════════════════════════════════════════

describe('exportAllDataAsJson', () => {
  let capturedBlob = null

  beforeEach(() => {
    resetLocalStorage()
    mockGetDocs.mockReset()
    capturedBlob = null

    // Intercept Blob constructor żeby złapać wynik
    const originalBlob = global.Blob
    global.Blob = class MockBlob extends originalBlob {
      constructor(parts, options) {
        super(parts, options)
        this._parts = parts
        this.text = () => Promise.resolve(parts.join(''))
        capturedBlob = this
      }
    }
  })

  it('zwraca success=true i recordCount gdy zero danych', async () => {
    mockGetDocs.mockResolvedValueOnce(mockFirestoreSnapshot([]))
    const result = await exportAllDataAsJson('uid-A', '2.5.5')

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(0)
  })

  it('format wyjściowy zawiera wymagane metadane', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1' }]))
    const result = await exportAllDataAsJson(null, '2.5.5')

    expect(result.success).toBe(true)

    const json = await capturedBlob.text()
    const parsed = JSON.parse(json)

    expect(parsed.exportVersion).toBe('1.0')
    expect(parsed.appVersion).toBe('2.5.5')
    expect(parsed.exportDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(parsed.uid).toBe(null)  // guest
    expect(parsed.data.profiles).toEqual([{ id: 'g1' }])
  })

  it('recordCount odzwierciedla liczbę kluczy w data', async () => {
    localStorage.setItem('babylog_guest_a', JSON.stringify([]))
    localStorage.setItem('babylog_guest_b', JSON.stringify([]))
    localStorage.setItem('babylog_guest_c', JSON.stringify([]))

    const result = await exportAllDataAsJson(null)
    expect(result.recordCount).toBe(3)
  })

  it('zawiera UID gdy zalogowany', async () => {
    mockGetDocs.mockResolvedValueOnce(mockFirestoreSnapshot([]))
    await exportAllDataAsJson('uid-Test-123', '2.5.5')

    const json = await capturedBlob.text()
    const parsed = JSON.parse(json)
    expect(parsed.uid).toBe('uid-Test-123')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Test suite 3: exportAllDataAsCsv — format CSV z sekcjami
// ═══════════════════════════════════════════════════════════════════════════

describe('exportAllDataAsCsv', () => {
  let capturedBlob = null

  beforeEach(() => {
    resetLocalStorage()
    mockGetDocs.mockReset()
    capturedBlob = null

    const originalBlob = global.Blob
    global.Blob = class MockBlob extends originalBlob {
      constructor(parts, options) {
        super(parts, options)
        this._parts = parts
        this.text = () => Promise.resolve(parts.join(''))
        capturedBlob = this
      }
    }
  })

  it('CSV zawiera BOM UTF-8 (dla polskich znaków w Excel)', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([
      { id: 'g1', name: 'Łukasz' },
    ]))
    localStorage.setItem('babylog_guest_feed_g1', JSON.stringify([
      { date: '2026-04-24', time: '10:00', type: 'Pierś lewa', note: 'śniadanie' },
    ]))

    await exportAllDataAsCsv(null)

    const csv = await capturedBlob.text()
    // BOM = \ufeff
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv).toContain('Łukasz')
    expect(csv).toContain('śniadanie')
  })

  it('CSV tworzy osobne sekcje per kategoria per dziecko', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([
      { id: 'g1', name: 'Laura' },
      { id: 'g2', name: 'Kuba' },
    ]))
    localStorage.setItem('babylog_guest_feed_g1', JSON.stringify([{ date: '2026-04-24', time: '10:00' }]))
    localStorage.setItem('babylog_guest_feed_g2', JSON.stringify([{ date: '2026-04-24', time: '11:00' }]))
    localStorage.setItem('babylog_guest_temp_g1', JSON.stringify([{ date: '2026-04-24', temp: 37 }]))

    const result = await exportAllDataAsCsv(null)

    const csv = await capturedBlob.text()
    expect(csv).toContain('# FEED — Laura')
    expect(csv).toContain('# FEED — Kuba')
    expect(csv).toContain('# TEMP — Laura')
    // Kuba nie ma temp, więc nie ma sekcji
    expect(csv).not.toContain('# TEMP — Kuba')
    // 4 sekcje łącznie (# PROFILE + FEED×2 + TEMP×1)
    expect(result.categoriesCount).toBeGreaterThanOrEqual(3)
  })

  it('escapuje wartości z przecinkami/cudzysłowami', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([
      { id: 'g1', name: 'Laura, Maria' },  // ma przecinek
    ]))
    localStorage.setItem('babylog_guest_feed_g1', JSON.stringify([
      { date: '2026-04-24', note: 'Powiedziała "tak"' },  // ma cudzysłów
    ]))

    await exportAllDataAsCsv(null)
    const csv = await capturedBlob.text()

    // Przecinek → wartość w cudzysłowach
    expect(csv).toContain('"Laura, Maria"')
    // Cudzysłów → podwojony + całość w cudzysłowach
    expect(csv).toContain('"Powiedziała ""tak"""')
  })

  it('pusty CSV gdy brak danych', async () => {
    const result = await exportAllDataAsCsv(null)
    expect(result.success).toBe(true)
    expect(result.categoriesCount).toBe(0)
  })

  it('zachowuje kolejność kolumn wg CSV_COLUMNS definition', async () => {
    localStorage.setItem('babylog_guest_profiles', JSON.stringify([{ id: 'g1', name: 'L' }]))
    localStorage.setItem('babylog_guest_meds_g1', JSON.stringify([{
      date: '2026-04-24', time: '10:00', med: 'Paracetamol', form: 'syrup', dose: '5ml', note: 'test',
    }]))

    await exportAllDataAsCsv(null)
    const csv = await capturedBlob.text()

    // Header dla meds wg definicji: date, time, med, form, dose, note
    expect(csv).toContain('date,time,med,form,dose,note')
  })
})
