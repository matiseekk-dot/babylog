// scripts/first-run-check.mjs
//
// Pierwsze uruchomienie oczami nowej osoby: formularz dziecka → pierwszy wpis
// (od v2.17.0 nowa instalacja startuje bez ekranu logowania; ekran logowania
// sprawdzamy osobno, z flagą babylog_login_wall). Na każdym kroku sprawdza, czy to, co trzeba kliknąć albo
// wypełnić, jest widoczne BEZ przewijania (nic nie chowa się pod przyciskiem
// na dole ani pod paskiem nawigacji). Zrzuty do FIRST_RUN_OUT (domyślnie
// store-assets/first-run, poza gitem).
//
// v2.16.23: Analytics pokazało, że 6 z 10 osób odpadało na formularzu dziecka:
// na telefonie 360 px data urodzenia chowała się pod szarym przyciskiem.
//
// Wymaga dev servera na 5173 (npm run dev). Run: node scripts/first-run-check.mjs

import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const APP_URL = process.env.SMOKE_URL || 'http://localhost:5173/babylog/'
const OUT = process.env.FIRST_RUN_OUT || 'store-assets/first-run'
const LANGS = (process.argv.slice(2).length ? process.argv.slice(2) : ['pl', 'en', 'de', 'fr', 'es'])
// Małe Androidy (360×640 po odjęciu pasków), typowy 360×740, duży 412×915.
const VIEWPORTS = [[360, 640], [360, 740], [412, 915]]
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Elementy, które nie mieszczą się w widocznym obszarze [top, bottom].
function hidden(page, selector, bottomLimitSelector) {
  return page.evaluate((sel, limitSel) => {
    const limitEl = limitSel && document.querySelector(limitSel)
    const bottom = limitEl ? limitEl.getBoundingClientRect().top : window.innerHeight
    return [...document.querySelectorAll(sel)]
      .filter(el => el.getBoundingClientRect().width > 0)
      .filter(el => { const r = el.getBoundingClientRect(); return r.top < 0 || r.bottom > bottom + 1 })
      .map(el => (el.id || el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40))
  }, selector, bottomLimitSelector)
}

async function run(browser, lang, [w, h], issues, wall = false) {
  const tag = `${lang} ${w}x${h}${wall ? ' (logowanie)' : ''}`
  const shot = name => page.screenshot({ path: path.join(OUT, `${lang}-${w}x${h}-${name}.png`) })
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  page.on('pageerror', e => issues.push(`${tag} WYJĄTEK: ${e.message.slice(0, 160)}`))
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate((l, wl) => {
    localStorage.clear(); sessionStorage.clear(); localStorage.setItem('babylog_locale', l)
    if (wl) localStorage.setItem('babylog_login_wall', '1')
  }, lang, wall)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2500)

  // 1. Logowanie (tylko z flagą): oba przyciski widoczne od razu.
  const direct = await page.evaluate(() => !!document.querySelector('#onb-name'))
  if (!wall && !direct) issues.push(`${tag}: nowa instalacja nie startuje od formularza`)
  if (wall) {
  const loginHidden = await hidden(page, '.app button')
  if (loginHidden.length) issues.push(`${tag} logowanie: poniżej ekranu ${loginHidden.join(' | ')}`)
  await shot('1-login')
  const guest = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.app button')].filter(x => !/google/i.test(x.textContent)).pop()
    b?.click(); return !!b
  })
  if (!guest) { issues.push(`${tag}: brak przycisku "bez konta"`); await page.close(); return }
  await sleep(1200)
  }

  // 2. Formularz: imię, data i przycisk na jednym ekranie (nad przyciskiem).
  const formHidden = await hidden(page, '#onb-name, #onb-dob', 'div[style*="sticky"]')
  if (formHidden.length) issues.push(`${tag} formularz: zasłonięte ${formHidden.join(' | ')}`)
  await shot('2-form')
  await page.evaluate(() => document.querySelector('div[style*="sticky"] button')?.click())
  await sleep(700)
  const alerts = await page.evaluate(() => document.querySelectorAll('[role=alert]').length)
  // v2.17.10: imię opcjonalne, komunikat tylko o dacie.
  if (alerts !== 1) issues.push(`${tag} formularz: po pustym "Zaczynamy" ${alerts} komunikatów zamiast 1`)
  const alertsHidden = await hidden(page, '[role=alert]', 'div[style*="sticky"]')
  if (alertsHidden.length) issues.push(`${tag} formularz: komunikat zasłonięty ${alertsHidden.join(' | ')}`)
  await shot('3-form-errors')
  // Imię opcjonalne: przy 360 px zostawiamy puste (profil dostaje domyślne imię).
  if (w !== 360) await page.type('#onb-name', 'Laura')
  await page.evaluate(() => {
    const el = document.querySelector('#onb-dob')
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    set.call(el, '2026-06-15')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.evaluate(() => document.querySelector('div[style*="sticky"] button')?.click())
  await sleep(1800)

  // 3. Dziś: kafelki "Co było przed chwilą?" nad paskiem nawigacji.
  const card = 'div[style*="border: 2px solid var(--brand-500)"] button'
  const tiles = await page.evaluate(sel => document.querySelectorAll(sel).length, card)
  if (!tiles) issues.push(`${tag} Dziś: brak karty pierwszego wpisu`)
  const tilesHidden = await hidden(page, card, '.bottom-nav')
  if (tilesHidden.length) issues.push(`${tag} Dziś: pod paskiem/poza ekranem ${tilesHidden.join(' | ')}`)
  const pname = await page.evaluate(() => JSON.parse(localStorage.getItem('babylog_guest_profiles') || '[]')[0]?.name || '')
  if (!pname || (w === 360 && pname === 'Laura')) issues.push(`${tag}: imię profilu "${pname}"`)
  await shot('4-today')

  // 4. Pierwszy wpis (pierwszy kafelek) i to, co wyskoczy potem.
  await page.evaluate(sel => document.querySelector(sel)?.click(), card)
  await sleep(1500)
  await shot('5-after-entry')
  const overlayHidden = await page.evaluate(() => {
    const fixed = [...document.querySelectorAll('body *')].filter(el => {
      const s = getComputedStyle(el); const r = el.getBoundingClientRect()
      return s.position === 'fixed' && r.width > 200 && r.height > 120 && s.visibility !== 'hidden'
    })
    const top = fixed.pop()
    if (!top) return []
    return [...top.querySelectorAll('button')]
      .filter(b => b.getBoundingClientRect().width > 0)
      .filter(b => { const r = b.getBoundingClientRect(); return r.bottom > window.innerHeight + 1 || r.top < 0 })
      .map(b => b.textContent.trim().slice(0, 40))
  })
  if (overlayHidden.length) issues.push(`${tag} po wpisie: przyciski okienka poza ekranem ${overlayHidden.join(' | ')}`)
  await page.close()
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' })
const issues = []
for (const lang of LANGS) {
  for (const vp of VIEWPORTS) await run(browser, lang, vp, issues)
  await run(browser, lang, VIEWPORTS[0], issues, true)
}
await browser.close()
console.log(issues.length ? issues.join('\n') : `OK: ${LANGS.length} języki × ${VIEWPORTS.length} ekrany, wszystko widoczne bez przewijania`)
