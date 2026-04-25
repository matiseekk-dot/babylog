/**
 * CSV Export — medyczna apka MUSI mieć eksport danych.
 *
 * Eksportuje wszystkie dane aktywnego dziecka do jednego pliku CSV
 * z sekcjami per typ danych (karmienie, sen, pieluchy, temp, leki, wzrost).
 *
 * Format:
 *   - Jeden plik .csv
 *   - UTF-8 BOM na początku (żeby Excel otworzył polskie znaki poprawnie)
 *   - Kolumny stabilne — można wczytać z powrotem / zaimportować do Excel/Sheets
 *   - Daty w formacie ISO (2026-04-21) żeby Excel nie robił auto-konwersji
 *
 * Użycie:
 *   import { exportAllToCsv } from '../utils/csvExport'
 *   exportAllToCsv(babyName, { feed, sleep, diaper, temp, meds, growth })
 */

import { todayDate } from './helpers'

/**
 * Ucieczka CSV — jeśli wartość zawiera przecinek, cudzysłów, nową linię:
 *   - opakuj w cudzysłowy
 *   - escape wewnętrzne cudzysłowy przez podwojenie
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r;]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toRow(values) {
  return values.map(escapeCsv).join(',')
}

/**
 * Buduje CSV z nagłówkiem sekcji
 */
function sectionCsv(title, headers, rows) {
  const lines = []
  lines.push(`# ${title}`)
  lines.push(toRow(headers))
  rows.forEach(row => lines.push(toRow(row)))
  lines.push('')  // pusta linia między sekcjami
  return lines.join('\n')
}

/**
 * Konwertuje logi karmienia
 */
function feedSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.time,
    l.type,
    l.amount,
    l.type === 'Butelka' || l.type === 'Odciągnięte mleko' ? 'ml' : 'min',
  ])
  return sectionCsv('KARMIENIE', ['data', 'godzina', 'typ', 'ilosc', 'jednostka'], rows)
}

/**
 * Konwertuje logi snu
 */
function sleepSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.label || '',
    l.durationMin,
    l.manual ? 'reczny' : 'stoper',
  ])
  return sectionCsv('SEN', ['data', 'typ', 'czas_minut', 'zrodlo'], rows)
}

/**
 * Konwertuje logi pieluch
 */
function diaperSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.time,
    l.type,
    l.note || '',
  ])
  return sectionCsv('PIELUCHY', ['data', 'godzina', 'typ', 'notatka'], rows)
}

/**
 * Konwertuje logi temperatury
 */
function tempSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.time,
    Number(l.temp).toFixed(1),
    l.method || '',
    l.note || '',
  ])
  return sectionCsv('TEMPERATURA', ['data', 'godzina', 'temp_celsius', 'metoda', 'notatka'], rows)
}

/**
 * Konwertuje logi leków
 */
function medsSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.time,
    l.med,
    l.dose || '',
    l.note || '',
  ])
  return sectionCsv('LEKI', ['data', 'godzina', 'lek', 'dawka', 'notatka'], rows)
}

/**
 * Konwertuje logi wzrostu
 */
function growthSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.weight || '',
    l.height || '',
    l.headCirc || '',
  ])
  return sectionCsv('WZROST', ['data', 'waga_kg', 'wzrost_cm', 'obwod_glowy_cm'], rows)
}

/**
 * GŁÓWNA funkcja — eksportuje wszystko do jednego CSV
 *
 * @param {string} babyName - imię dziecka (do nazwy pliku)
 * @param {object} data - { feed, sleep, diaper, temp, meds, growth }
 */
export function exportAllToCsv(babyName, data) {
  const { feed = [], sleep = [], diaper = [], temp = [], meds = [], growth = [] } = data

  const today = todayDate()
  const header = [
    `# CALM PARENT — EKSPORT DANYCH`,
    `# Dziecko: ${babyName}`,
    `# Data eksportu: ${today}`,
    `# Karmienia: ${feed.length}, Sen: ${sleep.length}, Pieluchy: ${diaper.length}`,
    `# Temperatura: ${temp.length}, Leki: ${meds.length}, Wzrost: ${growth.length}`,
    `# Dane zgodne z RODO — tylko historyczne wpisy użytkownika`,
    ``,
  ].join('\n')

  const body = [
    feedSection(feed),
    sleepSection(sleep),
    diaperSection(diaper),
    tempSection(temp),
    medsSection(meds),
    growthSection(growth),
  ].join('\n')

  // UTF-8 BOM żeby Excel pokazał polskie znaki poprawnie
  const BOM = '\uFEFF'
  const csv = BOM + header + body

  // Pobierz plik
  const safeName = babyName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'dziecko'
  const filename = `calm-parent-${safeName}-${today}.csv`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Szybki helper do zczytania wszystkich kluczy dla babyId z localStorage.
 * W apce zalogowanej dane są już w Firestore z sync do localStorage,
 * więc to działa w obu przypadkach.
 */
export function collectBabyData(babyId) {
  const read = (key) => {
    try {
      const v = localStorage.getItem('babylog_' + key + '_' + babyId)
      return v ? JSON.parse(v) : []
    } catch { return [] }
  }
  return {
    feed:   read('feed'),
    sleep:  read('sleep'),
    diaper: read('diaper'),
    temp:   read('temp'),
    meds:   read('meds'),
    growth: read('growth'),
  }
}
