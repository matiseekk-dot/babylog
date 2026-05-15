// generate-screenshots.template.mjs
//
// Reference implementation for the `generate-localized-screenshots` skill.
// Adapt this template to your specific project — search for "CUSTOMIZE:" comments.
//
// Usage:
//   1. Place this file at `scripts/generate-screenshots.mjs` in your project
//   2. Install deps:  npm i -D puppeteer-core sharp
//   3. Set CHROME_PATH env or edit the constant below
//   4. Start dev server in separate terminal: `npm run dev`
//   5. Run: `node scripts/generate-screenshots.mjs`
//   6. Output: `screenshots/{locale}/{name}.png` at 1080×2160

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'screenshots')

// CUSTOMIZE: Dev server URL (env override supported)
const APP_URL = process.env.APP_URL || 'http://localhost:5173/'

// CUSTOMIZE: Chrome binary path. Common locations:
//   Windows (x86):  C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
//   Windows (x64):  C:\Program Files\Google\Chrome\Application\chrome.exe
//   macOS:          /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
//   Linux:          /usr/bin/google-chrome
const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

// CUSTOMIZE: Viewport size. 432×864 × deviceScaleFactor 2.5 = 1080×2160 (Play Store sweet spot)
const VIEWPORT = { width: 432, height: 864, deviceScaleFactor: 2.5 }

// CUSTOMIZE: All locales your app supports
const ALL_LOCALES = ['en', 'de', 'fr', 'es']

// CUSTOMIZE: localStorage keys
const LOCALE_STORAGE_KEY = 'app_locale'    // Where current locale is stored
const STATE_PREFIX = 'app_'                 // Prefix for app state in localStorage

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL ENUMS — values that stay in original language in storage
//
// CRITICAL: Read the project carefully. Identify what's stored as enum vs
// what's user-content. App matching logic typically checks against the original
// (founder-language) value, not translated. Translating these in test data
// breaks the screenshots.
//
// Example for BabyLog (original origin in Polish):
//   const ENUMS = { breastL: 'Pierś lewa', wet: 'Mokra', method: 'Pod pachą' }
// ─────────────────────────────────────────────────────────────────────────────

const ENUMS = {
  // CUSTOMIZE: add your app's internal enum values here
  // example: type1: 'OriginalValue',
}

// ─────────────────────────────────────────────────────────────────────────────
// USER-CONTENT STRINGS — translate per locale (notes, labels, names)
// ─────────────────────────────────────────────────────────────────────────────

const USER_STRINGS = {
  en: { ...ENUMS, /* CUSTOMIZE */ note1: 'Sample note', name: 'Sophie' },
  de: { ...ENUMS, note1: 'Beispielnotiz', name: 'Anna' },
  fr: { ...ENUMS, note1: 'Exemple note', name: 'Léa' },
  es: { ...ENUMS, note1: 'Nota ejemplo', name: 'Lucía' },
}

// ─────────────────────────────────────────────────────────────────────────────
// localYMD — date string in local timezone (NOT UTC)
//
// CRITICAL: Apps typically filter "today's entries" by local date. Using
// toISOString().slice(0,10) gives UTC date — fails near midnight in non-UTC TZs.
// ─────────────────────────────────────────────────────────────────────────────

function localYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─────────────────────────────────────────────────────────────────────────────
// buildState — construct localStorage state for a given locale
// CUSTOMIZE: tailor to your app's storage schema
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_ID = 'demo'

function buildState(locale = 'en') {
  const today = localYMD(new Date())
  const yest = localYMD(new Date(Date.now() - 86400000))
  const u = USER_STRINGS[locale] || USER_STRINGS.en

  return {
    // Locale + onboarding flags
    [LOCALE_STORAGE_KEY]: locale,
    [`${STATE_PREFIX}consent_accepted`]: '1',
    [`${STATE_PREFIX}onboarding_done`]: 'true',

    // Profile
    [`${STATE_PREFIX}profile_${PROFILE_ID}`]: JSON.stringify({
      id: PROFILE_ID,
      name: u.name,
      // CUSTOMIZE: add other profile fields
    }),

    // CUSTOMIZE: seed data per category — at least 5 entries each for "real" feel
    // Example shapes:
    //
    // [`${STATE_PREFIX}entries_${PROFILE_ID}`]: JSON.stringify([
    //   { id: 'e1', date: today, time: '07:30', type: ENUMS.type1, value: '15' },
    //   { id: 'e2', date: today, time: '10:45', type: ENUMS.type1, value: '15' },
    //   { id: 'e3', date: today, time: '13:00', type: ENUMS.type2, value: '150' },
    // ]),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation actions
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// CUSTOMIZE: bottom-nav indices. More stable than text matching because text
// changes per locale.
const NAV = { HOME: 0, TAB1: 1, TAB2: 2, TAB3: 3, MORE: 4 }

function clickNav(idx) {
  return async (page) => {
    await page.evaluate((i) => {
      const btn = document.querySelectorAll('.bottom-nav .nav-item')[i]
      btn?.click()
    }, idx)
  }
}

// For finding buttons by text — use alternation for multi-locale support
function clickByText(textPattern) {
  return async (page) => {
    await page.evaluate((src) => {
      const re = new RegExp(src)
      const btn = [...document.querySelectorAll('button')].find(b => re.test(b.textContent.trim()))
      btn?.click()
    }, textPattern)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMIZE: List of screenshots to capture
// ─────────────────────────────────────────────────────────────────────────────

const SHOTS = [
  { name: '01-home', action: clickNav(NAV.HOME) },
  { name: '02-tab1', action: clickNav(NAV.TAB1) },
  // Multi-locale alternation for sub-tabs:
  { name: '03-subtab', action: async (page) => {
    await clickNav(NAV.TAB2)(page)
    await sleep(800)
    await clickByText('^(English label|Deutsch Label|Étiquette FR|Etiqueta ES)$')(page)
  }},
]

// ─────────────────────────────────────────────────────────────────────────────
// Main capture flow
// ─────────────────────────────────────────────────────────────────────────────

async function screenshotForLocale(browser, locale) {
  const localeDir = path.join(OUT_DIR, locale)
  fs.mkdirSync(localeDir, { recursive: true })

  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  // Navigate first to set the origin for localStorage
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

  // Inject state
  const state = buildState(locale)
  await page.evaluate((s, prefix) => {
    // Clean app keys (don't touch unrelated storage)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) localStorage.removeItem(k)
    }
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v))
  }, state, STATE_PREFIX)

  // Reload so app picks up the seeded state on init
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(2500)

  // CUSTOMIZE: dismiss any onboarding banner / toast / modal that appears
  // await page.evaluate(() => {
  //   const x = [...document.querySelectorAll('button')]
  //     .find(b => b.textContent.trim() === '×' || b.textContent.trim() === '✕')
  //   x?.click()
  // })
  // await sleep(400)

  for (const shot of SHOTS) {
    if (shot.action) {
      await shot.action(page)
      // Extra wait for charts (recharts, chart.js) to animate in:
      const waitMs = shot.name.includes('chart') ? 3000 : 1500
      await sleep(waitMs)
    }
    const file = path.join(localeDir, `${shot.name}.png`)
    await page.screenshot({ path: file, type: 'png', omitBackground: false, fullPage: false })
    console.log(`  [${locale}] ${shot.name}.png`)
  }

  await page.close()
}

async function main() {
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
