/**
 * pdfExport.js
 * Eksport danych dziecka do PDF dla lekarza.
 */

import { todayDate, dateYMD } from './helpers'

async function loadJsPDF() {
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm')
  return jsPDF
}

function formatDate(s) {
  if (!s) return '-'
  const [y, m, d] = s.split('-')
  return `${d}.${m}.${y}`
}

function last7days() {
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(dateYMD(d))
  }
  return out
}

function sanitizeFilename(name) {
  return String(name || 'raport').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
}

/**
 * Generuje raport PDF dla lekarza.
 *
 * @param {object} profile - { id, name, months, weight, avatar }
 * @param {object} data - { tempLogs, medLogs, feedLogs, sleepLogs, doctorNotes }
 *                        (dane z Firestore lub localStorage, przekazane przez wywołującego)
 * @param {string} locale - 'pl' | 'en'
 */
export async function exportChildReport(profile, data, locale = 'pl') {
  const jsPDF = await loadJsPDF()
  const doc = new jsPDF()
  const L = locale === 'en' ? EN : PL

  const { tempLogs = [], medLogs = [], feedLogs = [], sleepLogs = [], doctorNotes = [] } = data || {}

  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text(L.title, 20, 20)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text(`${L.generated}: ${new Date().toLocaleString(locale === 'en' ? 'en-US' : 'pl-PL')}`, 20, 28)

  // Child info
  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text(L.childInfo, 20, 42)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  // jsPDF Helvetica nie ma polskich znaków — transliteruj (BUG-006)
  const safeName = transliterate(profile.name || '-', locale)
  doc.text(`${L.name}: ${safeName}`, 20, 52)
  doc.text(`${L.age}: ${profile.months} ${L.months}`, 20, 59)
  doc.text(`${L.weight}: ${profile.weight} kg`, 20, 66)

  let y = 80

  // Temperatura
  if (tempLogs.length) {
    doc.setFontSize(14); doc.setFont(undefined, 'bold')
    doc.text(L.temperature, 20, y); y += 8
    doc.setFontSize(10); doc.setFont(undefined, 'normal')

    const recent = [...tempLogs].sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time)).slice(0, 20)
    for (const l of recent) {
      if (y > 270) { doc.addPage(); y = 20 }
      const method = l.method ? ' (' + transliterate(l.method, locale) + ')' : ''
      const note = l.note ? ' — ' + transliterate(l.note, locale) : ''
      doc.text(`${formatDate(l.date)} ${l.time} — ${Number(l.temp).toFixed(1)}°C${method}${note}`, 20, y)
      y += 6
    }
    y += 6
  }

  // Leki
  if (medLogs.length) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(14); doc.setFont(undefined, 'bold')
    doc.text(L.medications, 20, y); y += 8
    doc.setFontSize(10); doc.setFont(undefined, 'normal')

    const recent = [...medLogs].sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time)).slice(0, 20)
    for (const l of recent) {
      if (y > 270) { doc.addPage(); y = 20 }
      const med = transliterate(l.med || '-', locale)
      const note = l.note ? ' — ' + transliterate(l.note, locale) : ''
      doc.text(`${formatDate(l.date)} ${l.time} — ${med}${l.dose ? ' '+l.dose : ''}${note}`, 20, y)
      y += 6
    }
    y += 6
  }

  // Karmienie — statystyki 7 dni
  if (feedLogs.length) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFontSize(14); doc.setFont(undefined, 'bold')
    doc.text(L.feeding, 20, y); y += 8
    doc.setFontSize(10); doc.setFont(undefined, 'normal')

    for (const date of last7days()) {
      if (y > 270) { doc.addPage(); y = 20 }
      const day = feedLogs.filter(l => l.date === date)
      const bottle = day.filter(l=>l.type==='Butelka'||l.type==='Odciągnięte mleko').reduce((s,l)=>s+Number(l.amount||0),0)
      const breast = day.filter(l=>l.type?.startsWith('Pierś')).length
      doc.text(`${formatDate(date)}: ${day.length} ${L.feeds}, ${breast}x ${L.breast}, ${bottle} ml ${L.bottle}`, 20, y)
      y += 6
    }
    y += 6
  }

  // Sen
  if (sleepLogs.length) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(14); doc.setFont(undefined, 'bold')
    doc.text(L.sleep, 20, y); y += 8
    doc.setFontSize(10); doc.setFont(undefined, 'normal')

    for (const date of last7days()) {
      if (y > 270) { doc.addPage(); y = 20 }
      const day = sleepLogs.filter(l => l.date === date)
      const total = day.reduce((s,l)=>s+(l.durationMin||0),0)
      const h = Math.floor(total/60), m = total%60
      doc.text(`${formatDate(date)}: ${h}h ${m}m (${day.length} ${L.sessions})`, 20, y)
      y += 6
    }
    y += 6
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setTextColor(150)
    doc.text(transliterate(L.disclaimer, locale), 20, 287, { maxWidth: 170 })
    doc.text(`${i}/${totalPages}`, 190, 287)
  }

  const filename = `${L.filename}_${sanitizeFilename(profile.name)}_${todayDate()}.pdf`
  doc.save(filename)
}

/**
 * Transliteracja polskich znaków na ASCII dla jsPDF default fontów.
 * jsPDF nie obsługuje UTF-8 z Helvetica — bez transliteracji byłyby krzaki (BUG-006).
 */
const TRANSLIT_MAP = {
  'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
  'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z',
}

// Common Polish data values → English equivalents (for EN PDF output)
const POLISH_TO_EN = {
  'Moje dziecko':      'My baby',
  'Pierś lewa':        'Left breast',
  'Pierś prawa':       'Right breast',
  'Butelka':           'Bottle',
  'Odciągnięte mleko': 'Pumped milk',
  'Mokra':             'Wet',
  'Brudna':            'Dirty',
  'Obydwie':           'Both',
  'Drzemka':           'Nap',
  'Sen nocny':         'Night sleep',
  'Odbytniczo':        'Rectal',
  'Pod pachą':         'Underarm',
  'W uchu':            'Ear',
  'Na czole':          'Forehead',
  'Sól fizjologiczna': 'Saline drops',
  'Probiotyk':         'Probiotic',
  'Pediatra':          'Pediatrician',
  'Pogotowie':         'Emergency',
  'Teleporada':        'Telehealth',
  'Specjalista':       'Specialist',
  'Kontrolna':         'Routine check-up',
}

function transliterate(str, locale) {
  const s = String(str)
  if (locale === 'en') {
    // First replace whole-word Polish values with English equivalents
    let result = s
    for (const [pl, en] of Object.entries(POLISH_TO_EN)) {
      result = result.split(pl).join(en)
    }
    return result
  }
  // For PL: transliterate Polish chars to ASCII (jsPDF font limitation)
  return s.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => TRANSLIT_MAP[ch] || ch)
}

const PL = {
  title: 'Raport zdrowia dziecka',
  generated: 'Wygenerowano',
  childInfo: 'Informacje o dziecku',
  name: 'Imie',
  age: 'Wiek',
  months: 'miesiecy',
  weight: 'Waga',
  temperature: 'Pomiary temperatury',
  medications: 'Podane leki',
  feeding: 'Karmienie (ostatnie 7 dni)',
  feeds: 'karmien',
  breast: 'piers',
  bottle: 'butelka',
  sleep: 'Sen (ostatnie 7 dni)',
  sessions: 'sesji',
  doctorNotes: 'Notatki z wizyt',
  diagnosis: 'Diagnoza',
  recommendations: 'Zalecenia',
  disclaimer: 'Dokument wygenerowany przez aplikacje Spokojny Rodzic. Nie zastepuje opinii lekarza.',
  filename: 'Raport',
}

const EN = {
  title: 'Child Health Report',
  generated: 'Generated',
  childInfo: 'Child Information',
  name: 'Name',
  age: 'Age',
  months: 'months',
  weight: 'Weight',
  temperature: 'Temperature Readings',
  medications: 'Medications Given',
  feeding: 'Feeding (last 7 days)',
  feeds: 'feeds',
  breast: 'breast',
  bottle: 'bottle',
  sleep: 'Sleep (last 7 days)',
  sessions: 'sessions',
  doctorNotes: 'Doctor Visits',
  diagnosis: 'Diagnosis',
  recommendations: 'Recommendations',
  disclaimer: 'Document generated by Calm Parent app. Not a substitute for medical advice.',
  filename: 'Report',
}
