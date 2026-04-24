/**
 * dataExport.js
 *
 * Eksport wszystkich danych użytkownika.
 *
 * Motywacja:
 *  - GDPR art. 20 — prawo do przenoszenia danych.
 *  - Backup: user kupujący Lifetime 199 zł musi mieć możliwość zachowania
 *    danych niezależnie od losów apki i Anthropic/Firestore.
 *  - Migracja między urządzeniami: user zmienia telefon, chce przenieść dane.
 *
 * Źródła danych:
 *  - Firestore (gdy zalogowany): users/{uid}/data/{key}
 *  - localStorage (zawsze jako cache + guest mode): babylog_*  oraz  babylog_guest_*
 *
 * Formaty:
 *  - JSON — pełny backup, nadaje się do importu z powrotem. Jedno obiekt
 *    z wszystkimi kluczami, strukturą identyczną jak Firestore.
 *  - CSV (zip) — każda kategoria osobny plik, otwierane w Excelu. Nie pełny
 *    backup (brak customowych diet, milestones etc.), ale wygodne dla
 *    analizy dla pediatry / księgowego.
 */

import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { doc } from 'firebase/firestore'

const LS_PREFIX = 'babylog_'
const GUEST_PREFIX = 'babylog_guest_'

// ─── JSON Export ──────────────────────────────────────────────────────────

/**
 * Zbiera wszystkie dane user — zarówno z Firestore jak localStorage.
 * Zwraca obiekt: { [key]: value } gdzie key to nazwa klucza (bez prefiksu).
 */
export async function collectAllData(uid) {
  const data = {}

  // Firestore — tylko gdy zalogowany
  if (uid) {
    try {
      const colRef = collection(db, 'users', uid, 'data')
      const snap = await getDocs(colRef)
      snap.forEach(docSnap => {
        const docData = docSnap.data()
        data[docSnap.id] = docData.value !== undefined ? docData.value : docData
      })
    } catch (e) {
      console.warn('[dataExport] Firestore read failed, falling back to localStorage:', e)
    }
  }

  // localStorage — jako uzupełnienie (cache + ewentualne dane guesta)
  const prefix = uid ? LS_PREFIX : GUEST_PREFIX
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith(prefix)) {
      const key = k.slice(prefix.length)
      // Jeśli klucz już jest z Firestore, NIE nadpisuj (Firestore jest źródłem prawdy)
      if (data[key] === undefined) {
        try {
          data[key] = JSON.parse(localStorage.getItem(k))
        } catch {
          data[key] = localStorage.getItem(k)
        }
      }
    }
  })

  return data
}

/**
 * Eksportuje wszystkie dane jako pobrany plik JSON.
 *
 * Struktura wyjściowa:
 * {
 *   "exportVersion": "1.0",
 *   "exportDate": "2026-04-24T10:30:00.000Z",
 *   "appVersion": "2.5.5",
 *   "uid": "xyz...",  // null jeśli guest
 *   "data": { ...wszystkie klucze... }
 * }
 */
export async function exportAllDataAsJson(uid, appVersion = '2.5.5') {
  const data = await collectAllData(uid)
  const payload = {
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    appVersion,
    uid: uid || null,
    data,
  }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const fname = `spokojny-rodzic-backup-${new Date().toISOString().slice(0, 10)}.json`
  triggerDownload(blob, fname)
  return { success: true, recordCount: Object.keys(data).length }
}

// ─── CSV Export ───────────────────────────────────────────────────────────

/**
 * Konwertuje tablicę obiektów na CSV string.
 * Obsługuje automatyczne escapowanie wartości zawierających przecinki/cudzysłowy/newline.
 */
function arrayToCsv(rows, columns) {
  if (!rows || rows.length === 0) return ''
  const header = columns.join(',')
  const body = rows.map(row =>
    columns.map(col => {
      const v = row[col]
      if (v === null || v === undefined) return ''
      const s = String(v)
      // Escape jeśli zawiera przecinek, cudzysłów albo newline
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }).join(',')
  ).join('\n')
  // BOM jest dodawany raz w exportAllDataAsCsv (na początku całego pliku)
  return `${header}\n${body}`
}

/**
 * Definicje kolumn dla każdej kategorii danych.
 * Używane przy exporcie CSV.
 */
const CSV_COLUMNS = {
  feed:     ['date', 'time', 'type', 'side', 'duration', 'amount', 'note'],
  sleep:    ['date', 'time', 'type', 'duration', 'note'],
  diaper:   ['date', 'time', 'type', 'note'],
  temp:     ['date', 'time', 'temp', 'method', 'note'],
  meds:     ['date', 'time', 'med', 'form', 'dose', 'note'],
  growth:   ['date', 'weight', 'height', 'head'],
  symptoms: ['date', 'time', 'type', 'severity', 'note'],
  cough:    ['date', 'time', 'type', 'severity', 'note'],
  doctor_questions: ['id', 'question', 'status', 'date_added', 'answer', 'date_asked'],
  doctor_notes: ['date', 'title', 'content'],
}

/**
 * Eksportuje dane jako ZIP z wieloma CSV files (jeden per kategoria per dziecko).
 *
 * Bez zewnętrznych bibliotek ZIP — używamy prostego formatu "tar-like" ale
 * tak naprawdę generujemy jeden duży CSV z sekcjami (łatwiejsze niż zip
 * w przeglądarce bez lib).
 *
 * Alternatywnie: oddzielny CSV per kategoria, user pobiera kilka plików.
 * Ale to denerwujące dla usera → robimy "mega CSV" z sekcjami.
 */
export async function exportAllDataAsCsv(uid) {
  const data = await collectAllData(uid)
  const parts = []

  // Znajdź wszystkie babyIds — patrząc na klucze typu `feed_XXX`, `sleep_XXX`
  const babyIds = new Set()
  Object.keys(data).forEach(k => {
    const match = k.match(/^([a-z_]+)_(.+)$/)
    if (match && CSV_COLUMNS[match[1]]) {
      babyIds.add(match[2])
    }
  })

  // Profile info (wspólne, nie per dziecko)
  if (data.profiles) {
    parts.push('# PROFILE DZIECI')
    parts.push(arrayToCsv(data.profiles, ['id', 'name', 'months', 'weight', 'sex', 'avatar']))
    parts.push('')
  }

  // Każda kategoria × każde dziecko
  for (const babyId of babyIds) {
    const profile = data.profiles?.find(p => p.id === babyId)
    const babyName = profile?.name || babyId

    for (const category of Object.keys(CSV_COLUMNS)) {
      const key = `${category}_${babyId}`
      const entries = data[key]
      if (!Array.isArray(entries) || entries.length === 0) continue

      parts.push(`# ${category.toUpperCase()} — ${babyName}`)
      parts.push(arrayToCsv(entries, CSV_COLUMNS[category]))
      parts.push('')
    }
  }

  const csvContent = '\ufeff' + parts.join('\n')  // BOM UTF-8 na początku dla Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const fname = `spokojny-rodzic-dane-${new Date().toISOString().slice(0, 10)}.csv`
  triggerDownload(blob, fname)
  return { success: true, categoriesCount: parts.filter(p => p.startsWith('#')).length }
}

// ─── Utilities ────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Opóźnione revoke żeby nie brake download w wolnych przeglądarkach
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── JSON Import (przyszłość, nie wystawiamy jeszcze w UI) ────────────────
// Zostawione jako szkielet — ważne że dane JSON export są SIMMETRYCZNIE
// importowalne, nawet jeśli UI tego teraz nie używa.
//
// export async function importFromJson(uid, jsonString) {
//   const payload = JSON.parse(jsonString)
//   if (payload.exportVersion !== '1.0') throw new Error('Niezgodna wersja backupu')
//   for (const [key, value] of Object.entries(payload.data)) {
//     await setDoc(doc(db, 'users', uid, 'data', key), { value })
//   }
// }
