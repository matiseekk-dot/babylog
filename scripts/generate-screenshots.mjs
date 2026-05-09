// scripts/generate-screenshots.mjs
//
// Generates Google Play Store screenshots for PL, EN, DE, FR, ES locales.
// Run with:  node scripts/generate-screenshots.mjs
// Output:    store-assets/screenshots-2026-05/{pl,en,de,fr,es}/{01-today,02-temp,...}.png
//
// Resolution: 432×864 (matches app's max-width 430px + Play Store rules:
//   ratio max 2x, min dim 320px). Output PNGs are 24-bit (no alpha).
//
// PREREQUISITE: dev server running. Start it before running this script:
//   npm run dev   (in separate terminal)
//
// Then run:
//   node scripts/generate-screenshots.mjs            (default: all 5 locales)
//   node scripts/generate-screenshots.mjs de fr es   (subset)

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'store-assets', 'screenshots-2026-05')
const APP_URL = 'http://localhost:5173/babylog/'
const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

const VIEWPORT = { width: 432, height: 864 }

// Realistic data — same shape as in App.jsx Onboarding/Profiles flow
const PROFILE_ID = 'demo'

// User-content strings.
//
// IMPORTANT: feed.type, diaper.type, temp.method i podobne pola to INTERNAL
// ENUMY — w storage zawsze są polskie wartości ('Pierś lewa', 'Mokra', 'Pod pachą'),
// a UI tłumaczy je przez i18n (`t('feed.type.left')` etc.).
// Więc tutaj NIE tłumaczymy ich — tylko notes (free text) i labele snów.
//
// Patrz: src/components/FeedTab.jsx, src/components/DiaperTab.jsx — TYPES tablice.
//
// Inaczej app nie rozpoznaje wpisu jako karmienie/pieluchę i zlicza 0.
const ENUMS = { breastL: 'Pierś lewa', breastR: 'Pierś prawa', bottle: 'Butelka', wet: 'Mokra', dirty: 'Brudna', method: 'Pod pachą' }

const USER_STRINGS = {
  pl: { ...ENUMS, afterMed: 'Po Paracetamolu', morningNap: 'Drzemka poranna', afternoonNap: 'Drzemka popołudniowa' },
  en: { ...ENUMS, afterMed: 'After paracetamol', morningNap: 'Morning nap', afternoonNap: 'Afternoon nap' },
  de: { ...ENUMS, afterMed: 'Nach Paracetamol', morningNap: 'Vormittags-Nickerchen', afternoonNap: 'Nachmittags-Nickerchen' },
  fr: { ...ENUMS, afterMed: 'Après paracétamol', morningNap: 'Sieste du matin', afternoonNap: 'Sieste de l\'après-midi' },
  es: { ...ENUMS, afterMed: 'Tras paracetamol', morningNap: 'Siesta de la mañana', afternoonNap: 'Siesta de la tarde' },
}

// Child name per locale — "Zosia" mało rozpoznawalne dla DE/FR/ES, więc lokalizujemy
const CHILD_NAME = {
  pl: 'Zosia', en: 'Sophie', de: 'Anna', fr: 'Léa', es: 'Lucía',
}
const CHILD_AVATAR = {
  pl: '🌸', en: '🌸', de: '🐻', fr: '🦊', es: '🐱',
}

// dateYMD w lokalnej strefie — IDENTYCZNIE jak src/utils/helpers.js todayDate().
// Jeśli używamy ISO UTC tutaj, a app w lokalnej strefie, daty się rozjeżdżają
// w okolicach północy (CEST vs UTC = 2h różnicy) → wpisy nie zaliczają się
// jako "dzisiejsze" w stat counterach na ekranie HEUTE/Today.
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Each shot specifies what action to perform before screenshotting.
// `action` runs in browser context, before sleep + capture.
//
// Bottom-nav buttons have textContent like "Zdrowie1" (label + count badge).
// We use `.bottom-nav .nav-item` index by position instead of text matching:
//   index 0: today, 1: feed, 2: sleep, 3: health, 4: more
// (Order from NAV_TABS in App.jsx — stable across releases.)
const NAV_TODAY = 0
const NAV_FEED = 1
const NAV_SLEEP = 2
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

function clickByText(textPattern) {
  return async (page) => {
    await page.evaluate((src) => {
      const re = new RegExp(src)
      const btn = [...document.querySelectorAll('button')].find(b => re.test(b.textContent.trim()))
      btn?.click()
    }, textPattern)
  }
}

// Multi-locale text patterns — alternation covers PL/EN/DE/FR/ES
const SHOTS = [
  { name: '01-today', action: clickNav(NAV_TODAY) },
  { name: '02-temperature', action: async (page) => {
    await clickNav(NAV_HEALTH)(page)
    await sleep(800)
    // PL Temperatura · EN Temperature · DE Temperatur · FR Température · ES Temperatura
    await clickByText('^(Temperatura|Temperature|Temperatur|Température)$')(page)
  }},
  { name: '03-meds', action: async (page) => {
    await clickNav(NAV_HEALTH)(page)
    await sleep(800)
    // PL Leki · EN Medicine/Meds · DE Medikamente · FR Médicaments · ES Medicamentos
    await clickByText('^(Leki|Medicine|Meds|Medikamente|Médicaments|Medicamentos)$')(page)
  }},
  { name: '04-reference-library', action: async (page) => {
    await clickNav(NAV_MORE)(page)
    await sleep(800)
    // PL Wytyczne PTP/AAP · EN AAP/PTP guidelines · DE Pädiatrische Leitlinien
    // FR Recommandations pédiatriques · ES Recomendaciones pediátricas
    await clickByText('Wytyczne PTP/AAP|AAP/PTP guidelines|Pädiatrische Leitlinien|Recommandations pédiatriques|Recomendaciones pediátricas')(page)
  }},
  { name: '05-when-to-seek-help', action: async (page) => {
    await clickNav(NAV_MORE)(page)
    await sleep(800)
    // PL Kiedy szukać pomocy · EN When to seek help · DE Wann zum Arzt
    // FR Quand consulter · ES Cuándo consultar
    await clickByText('Kiedy szukać pomocy|When to seek help|Wann zum Arzt|Quand consulter|Cuándo consultar')(page)
  }},
  { name: '06-feed', action: clickNav(NAV_FEED) },
]

async function screenshotForLocale(browser, locale) {
  const localeDir = path.join(OUT_DIR, locale)
  fs.mkdirSync(localeDir, { recursive: true })

  const page = await browser.newPage()
  await page.setViewport({
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 2.5, // Up-render to ~1080×2160 for crisp Play Store quality
  })

  // Navigate first to set localStorage in app's origin
  // Longer timeout for first nav (Vite cold-start can be slow on Windows)
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

  // Inject realistic state
  const state = buildState(locale)
  await page.evaluate((stateData) => {
    Object.keys(localStorage).filter(k => k.startsWith('babylog')).forEach(k => localStorage.removeItem(k))
    Object.entries(stateData).forEach(([k, v]) => localStorage.setItem(k, v))
  }, state)

  // Reload so the app picks up state
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(2500)

  // DEBUG (only when DEBUG=1): dump localStorage state
  if (process.env.DEBUG) {
    const dump = await page.evaluate(() => {
      const out = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('babylog')) out[k] = localStorage.getItem(k)
      }
      return out
    })
    console.log(`  [debug ${locale}] localStorage:`, Object.keys(dump).length, 'babylog keys')
    Object.entries(dump).forEach(([k, v]) => console.log(`    ${k} → ${v.slice(0, 100)}${v.length > 100 ? '...' : ''}`))
  }

  // Dismiss onboarding tips banner if it's there
  // Multi-locale: PL "dziecka" · EN "Track your" · DE "Gesundheit" · FR "santé"
  // ES "salud" · all common in tips banner copy
  await page.evaluate(() => {
    const x = [...document.querySelectorAll('button')].find(b => (b.textContent.trim() === '×' || b.textContent.trim() === '✕') && /dziecka|Track your|Gesundheit|santé|salud/.test(b.parentElement?.textContent || ''))
    x?.click()
  })
  await sleep(400)

  for (const shot of SHOTS) {
    if (shot.action) {
      await shot.action(page)
      // Per-shot wait. Screen 02 (temperature) has recharts that needs ~2s
      // to mount + animate. Inne ekrany się ładują szybciej.
      const waitMs = shot.name.startsWith('02-') ? 3000 : 1500
      await sleep(waitMs)
    }
    const file = path.join(localeDir, `${shot.name}.png`)
    await page.screenshot({
      path: file,
      type: 'png',
      omitBackground: false,
      fullPage: false,
    })
    console.log(`  [${locale}] ${shot.name}.png  →  ${path.relative(ROOT, file)}`)
  }

  await page.close()
}

const ALL_LOCALES = ['pl', 'en', 'de', 'fr', 'es']

async function main() {
  // CLI args — `node generate-screenshots.mjs de fr` runs only DE+FR
  const arg = process.argv.slice(2).filter(a => ALL_LOCALES.includes(a))
  const locales = arg.length > 0 ? arg : ALL_LOCALES

  fs.mkdirSync(OUT_DIR, { recursive: true })
  console.log('Launching headless Chrome…')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    protocolTimeout: 120000,
  })

  for (const loc of locales) {
    console.log(`\nCapturing ${loc.toUpperCase()} screenshots…`)
    await screenshotForLocale(browser, loc)
  }

  await browser.close()
  console.log(`\n✅ Done. ${locales.length * SHOTS.length} screenshots → ${OUT_DIR}`)
}

main().catch(err => {
  console.error('FAILED:', err)
  process.exit(1)
})
