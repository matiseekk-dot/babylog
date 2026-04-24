/**
 * PDF Report Generator for Pediatrician Visits
 *
 * Generuje raport PDF z ostatnich N dni tracking'u dziecka — karmienia, sen,
 * pieluchy, temperatura, leki, objawy, kaszel, wzrost. Formatowane tabele
 * + statystyki podsumowujące, A4 z numeracją stron.
 *
 * Użycie:
 *   import { generatePdfReport } from '../utils/pdfReport'
 *   const blob = await generatePdfReport({ profile, startDate, endDate, data })
 *   // data = { feed: [...], sleep: [...], temp: [...], meds: [...], ... }
 *
 * Decyzje projektowe:
 * - jsPDF (bundle ~200KB) + jspdf-autotable (~30KB). Alternatywa (pdfmake)
 *   byłaby lżejsza ale ma gorsze wsparcie dla autoTable.
 * - Renderujemy client-side, nigdy nie wysyłamy danych na serwer. Zgodność
 *   z Twoim positioningiem "dane zostają u Ciebie".
 * - Brak polskich fontów w jsPDF core — używamy standardowych (Helvetica).
 *   Polskie znaki działają dzięki mapowaniu UTF-8 → latin-ext w jsPDF v4.
 * - PDF generowany leniwie (lazy import) — 230KB nie blokuje startu apki.
 */

import { t, getLocale } from '../i18n'

const A4_WIDTH = 210    // mm
const A4_HEIGHT = 297   // mm
const MARGIN = 12       // mm
const PAGE_INNER_WIDTH = A4_WIDTH - 2 * MARGIN

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDateLocale(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const locale = getLocale() === 'en' ? 'en-US' : 'pl-PL'
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatAgeMonths(months) {
  if (!months) return '—'
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${months} mies.`
  if (rem === 0) return `${years} lat`
  return `${years}r ${rem}m`
}

/** Filtruje wpisy po zakresie dat (inclusive) */
function inRange(entry, startDate, endDate, dateKey = 'date') {
  const d = entry[dateKey]
  if (!d) return false
  return d >= startDate && d <= endDate
}

/** Formatuje listę dat dla headeru raportu */
function formatPeriod(startDate, endDate) {
  return `${formatDateLocale(startDate)} – ${formatDateLocale(endDate)}`
}

// ─── Main PDF generator ─────────────────────────────────────────────────────

export async function generatePdfReport({ profile, startDate, endDate, data }) {
  // Lazy imports — nie ładuj jsPDF dopóki user faktycznie nie generuje PDF
  const { default: jsPDF } = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule.default || autoTableModule.autoTable

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // ─── HEADER: Tytuł + dziecko ────────────────────────────────────────────
  // Zwiększony top margin i font baseline dla lepszej czytelności
  let y = MARGIN + 4  // Extra 4mm top padding

  // Tytuł raportu
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text(t('pdf.title'), MARGIN, y + 6)  // font baseline = y + 6 (bo 18pt ≈ 6mm height)
  y += 12  // zwiększone z 8 — był zbyt ciasno

  // Subtitle
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text(
    t('pdf.subtitle', {
      startDate: formatDateLocale(startDate),
      endDate: formatDateLocale(endDate),
    }),
    MARGIN, y + 3
  )
  y += 10

  doc.setTextColor(0)

  // Info o dziecku — tabela 2 kolumny
  const childRows = [
    [t('pdf.child.name'), profile.name || '—'],
    [t('pdf.child.age'), formatAgeMonths(profile.months)],
    [t('pdf.child.weight'), profile.weight ? `${profile.weight} kg` : '—'],
    [t('pdf.child.sex'), profile.sex === 'M' ? t('pdf.child.sex.M') : profile.sex === 'F' ? t('pdf.child.sex.F') : '—'],
  ]
  autoTable(doc, {
    startY: y,
    body: childRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: [60, 60, 60] },
      1: { cellWidth: 'auto' },
    },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = doc.lastAutoTable.finalY + 6

  // Separator
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, A4_WIDTH - MARGIN, y)
  y += 6

  // ─── SUMMARY (statystyki) ───────────────────────────────────────────────
  y = addSectionTitle(doc, t('pdf.section.summary'), y)
  y = renderSummary(doc, y, data, startDate, endDate, autoTable)
  y += 4

  // ─── TEMPERATURA ────────────────────────────────────────────────────────
  const tempLogs = (data.temp || []).filter(l => inRange(l, startDate, endDate))
  if (tempLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.temperature'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.time'), t('pdf.header.value'), t('pdf.header.method'), t('pdf.header.note')]],
      body: tempLogs.map(l => [
        formatDateLocale(l.date),
        l.time || '',
        `${Number(l.temp).toFixed(1)}°C`,
        l.method || '',
        l.note || '',
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── KARMIENIA ──────────────────────────────────────────────────────────
  const feedLogs = (data.feed || []).filter(l => inRange(l, startDate, endDate))
  if (feedLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.feeding'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.time'), t('pdf.header.type'), t('pdf.header.value')]],
      body: feedLogs.map(l => {
        const isBreast = l.type?.startsWith('Pierś')
        const valueLabel = isBreast ? `${l.amount} min` : `${l.amount} ml`
        return [formatDateLocale(l.date), l.time || '', displayFeedType(l.type), valueLabel]
      }),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── SEN ────────────────────────────────────────────────────────────────
  const sleepLogs = (data.sleep || []).filter(l => inRange(l, startDate, endDate))
  if (sleepLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.sleep'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.type'), t('pdf.header.duration')]],
      body: sleepLogs.map(l => {
        const h = Math.floor((l.durationMin || 0) / 60)
        const m = (l.durationMin || 0) % 60
        return [formatDateLocale(l.date), l.label || '—', `${h}h ${m}m`]
      }),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── PIELUCHY ───────────────────────────────────────────────────────────
  const diaperLogs = (data.diaper || []).filter(l => inRange(l, startDate, endDate))
  if (diaperLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.diapers'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.time'), t('pdf.header.type'), t('pdf.header.note')]],
      body: diaperLogs.map(l => [formatDateLocale(l.date), l.time || '', l.type || '—', l.note || '']),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── LEKI ───────────────────────────────────────────────────────────────
  const medsLogs = (data.meds || []).filter(l => inRange(l, startDate, endDate))
  if (medsLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.meds'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.time'), t('pdf.header.medication'), t('pdf.header.dose'), t('pdf.header.form'), t('pdf.header.note')]],
      body: medsLogs.map(l => [
        formatDateLocale(l.date), l.time || '', l.med || '—', l.dose || '', displayMedFormPdf(l.form) || '', l.note || '',
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── OBJAWY ─────────────────────────────────────────────────────────────
  const symLogs = (data.symptoms || []).filter(l => inRange(l, startDate, endDate))
  if (symLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.symptoms'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.time'), t('pdf.header.type'), t('pdf.header.severity'), t('pdf.header.note')]],
      body: symLogs.map(l => [
        formatDateLocale(l.date),
        l.time || '',
        l.type === 'other' && l.customName ? l.customName : displaySymptomType(l.type),
        l.severity ? `${l.severity}/5` : '',
        l.note || '',
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── KASZEL ─────────────────────────────────────────────────────────────
  const coughLogs = (data.cough || []).filter(l => inRange(l, startDate, endDate))
  if (coughLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.cough'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.header.time'), t('pdf.header.type'), t('pdf.header.severity'), t('pdf.header.note')]],
      body: coughLogs.map(l => [
        formatDateLocale(l.date),
        l.time || '',
        displayCoughType(l.type),
        l.severity ? `${l.severity}/5` : '',
        l.note || '',
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── WZROST / WAGA ──────────────────────────────────────────────────────
  const growthLogs = (data.growth || []).filter(l => inRange(l, startDate, endDate))
  if (growthLogs.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.growth'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), t('pdf.child.weight'), 'Wzrost', 'Obwód głowy']],
      body: growthLogs.map(l => [
        formatDateLocale(l.date),
        l.weight ? `${l.weight} kg` : '—',
        l.height ? `${l.height} cm` : '—',
        l.headCirc ? `${l.headCirc} cm` : '—',
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── PYTANIA DO PEDIATRY ────────────────────────────────────────────────
  // Struktura pytania (z DoctorNotesTab.jsx):
  //   { id, question: 'tekst', date_added: '2026-04-24', status: 'pending' | 'answered',
  //     answer: '', date_asked: null }
  //
  // W raporcie pokazujemy WSZYSTKIE pytania 'pending' (jeszcze nie zadane),
  // plus pytania 'answered' z zakresu raportu (historycznie dla lekarza).
  const questions = (data.questions || []).filter(q => {
    if (q.status === 'pending') return true
    // Odpowiedziane pytania w zakresie raportu
    return q.date_added >= startDate && q.date_added <= endDate
  })
  if (questions.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.questions'), y)
    autoTable(doc, {
      startY: y,
      body: questions.map((q, i) => [
        `${i + 1}.`,
        q.question || q.text || '—',  // fallback do q.text dla zgodności
      ]),
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: MARGIN, right: MARGIN },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── NOTATKI Z WIZYT ────────────────────────────────────────────────────
  const notes = (data.doctorNotes || []).filter(n =>
    n.date >= startDate && n.date <= endDate
  )
  if (notes.length > 0) {
    y = ensurePageSpace(doc, y, 30)
    y = addSectionTitle(doc, t('pdf.section.visits'), y)
    autoTable(doc, {
      startY: y,
      head: [[t('pdf.header.date'), 'Diagnoza / zalecenia']],
      body: notes.map(n => [
        formatDateLocale(n.date),
        [n.diagnosis, n.recommendations, n.medications].filter(Boolean).join(' · '),
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── FOOTER (każda strona) ──────────────────────────────────────────────
  addFooters(doc)

  return doc
}

// ─── Helper functions ──────────────────────────────────────────────────────

function addSectionTitle(doc, title, y) {
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text(title, MARGIN, y + 4)
  doc.setFont(undefined, 'normal')
  return y + 6
}

function tableStyle() {
  return {
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [40, 40, 40] },
    headStyles: {
      fillColor: [30, 38, 24],  // ciemna zieleń brand
      textColor: [245, 240, 224],
      fontSize: 9, fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 250, 247] },
    margin: { left: MARGIN, right: MARGIN },
  }
}

/** Ensure that current y has room for X mm — else page break */
function ensurePageSpace(doc, y, requiredMm = 40) {
  if (y + requiredMm > A4_HEIGHT - MARGIN - 15) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function addFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const now = new Date()
  const locale = getLocale() === 'en' ? 'en-US' : 'pl-PL'
  const dtStr = now.toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    // Lewa: generated
    doc.text(t('pdf.footer.generated', { datetime: dtStr }), MARGIN, A4_HEIGHT - 8)
    // Środek: disclaimer
    doc.text(t('pdf.footer.disclaimer'), A4_WIDTH / 2, A4_HEIGHT - 8, { align: 'center' })
    // Prawa: page X/Y
    doc.text(`${i}/${pageCount}`, A4_WIDTH - MARGIN, A4_HEIGHT - 8, { align: 'right' })
  }
}

/** Summary section: liczby zagregowane za okres */
function renderSummary(doc, y, data, startDate, endDate, autoTable) {
  const feedLogs = (data.feed || []).filter(l => inRange(l, startDate, endDate))
  const sleepLogs = (data.sleep || []).filter(l => inRange(l, startDate, endDate))
  const diaperLogs = (data.diaper || []).filter(l => inRange(l, startDate, endDate))
  const tempLogs = (data.temp || []).filter(l => inRange(l, startDate, endDate))
  const medsLogs = (data.meds || []).filter(l => inRange(l, startDate, endDate))
  const symLogs = (data.symptoms || []).filter(l => inRange(l, startDate, endDate))
  const coughLogs = (data.cough || []).filter(l => inRange(l, startDate, endDate))

  const breastCount = feedLogs.filter(l => l.type?.startsWith('Pierś')).length
  const bottleCount = feedLogs.filter(l => l.type === 'Butelka' || l.type === 'Odciągnięte mleko').length
  const mlTotal = feedLogs
    .filter(l => l.type === 'Butelka' || l.type === 'Odciągnięte mleko')
    .reduce((s, l) => s + Number(l.amount || 0), 0)

  const sleepMinTotal = sleepLogs.reduce((s, l) => s + (l.durationMin || 0), 0)
  const daysDiff = Math.max(1, Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)
  const sleepAvgMin = Math.round(sleepMinTotal / daysDiff)

  const maxTemp = tempLogs.length ? Math.max(...tempLogs.map(l => Number(l.temp) || 0)) : null
  const feverDays = new Set(tempLogs.filter(l => Number(l.temp) >= 38).map(l => l.date)).size

  const symDays = new Set(symLogs.map(l => l.date)).size
  const coughDays = new Set(coughLogs.map(l => l.date)).size

  const fmtHours = (min) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}h ${m}m`
  }

  const rows = []
  if (feedLogs.length) {
    rows.push([t('pdf.stat.feeds'), String(feedLogs.length)])
    if (breastCount) rows.push([t('pdf.stat.feeds_breast'), String(breastCount)])
    if (bottleCount) rows.push([t('pdf.stat.feeds_bottle'), `${bottleCount} (${mlTotal} ${t('pdf.stat.ml_total')})`])
  }
  if (sleepLogs.length) {
    rows.push([t('pdf.stat.sleep_total'), fmtHours(sleepMinTotal)])
    rows.push([t('pdf.stat.sleep_avg'), fmtHours(sleepAvgMin)])
  }
  if (diaperLogs.length) {
    rows.push([t('pdf.stat.diapers'), String(diaperLogs.length)])
  }
  if (tempLogs.length && maxTemp) {
    rows.push([t('pdf.stat.temp_max'), `${maxTemp.toFixed(1)}°C`])
    if (feverDays > 0) rows.push([t('pdf.stat.temp_days'), String(feverDays)])
  }
  if (medsLogs.length) {
    rows.push([t('pdf.stat.meds_doses'), String(medsLogs.length)])
  }
  if (symDays > 0) rows.push([t('pdf.stat.symptom_days'), String(symDays)])
  if (coughDays > 0) rows.push([t('pdf.stat.cough_days'), String(coughDays)])

  if (rows.length === 0) {
    doc.setFontSize(9)
    doc.setTextColor(130)
    doc.text(t('pdf.empty'), MARGIN, y + 4)
    doc.setTextColor(0)
    return y + 6
  }

  autoTable(doc, {
    startY: y,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 70, textColor: [60, 60, 60] },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
    },
    margin: { left: MARGIN, right: MARGIN },
  })
  return doc.lastAutoTable.finalY + 2
}

/** Feed type display (używa i18n jeśli znane) */
function displayFeedType(type) {
  if (type === 'Pierś lewa') return t('feed.type.left')
  if (type === 'Pierś prawa') return t('feed.type.right')
  if (type === 'Butelka') return t('feed.type.bottle')
  if (type === 'Odciągnięte mleko') return t('feed.type.pumped')
  return type || '—'
}

function displaySymptomType(type) {
  if (type === 'vomit') return t('sym.type.vomit')
  if (type === 'diarrhea') return t('sym.type.diarrhea')
  if (type === 'rash') return t('sym.type.rash')
  if (type === 'runny_nose') return t('sym.type.runny_nose')
  if (type === 'other') return t('sym.type.other')
  return type || '—'
}

function displayCoughType(type) {
  if (type === 'dry') return t('cough.type.dry')
  if (type === 'wet') return t('cough.type.wet')
  if (type === 'wheezing') return t('cough.type.wheezing')
  if (type === 'barking') return t('cough.type.barking')
  return type || '—'
}

/** Display medication form (tablet, syrup, suppository, etc.) */
function displayMedFormPdf(formKey) {
  if (!formKey) return ''
  const labels = {
    tablet: t('meds.form.tablet'),
    syrup: t('meds.form.syrup'),
    suppository: t('meds.form.suppository'),
    drops: t('meds.form.drops'),
    spray: t('meds.form.spray'),
    suspension: t('meds.form.suspension'),
    injection: t('meds.form.injection'),
    other: t('meds.form.other'),
  }
  return labels[formKey] || ''
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Wysokopoziomowa funkcja — generuje PDF i zwraca blob
 * gotowy do pobrania lub share'owania.
 */
export async function buildAndDownloadPdf({ profile, startDate, endDate, data, filename }) {
  const doc = await generatePdfReport({ profile, startDate, endDate, data })
  const safeFilename = filename || `raport-${profile.name || 'dziecko'}-${startDate}-${endDate}.pdf`
  doc.save(safeFilename)
  return { filename: safeFilename }
}
