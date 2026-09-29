// scripts/smoke-test.mjs
//
// Automatyczne przejście przez aplikację w 5 językach (tryb gościa z danymi
// przykładowymi z generate-screenshots-overlay.mjs). Na każdym ekranie:
// błędy konsoli i wyjątki, "undefined"/"NaN"/"[object Object]" w tekście,
// surowe klucze tłumaczeń, poziome wychodzenie poza ekran telefonu.
//
// Wymaga dev servera na 5173 (npm run dev).
// Run: node scripts/smoke-test.mjs [pl en de fr es]

import puppeteer from 'puppeteer-core'
import { CHROME_PATH, buildState } from './generate-screenshots-overlay.mjs'

// SMOKE_URL: np. wersja produkcyjna z 'npx vite preview' (http://localhost:4173/babylog/).
// Wtedy blokujemy statystyki i Sentry, żeby test nie liczył się jako prawdziwy użytkownik.
const APP_URL = process.env.SMOKE_URL || 'http://localhost:5173/babylog/'
const BLOCK = /google-analytics|analytics.google|googletagmanager|firebaseinstallations|sentry.io|ingest./
const sleep = ms => new Promise(r => setTimeout(r, ms))
const LANGS = ['pl', 'en', 'de', 'fr', 'es']
// Tytuł funkcji z listy Premium w danym języku (paywall.feature.pdf.title).
const PREMIUM_CHECK = { pl: 'Raport PDF dla pediatry', en: 'PDF report for your pediatrician', de: 'PDF-Bericht für den Kinderarzt', fr: 'Rapport PDF pour le pédiatre', es: 'Informe PDF para el pediatra' }
const SETTINGS_TITLES = ['Ustawienia', 'Settings', 'Einstellungen', 'Paramètres', 'Ajustes']
const IGNORE_CONSOLE = [
  /recaptcha|AppCheck|app-check/i,          // App Check w dev (brak klucza)
  /Firebase.*(offline|unavailable)/i,
  /Analytics not supported/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  // Tylko serwer deweloperski: Vite dokleja base do ścieżki manifestu
  // (/babylog/babylog/manifest.json); na produkcji ścieżka jest poprawna.
  /Manifest: Line: 1, column: 1/,
  // App Check w dev: tymczasowy token nie jest zarejestrowany (403).
  /status of 403/,
  // Z SMOKE_URL: skutek celowo zablokowanych statystyk (gtag, installations).
  ...(process.env.SMOKE_URL ? [/net::ERR_FAILED/, /TypeError: Failed to fetch/] : []),
]

async function inspect(page, locale, screen, issues) {
  const r = await page.evaluate(() => {
    const text = document.body.innerText
    const bad = []
    for (const w of ['undefined', 'NaN', '[object Object]']) if (text.includes(w)) bad.push(w)
    const keys = (text.match(/\b[a-z][a-z_]*\.[a-z_]+\.[a-z_.]+\b/g) || [])
      .filter(k => !/github\.io|gmail\.com|skudev\.pl|google\.com|\.html?$/.test(k))
    const over = document.documentElement.scrollWidth > window.innerWidth + 1
    return { bad, keys: [...new Set(keys)].slice(0, 5), over, len: text.length }
  })
  if (r.bad.length) issues.push(`${locale} ${screen}: w tekście ${r.bad.join(', ')}`)
  if (r.keys.length) issues.push(`${locale} ${screen}: surowe klucze ${r.keys.join(', ')}`)
  if (r.over) issues.push(`${locale} ${screen}: wychodzi poza ekran w poziomie`)
  if (r.len < 20) issues.push(`${locale} ${screen}: pusty ekran`)
}

async function clickNav(page, index) {
  await page.evaluate(i => document.querySelectorAll('.bottom-nav .nav-item')[i]?.click(), index)
  await sleep(700)
}

async function run(browser, locale, issues) {
  const page = await browser.newPage()
  await page.setViewport({ width: 432, height: 864, deviceScaleFactor: 1 })
  if (process.env.SMOKE_URL) {
    await page.setRequestInterception(true)
    page.on('request', r => (BLOCK.test(r.url()) ? r.abort() : r.continue()))
  }
  page.on('pageerror', e => issues.push(`${locale} WYJĄTEK: ${e.message.slice(0, 160)}`))
  page.on('console', m => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (IGNORE_CONSOLE.some(re => re.test(t))) return
    issues.push(`${locale} konsola: ${t.slice(0, 160)}`)
  })
  const state = {
    ...buildState(locale),
    babylog_medical_consent_v1: '1',
    babylog_locale: locale,
  }
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(s => { localStorage.clear(); Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)) }, state)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(4000)

  const names = ['Dziś', 'Karmienie', 'Sen', 'Zdrowie']
  for (let i = 0; i < 4; i++) {
    await clickNav(page, i)
    await inspect(page, locale, names[i], issues)
  }

  // Więcej: każda pozycja listy po kolei
  await clickNav(page, 4)
  const moreCount = await page.evaluate(() => {
    const main = document.querySelector('.app') || document.body
    return [...main.querySelectorAll('button')].filter(b => b.querySelector('svg') && b.style.minHeight === '56px').length
  })
  for (let i = 0; i < moreCount; i++) {
    await clickNav(page, 4)
    const label = await page.evaluate(i => {
      const btns = [...document.querySelectorAll('button')].filter(b => b.querySelector('svg') && b.style.minHeight === '56px')
      const b = btns[i]; const l = b?.textContent.trim(); b?.click(); return l
    }, i)
    await sleep(900)
    await inspect(page, locale, `Więcej/${label}`, issues)
  }
  if (moreCount < 5) issues.push(`${locale}: w "Więcej" znaleziono tylko ${moreCount} pozycji`)

  // Ustawienia
  await clickNav(page, 0)
  const opened = await page.evaluate(titles => {
    const b = [...document.querySelectorAll('button')].find(x => titles.includes(x.getAttribute('title')) || titles.includes(x.getAttribute('aria-label')))
    b?.click(); return !!b
  }, SETTINGS_TITLES)
  await sleep(900)
  if (!opened) issues.push(`${locale}: nie znaleziono przycisku Ustawień`)
  else await inspect(page, locale, 'Ustawienia', issues)
  await page.evaluate(() => window.__spokojnyBack?.())
  await sleep(600)

  // Premium (odznaka trialu w nagłówku)
  await page.evaluate(() => document.querySelector('.topbar button')?.click())
  await sleep(1200)
  await inspect(page, locale, 'Premium', issues)
  const premiumOk = await page.evaluate(k => document.body.innerText.includes(k), PREMIUM_CHECK[locale])
  if (!premiumOk) issues.push(`${locale}: ekran Premium nie jest w tym języku (brak: ${PREMIUM_CHECK[locale]})`)
  await page.evaluate(() => window.__spokojnyBack?.())
  await sleep(600)

  // Szybkie dodawanie: otwórz i dodaj pierwszy wpis (karmienie)
  const fabOk = await page.evaluate(() => {
    const fab = [...document.querySelectorAll('button')].find(b => getComputedStyle(b).position === 'fixed' && b.getAttribute('aria-label'))
    fab?.click(); return !!fab
  })
  await sleep(700)
  if (!fabOk) issues.push(`${locale}: brak przycisku szybkiego dodawania`)
  else {
    await inspect(page, locale, 'Szybkie dodawanie', issues)
    const before = await page.evaluate(() => (JSON.parse(localStorage.getItem('babylog_guest_feed_demo') || '[]')).length)
    await page.evaluate(() => {
      // Pierwszy kafelek w arkuszu szybkiego dodawania = pierś lewa.
      const sheet = document.querySelector('[role="dialog"]')
      const tile = [...(sheet?.querySelectorAll('button') || [])].find(b => b.textContent.includes('🤱'))
      tile?.click()
    })
    await sleep(1200)
    const after = await page.evaluate(() => (JSON.parse(localStorage.getItem('babylog_guest_feed_demo') || '[]')).length)
    if (!(after > before)) issues.push(`${locale}: szybkie dodanie karmienia nie dodało wpisu (${before} → ${after})`)
    await inspect(page, locale, 'Dziś po dodaniu', issues)
  }
  await page.close()
}

async function main() {
  const arg = process.argv.slice(2).filter(a => LANGS.includes(a))
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const issues = []
  for (const l of (arg.length ? arg : LANGS)) {
    const n = issues.length
    await run(browser, l, issues)
    console.log(`[${l}] ${issues.length - n ? issues.length - n + ' problemów' : 'OK'}`)
  }
  await browser.close()
  console.log(issues.length ? '\n' + [...new Set(issues)].join('\n') : '\nBez problemów.')
}

main().catch(e => { console.error('FAILED:', e); process.exit(1) })
