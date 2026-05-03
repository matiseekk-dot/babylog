// scripts/generate-screenshots.mjs
//
// Generates Google Play Store screenshots for both PL and EN locales.
// Run with:  node scripts/generate-screenshots.mjs
// Output:    store-assets/screenshots-2026-05/{pl,en}/{01-today,02-temp,...}.png
//
// Resolution: 432×864 (matches app's max-width 430px + Play Store rules:
//   ratio max 2x, min dim 320px). Output PNGs are 24-bit (no alpha).

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
function buildState(locale = 'pl') {
  const today = new Date().toISOString().slice(0, 10)
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  // v2.11.6: locale-aware notes — w PL "Po Paracetamolu", w EN "After paracetamol".
  // User notes są user content, nie tłumaczone przez i18n; ale dla screenshotów
  // marketing-quality ujednolicamy ze wzgędu na locale.
  const noteAfterMed = locale === 'en' ? 'After paracetamol' : 'Po Paracetamolu'
  const sleepLabelMorning = locale === 'en' ? 'Morning nap' : 'Drzemka poranna'
  const sleepLabelAfternoon = locale === 'en' ? 'Afternoon nap' : 'Drzemka popołudniowa'
  return {
    'babylog_medical_consent_v1': '1',
    'med_disclaimer_version': '1.0',
    'babylog_guest': '1',
    'babylog_locale': locale,
    'today_summary_dismissed': '1',
    'onboarding_tips_dismissed': '1',
    'babylog_guest_profiles': JSON.stringify([{
      id: PROFILE_ID, name: 'Zosia', months: 8, weight: 8.2, sex: 'F',
      avatar: '🌸', avatarColor: '#FFD6E8', toiletMode: 'diapers',
      visibleTabs: { feed: true, diaper: true },
    }]),
    'babylog_guest_activeProfile': JSON.stringify(PROFILE_ID),
    'babylog_guest_onboarding_done': JSON.stringify(true),
    'babylog_guest_trial_start': JSON.stringify(Date.now() - 3 * 86400000),
    [`babylog_guest_feed_${PROFILE_ID}`]: JSON.stringify([
      { id: 'f1', date: today, time: '07:30', type: 'Pierś lewa', amount: '15' },
      { id: 'f2', date: today, time: '10:45', type: 'Pierś prawa', amount: '15' },
      { id: 'f3', date: today, time: '13:00', type: 'Butelka', amount: '150' },
      { id: 'f4', date: today, time: '16:15', type: 'Pierś lewa', amount: '15' },
      { id: 'f5', date: today, time: '19:00', type: 'Pierś prawa', amount: '15' },
    ]),
    [`babylog_guest_sleep_${PROFILE_ID}`]: JSON.stringify([
      { id: 's1', date: today, label: sleepLabelMorning, durationMin: 75, manual: false, startTs: Date.now() - 8*3600000, endTs: Date.now() - 7*3600000 },
      { id: 's2', date: today, label: sleepLabelAfternoon, durationMin: 90, manual: false, startTs: Date.now() - 4*3600000, endTs: Date.now() - 2.5*3600000 },
    ]),
    [`babylog_guest_diaper_${PROFILE_ID}`]: JSON.stringify([
      { id: 'd1', date: today, time: '07:00', type: 'Mokra', note: '' },
      { id: 'd2', date: today, time: '10:30', type: 'Brudna', note: '' },
      { id: 'd3', date: today, time: '13:30', type: 'Mokra', note: '' },
      { id: 'd4', date: today, time: '17:00', type: 'Mokra', note: '' },
    ]),
    [`babylog_guest_temp_${PROFILE_ID}`]: JSON.stringify([
      { id: 't1', date: yest, time: '18:00', temp: 36.8, method: 'Pod pachą', note: '' },
      { id: 't2', date: today, time: '09:00', temp: 37.2, method: 'Pod pachą', note: '' },
      { id: 't3', date: today, time: '13:00', temp: 37.4, method: 'Pod pachą', note: '' },
      { id: 't4', date: today, time: '17:30', temp: 37.6, method: 'Pod pachą', note: noteAfterMed },
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

const SHOTS = [
  { name: '01-today', action: clickNav(NAV_TODAY) },
  { name: '02-temperature', action: async (page) => {
    await clickNav(NAV_HEALTH)(page)
    await sleep(800)
    await clickByText('^(Temperatura|Temperature)$')(page)
  }},
  { name: '03-meds', action: async (page) => {
    await clickNav(NAV_HEALTH)(page)
    await sleep(800)
    await clickByText('^(Leki|Medicine|Meds)$')(page)
  }},
  { name: '04-reference-library', action: async (page) => {
    await clickNav(NAV_MORE)(page)
    await sleep(800)
    await clickByText('Wytyczne PTP/AAP|AAP/PTP guidelines')(page)
  }},
  { name: '05-when-to-seek-help', action: async (page) => {
    await clickNav(NAV_MORE)(page)
    await sleep(800)
    await clickByText('Kiedy szukać pomocy|When to seek help')(page)
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
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })

  // Inject realistic state
  const state = buildState(locale)
  await page.evaluate((stateData) => {
    Object.keys(localStorage).filter(k => k.startsWith('babylog')).forEach(k => localStorage.removeItem(k))
    Object.entries(stateData).forEach(([k, v]) => localStorage.setItem(k, v))
  }, state)

  // Reload so the app picks up state
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(2500)

  // Dismiss onboarding tips banner if it's there
  await page.evaluate(() => {
    const x = [...document.querySelectorAll('button')].find(b => (b.textContent.trim() === '×' || b.textContent.trim() === '✕') && /dziecka|Track your/.test(b.parentElement?.textContent || ''))
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  console.log('Launching headless Chrome…')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--disable-web-security', '--no-sandbox'],
  })

  console.log('Capturing PL screenshots…')
  await screenshotForLocale(browser, 'pl')
  console.log('Capturing EN screenshots…')
  await screenshotForLocale(browser, 'en')

  await browser.close()
  console.log(`\nDone. Output: ${OUT_DIR}`)
}

main().catch(err => {
  console.error('FAILED:', err)
  process.exit(1)
})
