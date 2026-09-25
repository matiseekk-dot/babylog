// scripts/generate-screenshots-overlay.mjs
//
// v2.14.0 — Nowe screenshoty Play Store z overlay text (hook + benefit).
// Warstwa nad `generate-screenshots.mjs` (który zostaje bez zmian jako "raw").
//
// Layout: 1080×2160 total (aspect 1:2, w limicie Play Store max 2:1):
//   [top banner terakota 260px]   ← hook (pytanie/problem)
//   [phone screenshot 1640px]     ← scaled+padded raw screen z puppeteer
//   [bottom banner terakota 260px] ← benefit (odpowiedź konkretna)
//
// Prerequisite: dev server na 5173. Uruchom `npm run dev` w drugim terminalu.
// Run: `node scripts/generate-screenshots-overlay.mjs [pl en de fr es]`
// Output: store-assets/screenshots-2026-09/{lang}/{01..07}-*.png

import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'store-assets', 'screenshots-2026-09')
const TMP_DIR = path.join(ROOT, 'store-assets', '.tmp-raw-screenshots')
const APP_URL = 'http://localhost:5173/babylog/'
const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

// Viewport: 432x864 * scale 2.5 = 1080x2160 raw
const VIEWPORT = { width: 432, height: 864 }

// Overlay layout (px, po scale — czyli 1080-wide canvas)
const CANVAS_W = 1080
const CANVAS_H = 2160
// v2.14.0 (UX iter): zmniejszenie bandów żeby apka dostała więcej miejsca.
// Wcześniej 260+260=520 (24%). Teraz 200+200=400 (18.5%), phone 1760 (81%).
const TOP_BAND = 200
const BOTTOM_BAND = 200
const PHONE_H = CANVAS_H - TOP_BAND - BOTTOM_BAND  // 1760
const PHONE_W = Math.round(PHONE_H * (VIEWPORT.width / VIEWPORT.height))  // 880
const PHONE_X = Math.round((CANVAS_W - PHONE_W) / 2)  // 100

// Brand terakota gradient (spójne z feature graphic)
const BRAND_TOP = '#B84E2E'
const BRAND_BOT = '#D77460'

// Teksty overlay — hook (górny) + benefit (dolny) — 6 shotów × 5 języków
// Uwaga: 07-vaccinations pominięte bo w wielu wersjach apki jest różnie.
const OVERLAYS = {
  '01-today': {
    pl: { hook: 'Wszystko w jednym miejscu',        benefit: 'Karmienie, sen, temperatura — dziś' },
    en: { hook: 'Everything in one place',          benefit: 'Feedings, sleep, temperature — today' },
    de: { hook: 'Alles an einem Ort',               benefit: 'Mahlzeiten, Schlaf, Temperatur — heute' },
    fr: { hook: 'Tout en un seul endroit',          benefit: "Biberons, sommeil, température — aujourd'hui" },
    es: { hook: 'Todo en un solo lugar',            benefit: 'Tomas, sueño, temperatura — hoy' },
  },
  '02-temperature': {
    pl: { hook: '37,6°C — rośnie czy spada?',       benefit: 'Wykres i trend na jednym ekranie' },
    en: { hook: '99.7°F — rising or falling?',      benefit: 'Chart and trend in one view' },
    de: { hook: '37,6°C — steigend oder fallend?',  benefit: 'Diagramm und Trend auf einem Bildschirm' },
    fr: { hook: '37,6°C — monte ou baisse ?',       benefit: 'Courbe et tendance sur un écran' },
    es: { hook: '37,6°C — ¿sube o baja?',           benefit: 'Gráfico y tendencia en una pantalla' },
  },
  '03-meds': {
    pl: { hook: 'Kiedy ostatnio Paracetamol?',      benefit: 'Historia leków z godziną i dawką' },
    en: { hook: 'When was the last dose?',          benefit: 'Medication history with time and dose' },
    de: { hook: 'Wann war die letzte Dosis?',       benefit: 'Medikamentenverlauf mit Zeit und Dosis' },
    fr: { hook: 'Dernière dose de paracétamol ?',   benefit: 'Historique des médicaments avec heure et dose' },
    es: { hook: '¿Cuándo fue la última dosis?',     benefit: 'Historial de medicamentos con hora y dosis' },
  },
  '04-reference-library': {
    pl: { hook: 'Wytyczne pediatryczne w apce',     benefit: 'Nie forum. Nie Google. Źródło PTP/AAP.' },
    en: { hook: 'Pediatric guidelines built-in',    benefit: 'Not forums. Not Google. Just AAP.' },
    de: { hook: 'Pädiatrische Leitlinien integriert', benefit: 'Kein Forum, kein Google — nur Fachquellen.' },
    fr: { hook: 'Recommandations pédiatriques',     benefit: 'Ni forum ni Google — sources officielles.' },
    es: { hook: 'Pautas pediátricas incluidas',     benefit: 'Ni foros ni Google — fuentes oficiales.' },
  },
  '05-when-to-seek-help': {
    pl: { hook: 'Kiedy zadzwonić do lekarza?',      benefit: 'Objawy alarmowe wg PTP/AAP i numer 112' },
    en: { hook: 'When to call the doctor?',         benefit: 'Warning signs per AAP + emergency number' },
    de: { hook: 'Wann zum Arzt gehen?',             benefit: 'Alarmzeichen laut Leitlinien + Notruf 112' },
    fr: { hook: "Quand appeler le médecin ?",       benefit: 'Signes d’alerte selon guides + numéro 112' },
    es: { hook: '¿Cuándo llamar al médico?',        benefit: 'Signos de alarma según guías + número 112' },
  },
  '06-feed': {
    pl: { hook: 'Karmienie w 2 sekundy',            benefit: 'Naprzemiennie pierś, ilość, godzina' },
    en: { hook: 'Log a feeding in 2 seconds',       benefit: 'Alternating breast, amount, time' },
    de: { hook: 'Mahlzeit in 2 Sekunden',           benefit: 'Wechselnde Brust, Menge, Uhrzeit' },
    fr: { hook: 'Un biberon en 2 secondes',         benefit: 'Sein alternant, quantité, heure' },
    es: { hook: 'Registra una toma en 2 seg',       benefit: 'Pecho alterno, cantidad, hora' },
  },
}

const SHOT_ORDER = ['01-today', '02-temperature', '03-meds', '04-reference-library', '05-when-to-seek-help', '06-feed']

// SVG dla top+bottom overlay bandow
function makeOverlaySvg(topText, bottomText) {
  // Auto-fit font size dopasowany do mniejszych bandów (200 vs 260).
  const topFont = topText.length > 26 ? 46 : 54
  const botFont = bottomText.length > 40 ? 32 : bottomText.length > 30 ? 38 : 42
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    <defs>
      <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BRAND_TOP}"/>
        <stop offset="100%" stop-color="${BRAND_BOT}"/>
      </linearGradient>
      <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BRAND_BOT}"/>
        <stop offset="100%" stop-color="${BRAND_TOP}"/>
      </linearGradient>
    </defs>
    <!-- TOP band -->
    <rect x="0" y="0" width="${CANVAS_W}" height="${TOP_BAND}" fill="url(#topGrad)"/>
    <text x="${CANVAS_W / 2}" y="${TOP_BAND / 2 + topFont / 3}"
          font-family="-apple-system, Segoe UI, Roboto, sans-serif"
          font-size="${topFont}" font-weight="800" fill="#fff"
          text-anchor="middle" letter-spacing="-1">
      ${escapeXml(topText)}
    </text>
    <!-- BOTTOM band -->
    <rect x="0" y="${CANVAS_H - BOTTOM_BAND}" width="${CANVAS_W}" height="${BOTTOM_BAND}" fill="url(#botGrad)"/>
    <text x="${CANVAS_W / 2}" y="${CANVAS_H - BOTTOM_BAND / 2 + botFont / 3}"
          font-family="-apple-system, Segoe UI, Roboto, sans-serif"
          font-size="${botFont}" font-weight="600" fill="#fff"
          text-anchor="middle" letter-spacing="-0.5">
      ${escapeXml(bottomText)}
    </text>
  </svg>`
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Dane demo (skopiowane z generate-screenshots.mjs — jedno źródło danych)
const PROFILE_ID = 'demo'
const ENUMS = { breastL: 'Pierś lewa', breastR: 'Pierś prawa', bottle: 'Butelka', wet: 'Mokra', dirty: 'Brudna', method: 'Pod pachą' }
const USER_STRINGS = {
  pl: { ...ENUMS, afterMed: 'Po Paracetamolu', morningNap: 'Drzemka poranna', afternoonNap: 'Drzemka popołudniowa' },
  en: { ...ENUMS, afterMed: 'After paracetamol', morningNap: 'Morning nap', afternoonNap: 'Afternoon nap' },
  de: { ...ENUMS, afterMed: 'Nach Paracetamol', morningNap: 'Vormittags-Nickerchen', afternoonNap: 'Nachmittags-Nickerchen' },
  fr: { ...ENUMS, afterMed: 'Après paracétamol', morningNap: 'Sieste du matin', afternoonNap: "Sieste de l'après-midi" },
  es: { ...ENUMS, afterMed: 'Tras paracetamol', morningNap: 'Siesta de la mañana', afternoonNap: 'Siesta de la tarde' },
}
const CHILD_NAME = { pl: 'Zosia', en: 'Sophie', de: 'Anna', fr: 'Léa', es: 'Lucía' }
const CHILD_AVATAR = { pl: '🌸', en: '🌸', de: '🐻', fr: '🦊', es: '🐱' }

function localYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildState(locale = 'pl') {
  const today = localYMD(new Date())
  const yest = localYMD(new Date(Date.now() - 86400000))
  const u = USER_STRINGS[locale] || USER_STRINGS.en
  const noteAfterMed = u.afterMed
  const sleepLabelMorning = u.morningNap
  const sleepLabelAfternoon = u.afternoonNap
  // v2.14.0 — identyczny state jak w scripts/generate-screenshots.mjs
  // (jedno źródło prawdy dla struktury zapisu w apce)
  return {
    'babylog_medical_consent_v1': '1',
    'med_disclaimer_version': '1.0',
    'babylog_guest': '1',
    'babylog_locale': locale,
    'today_summary_dismissed': '1',
    'onboarding_tips_dismissed': '1',
    'babylog_guest_profiles': JSON.stringify([{
      id: PROFILE_ID, name: CHILD_NAME[locale] || 'Zosia', months: 8, weight: 8.2, sex: 'F',
      avatar: CHILD_AVATAR[locale] || '🌸', avatarColor: '#FFD6E8', toiletMode: 'diapers',
      visibleTabs: { feed: true, diaper: true },
    }]),
    'babylog_guest_activeProfile': JSON.stringify(PROFILE_ID),
    'babylog_guest_onboarding_done': JSON.stringify(true),
    'babylog_guest_trial_start': JSON.stringify(Date.now() - 3 * 86400000),
    [`babylog_guest_feed_${PROFILE_ID}`]: JSON.stringify([
      { id: 'f1', date: today, time: '07:30', type: u.breastL, amount: '15' },
      { id: 'f2', date: today, time: '10:45', type: u.breastR, amount: '15' },
      { id: 'f3', date: today, time: '13:00', type: u.bottle, amount: '150' },
      { id: 'f4', date: today, time: '16:15', type: u.breastL, amount: '15' },
      { id: 'f5', date: today, time: '19:00', type: u.breastR, amount: '15' },
    ]),
    [`babylog_guest_sleep_${PROFILE_ID}`]: JSON.stringify([
      { id: 's1', date: today, label: sleepLabelMorning, durationMin: 75, manual: false, startTs: Date.now() - 8*3600000, endTs: Date.now() - 7*3600000 },
      { id: 's2', date: today, label: sleepLabelAfternoon, durationMin: 90, manual: false, startTs: Date.now() - 4*3600000, endTs: Date.now() - 2.5*3600000 },
    ]),
    [`babylog_guest_diaper_${PROFILE_ID}`]: JSON.stringify([
      { id: 'd1', date: today, time: '07:00', type: u.wet, note: '' },
      { id: 'd2', date: today, time: '10:30', type: u.dirty, note: '' },
      { id: 'd3', date: today, time: '13:30', type: u.wet, note: '' },
      { id: 'd4', date: today, time: '17:00', type: u.wet, note: '' },
    ]),
    [`babylog_guest_temp_${PROFILE_ID}`]: JSON.stringify([
      { id: 't1', date: yest, time: '18:00', temp: 36.8, method: u.method, note: '' },
      { id: 't2', date: today, time: '09:00', temp: 37.2, method: u.method, note: '' },
      { id: 't3', date: today, time: '13:00', temp: 37.4, method: u.method, note: '' },
      { id: 't4', date: today, time: '17:30', temp: 37.6, method: u.method, note: noteAfterMed },
    ]),
    [`babylog_guest_meds_${PROFILE_ID}`]: JSON.stringify([
      { id: 'm1', date: today, time: '14:00', med: 'Paracetamol', dose: '2.5 ml', note: '' },
    ]),
    [`babylog_guest_growth_${PROFILE_ID}`]: JSON.stringify([
      { id: 'g1', date: yest, weight: 8.2, height: 69, headCirc: 44 },
    ]),
  }
}

// ── Puppeteer helpers ─────────────────────────────────────────────────────────
// Index-based bottom-nav (stable across releases, patrz NAV_TABS w App.jsx):
//   0: today, 1: feed, 2: sleep, 3: health, 4: more
const NAV_TODAY = 0
const NAV_FEED = 1
const NAV_HEALTH = 3
const NAV_MORE = 4

function clickNav(idx) {
  return async (page) => {
    await page.evaluate((i) => {
      const btn = document.querySelectorAll('.bottom-nav .nav-item')[i]
      btn?.click()
    }, idx)
  }
}
function clickByText(pattern) {
  return async (page) => {
    await page.evaluate((pat) => {
      const rx = new RegExp(pat)
      // Szukamy w LEAF elementach (bez dzieci textowych innych niż tekst) —
      // inaczej div zawierający całe menu też match'uje i klikamy w niego,
      // co nie robi nic. Preferujemy najgłębszy element z tym tekstem.
      const candidates = [...document.querySelectorAll('button, a, [role="button"], [role="tab"], [role="menuitem"], li, div, span')]
        .filter(el => {
          const text = el.textContent?.trim() || ''
          if (!rx.test(text)) return false
          // Wykluczaj kontener który zawiera więcej niż jeden matching descendant
          const inner = [...el.querySelectorAll('*')].filter(d => rx.test(d.textContent?.trim() || ''))
          return inner.length === 0
        })
      // Weź pierwszego klikalnego przodka
      let el = candidates[0]
      while (el && !['BUTTON', 'A'].includes(el.tagName) && !el.getAttribute('role')?.match(/button|tab|menuitem/) && !el.onclick) {
        if (el.parentElement === document.body) break
        el = el.parentElement
      }
      el?.click()
    }, pattern)
  }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const SHOTS = [
  { name: '01-today', action: clickNav(NAV_TODAY) },
  { name: '02-temperature', action: async (page) => {
    await clickNav(NAV_HEALTH)(page); await sleep(800)
    await clickByText('^(Temperatura|Temperature|Temperatur|Température)$')(page)
  }},
  { name: '03-meds', action: async (page) => {
    await clickNav(NAV_HEALTH)(page); await sleep(800)
    await clickByText('^(Leki|Medicine|Meds|Medikamente|Médicaments|Medicamentos)$')(page)
  }},
  { name: '04-reference-library', action: async (page) => {
    await clickNav(NAV_MORE)(page); await sleep(800)
    await clickByText('Wytyczne PTP/AAP|AAP/PTP guidelines|Pädiatrische Leitlinien|Recommandations pédiatriques|Recomendaciones pediátricas')(page)
  }},
  { name: '05-when-to-seek-help', action: async (page) => {
    await clickNav(NAV_MORE)(page); await sleep(800)
    await clickByText('Kiedy szukać pomocy|When to seek help|Wann zum Arzt|Quand consulter|Cuándo consultar')(page)
  }},
  { name: '06-feed', action: clickNav(NAV_FEED) },
]

async function captureAndComposite(browser, locale) {
  const localeDir = path.join(OUT_DIR, locale)
  const tmpDir = path.join(TMP_DIR, locale)
  fs.mkdirSync(localeDir, { recursive: true })
  fs.mkdirSync(tmpDir, { recursive: true })

  const page = await browser.newPage()
  await page.setViewport({
    width: VIEWPORT.width, height: VIEWPORT.height,
    deviceScaleFactor: 2.5,
  })
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

  const state = buildState(locale)
  await page.evaluate((s) => {
    Object.keys(localStorage).filter(k => k.startsWith('babylog')).forEach(k => localStorage.removeItem(k))
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v))
  }, state)
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(2500)

  // Dismiss onboarding tips banner
  await page.evaluate(() => {
    const x = [...document.querySelectorAll('button')].find(b => (b.textContent.trim() === '×' || b.textContent.trim() === '✕') && /dziecka|Track your|Gesundheit|santé|salud/.test(b.parentElement?.textContent || ''))
    x?.click()
  })
  await sleep(400)

  for (const shot of SHOTS) {
    if (shot.action) {
      await shot.action(page)
      const waitMs = shot.name.startsWith('02-') ? 3000 : 1500
      await sleep(waitMs)
    }
    const tmpFile = path.join(tmpDir, `${shot.name}.png`)
    await page.screenshot({ path: tmpFile, type: 'png', fullPage: false })

    // Compose overlay via sharp
    const overlay = OVERLAYS[shot.name]?.[locale]
    if (!overlay) {
      console.warn(`  [${locale}] MISSING overlay for ${shot.name} — skipping composition`)
      continue
    }
    const finalFile = path.join(localeDir, `${shot.name}.png`)
    await composeShot(tmpFile, finalFile, overlay.hook, overlay.benefit)
    console.log(`  [${locale}] ${shot.name}.png  →  ${path.relative(ROOT, finalFile)}`)
  }

  await page.close()
}

// Raw screenshot (VIEWPORT × 2.5) → finalny PNG 1080×2160 z bandami tekstu.
// Używane też przez generate-screenshot-shared-account.mjs.
export async function composeShot(rawFile, finalFile, hook, benefit) {
  const phone = await sharp(rawFile).resize(PHONE_W, PHONE_H, { fit: 'contain', background: '#fff' }).png().toBuffer()
  const svg = Buffer.from(makeOverlaySvg(hook, benefit))
  await sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: '#F7F5F2' }
  })
    .composite([
      { input: phone, top: TOP_BAND, left: PHONE_X },
      { input: svg,   top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(finalFile)
}

export { VIEWPORT, OUT_DIR, TMP_DIR, CHROME_PATH, buildState }

const ALL_LOCALES = ['pl', 'en', 'de', 'fr', 'es']

async function main() {
  const arg = process.argv.slice(2).filter(a => ALL_LOCALES.includes(a))
  const locales = arg.length > 0 ? arg : ALL_LOCALES

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.mkdirSync(TMP_DIR, { recursive: true })
  console.log('Launching headless Chrome…')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--disable-web-security', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 120000,
  })

  for (const loc of locales) {
    console.log(`\nCapturing ${loc.toUpperCase()} screenshots…`)
    await captureAndComposite(browser, loc)
  }

  await browser.close()
  console.log(`\n✅ Done. ${locales.length * SHOTS.length} screenshots → ${OUT_DIR}`)
}

// Uruchamiaj main() tylko przy bezpośrednim wywołaniu, nie przy imporcie.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error('FAILED:', err); process.exit(1) })
}
