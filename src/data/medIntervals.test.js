/**
 * Sanity test dla interwałów leków.
 *
 * Sprawdza że trzy fizyczne kopie tej samej tablicy (canonical JSON,
 * Service Worker constants, Functions JSON) mają IDENTYCZNE wartości.
 *
 * Rozjazd między tymi plikami = aktywne ryzyko medyczne (FCM pushuje
 * pushki w innym czasie niż UI sugeruje, Service Worker ma swoją wersję).
 *
 * Jeśli ten test fail-uje:
 *   1. NIE deploy-uj
 *   2. Otwórz wszystkie trzy pliki:
 *      - src/data/medIntervals.json     (canonical)
 *      - public/medIntervals.constants.js
 *      - functions/medIntervals.json
 *   3. Zsynchronizuj ręcznie. Wartość może się zmieniać tylko na podstawie
 *      ChPL/SmPC, NIE na intuicji.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

describe('medIntervals — single source of truth consistency', () => {
  // Canonical
  const canonical = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'src/data/medIntervals.json'), 'utf-8')
  )

  it('canonical file ma poprawną strukturę', () => {
    expect(canonical).toHaveProperty('intervals')
    expect(typeof canonical.intervals).toBe('object')
    expect(canonical.intervals.paracetamol).toBe(360)
    expect(canonical.intervals.ibuprofen).toBe(480)
  })

  it('functions/medIntervals.json ma identyczne intervals jak canonical', () => {
    const fnJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'functions/medIntervals.json'), 'utf-8')
    )
    expect(fnJson.intervals).toEqual(canonical.intervals)
    expect(fnJson._version).toBe(canonical._version)
  })

  it('public/medIntervals.constants.js (SW) deklaruje identyczne wartości', () => {
    // Parsujemy plik manualnie — nie chcemy importScripts'ować.
    const swSrc = fs.readFileSync(
      path.join(repoRoot, 'public/medIntervals.constants.js'),
      'utf-8'
    )

    // Wyciągnij wartości każdego klucza z formy "klucz: liczba,"
    const keys = Object.keys(canonical.intervals)
    for (const key of keys) {
      const re = new RegExp(`${key}\\s*:\\s*(\\d+)`)
      const match = swSrc.match(re)
      expect(match, `klucz "${key}" nie znaleziony w SW constants`).not.toBeNull()
      const value = Number(match[1])
      expect(value, `SW constants[${key}] = ${value}, canonical = ${canonical.intervals[key]}`)
        .toBe(canonical.intervals[key])
    }
  })

  it('paracetamol i jego aliasy mają tę samą wartość', () => {
    expect(canonical.intervals.paracetamol)
      .toBe(canonical.intervals.panadol)
    expect(canonical.intervals.paracetamol)
      .toBe(canonical.intervals.apap)
  })

  it('ibuprofen i jego aliasy mają tę samą wartość', () => {
    expect(canonical.intervals.ibuprofen)
      .toBe(canonical.intervals.ibuprom)
    expect(canonical.intervals.ibuprofen)
      .toBe(canonical.intervals.nurofen)
  })

  it('paracetamol < ibuprofen (sanity check semantyki)', () => {
    // Paracetamol działa krócej niż ibuprofen — push o "minął odstęp"
    // przychodzi wcześniej dla paracetamolu.
    expect(canonical.intervals.paracetamol)
      .toBeLessThan(canonical.intervals.ibuprofen)
  })
})
