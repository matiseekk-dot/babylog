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
 * v2.11.3 — pełna lokalizacja PL+EN. Wcześniej wszystko było hardkodowane po
 * polsku, w tym tytuł "CALM PARENT — EKSPORT DANYCH" (mieszanka EN nazwy z PL
 * tekstem). Teraz nazwa apki + nagłówki + sekcje + kolumny + wartości
 * pochodzą z i18n.
 *
 * Użycie:
 *   import { exportAllToCsv } from '../utils/csvExport'
 *   exportAllToCsv(babyName, { feed, sleep, diaper, temp, meds, growth })
 */

import { todayDate, displayMethod, displayFeedType } from './helpers'
import { t } from '../i18n'

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
    displayFeedType(l.type),
    l.amount,
    l.type === 'Butelka' || l.type === 'Odciągnięte mleko' ? 'ml' : 'min',
  ])
  return sectionCsv(
    t('csv.section.feed'),
    [t('csv.col.date'), t('csv.col.time'), t('csv.col.type'), t('csv.col.amount'), t('csv.col.unit')],
    rows,
  )
}

/**
 * Konwertuje logi snu
 */
function sleepSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.label || '',
    l.durationMin,
    l.manual ? t('csv.value.manual') : t('csv.value.timer'),
  ])
  return sectionCsv(
    t('csv.section.sleep'),
    [t('csv.col.date'), t('csv.col.type'), t('csv.col.duration_min'), t('csv.col.source')],
    rows,
  )
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
  return sectionCsv(
    t('csv.section.diaper'),
    [t('csv.col.date'), t('csv.col.time'), t('csv.col.type'), t('csv.col.note')],
    rows,
  )
}

/**
 * Konwertuje logi temperatury
 */
function tempSection(logs = []) {
  const rows = logs.map(l => [
    l.date,
    l.time,
    Number(l.temp).toFixed(1),
    l.method ? displayMethod(l.method) : '',
    l.note || '',
  ])
  return sectionCsv(
    t('csv.section.temp'),
    [t('csv.col.date'), t('csv.col.time'), t('csv.col.temp_celsius'), t('csv.col.method'), t('csv.col.note')],
    rows,
  )
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
  return sectionCsv(
    t('csv.section.meds'),
    [t('csv.col.date'), t('csv.col.time'), t('csv.col.med'), t('csv.col.dose'), t('csv.col.note')],
    rows,
  )
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
  return sectionCsv(
    t('csv.section.growth'),
    [t('csv.col.date'), t('csv.col.weight_kg'), t('csv.col.height_cm'), t('csv.col.head_circ_cm')],
    rows,
  )
}

/**
 * Buduje CSV string z BOM (bez triggerowania downloadu).
 * Eksportowane dla testów + downstream consumers.
 */
export function buildCsv(babyName, data) {
  const { feed = [], sleep = [], diaper = [], temp = [], meds = [], growth = [] } = data

  const today = todayDate()
  const header = [
    `# ${t('app.title')} — ${t('csv.header.export')}`,
    `# ${t('csv.header.child')}: ${babyName}`,
    `# ${t('csv.header.export_date')}: ${today}`,
    `# ${t('csv.header.counts', { f: feed.length, s: sleep.length, d: diaper.length })}`,
    `# ${t('csv.header.counts2', { t: temp.length, m: meds.length, g: growth.length })}`,
    `# ${t('csv.header.gdpr')}`,
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

  // UTF-8 BOM (﻿) — Excel poprawnie otwiera polskie znaki
  return '﻿' + header + body
}

/**
 * GŁÓWNA funkcja — buduje CSV i triggeruje download.
 *
 * @param {string} babyName - imię dziecka (do nazwy pliku)
 * @param {object} data - { feed, sleep, diaper, temp, meds, growth }
 */
export function exportAllToCsv(babyName, data) {
  const csv = buildCsv(babyName, data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (babyName || 'child').replace(/[^a-zA-Z0-9_-]/g, '_')
  a.download = `babylog_${safeName}_${todayDate()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
