// scripts/generate-screenshot-shared-account.mjs
//
// v2.15.0 — screenshot Play Store "Wspólne konto" (07-shared-account.png).
// Sekcja wymaga zalogowanego konta Premium z partnerem, więc apka działa na
// emulatorach Firebase zamiast produkcji (patrz scripts/screenshots/).
//
// Prerequisites (dwa terminale):
//   1. Emulatory (wymaga firebase-tools i Javy 11+):
//        cd scripts/screenshots && firebase emulators:start \
//          --config firebase.emulators.json --project babylog-3c1cc --only auth,firestore
//   2. Vite na emulatorach:
//        npx vite --config scripts/screenshots/vite.emulators.config.mjs   (port 5174)
// Run: `node scripts/generate-screenshot-shared-account.mjs [pl en de fr es]`
// Output: store-assets/screenshots-2026-09/{lang}/07-shared-account.png

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import {
  composeShot, buildState, VIEWPORT, OUT_DIR, TMP_DIR, CHROME_PATH,
} from './generate-screenshots-overlay.mjs'

const APP_URL = 'http://localhost:5174/babylog/'
const SHOT = '07-shared-account'

const OVERLAY = {
  pl: { hook: 'Jedno Premium dla obojga rodziców', benefit: 'Te same wpisy na obu telefonach, na bieżąco' },
  en: { hook: 'One Premium for both parents',      benefit: 'Same entries on both phones, in real time' },
  de: { hook: 'Ein Premium für beide Eltern',      benefit: 'Dieselben Einträge auf beiden Handys, live' },
  fr: { hook: 'Un Premium pour les deux parents',  benefit: 'Les mêmes entrées sur vos deux téléphones' },
  es: { hook: 'Un Premium para ambos padres',      benefit: 'Los mismos registros en ambos móviles' },
}

// Konto właściciela (zalogowany) i partner widoczny na liście.
const PEOPLE = {
  pl: { owner: 'Tomek',  partner: 'Kasia' },
  en: { owner: 'James',  partner: 'Emma' },
  de: { owner: 'Jonas',  partner: 'Lena' },
  fr: { owner: 'Thomas', partner: 'Camille' },
  es: { owner: 'Pablo',  partner: 'María' },
}

// Zawiera "0", którego INVITE_ALPHABET w functions/index.js nie używa — taki kod
// nigdy nie powstanie naprawdę, więc wpisanie go ze screena nikogo nie połączy.
const INVITE_CODE = 'K7M0PX'
const GUEST_PREFIX = 'babylog_guest_'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Stan gościa z generate-screenshots-overlay.mjs → dokumenty Firestore {key: value}.
function accountDocs(locale) {
  const docs = {}
  for (const [k, v] of Object.entries(buildState(locale))) {
    if (k.startsWith(GUEST_PREFIX)) docs[k.slice(GUEST_PREFIX.length)] = JSON.parse(v)
  }
  docs.premium_purchased = true
  return docs
}

// Ustawienia globalne (zgody, język) — reszta idzie do Firestore.
function localSettings(locale) {
  return Object.fromEntries(
    Object.entries(buildState(locale)).filter(([k]) => !k.startsWith(GUEST_PREFIX) && k !== 'babylog_guest'),
  )
}

// Callable Functions odpowiadają danymi demo — kod zaproszenia jest stały.
async function mockFunctions(page) {
  await page.setRequestInterception(true)
  page.on('request', req => {
    if (!req.url().includes('cloudfunctions.net')) { req.continue(); return }
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
    if (req.method() === 'OPTIONS') { req.respond({ status: 204, headers: cors }); return }
    const result = req.url().endsWith('/createPartnerInvite')
      ? { code: INVITE_CODE, expiresAt: Date.now() + 48 * 3600000 }
      : null
    req.respond({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ result }) })
  })
}

async function capture(browser, locale) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ ...VIEWPORT, deviceScaleFactor: 2.5 })
  await mockFunctions(page)
  page.on('dialog', d => d.dismiss())

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate((s) => {
    localStorage.clear()
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v))
  }, localSettings(locale))
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__emu, { timeout: 30000 })

  const { owner, partner } = PEOPLE[locale]
  await page.evaluate(async (owner, partner, docs) => {
    const uid = await window.__emu.signIn(`${owner.toLowerCase()}-demo`, owner)
    await window.__emu.seed(uid, docs, { 'partner-demo': { name: partner, linkedAt: Date.now() } })
  }, owner, partner, accountDocs(locale))

  // Po zalogowaniu Firestore trzyma otwarte połączenie — networkidle nie nastąpi.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await sleep(5000)

  // Ustawienia (ikona w topbarze) → "Zaproś partnera" → kod zaproszenia.
  await page.evaluate(() => {
    document.querySelector('button[title="Ustawienia"], button[title="Settings"], button[title="Einstellungen"], button[title="Paramètres"], button[title="Ajustes"]')?.click()
  })
  await sleep(1500)
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('div')].find(d =>
      d.children.length === 2 && /^(Wspólne konto|Shared account|Gemeinsames Konto|Compte partagé|Cuenta compartida)$/.test(d.firstElementChild?.textContent.trim() || ''))
    const invite = [...(card?.querySelectorAll('button') || [])]
      .find(b => /Zaproś|Invite|einladen|Inviter|Invitar/.test(b.textContent))
    invite?.click()
    window.__partnerCard = card
  })
  await sleep(1500)
  await page.evaluate(() => {
    const card = window.__partnerCard
    if (!card) return
    card.scrollIntoView({ block: 'start' })
    // Nagłówek "Ustawienia" jest sticky — przewiń tak, żeby karta była pod nim.
    const header = [...document.querySelectorAll('*')].find(el =>
      getComputedStyle(el).position === 'sticky' && el.getBoundingClientRect().top <= 0)
    const offset = (header?.getBoundingClientRect().bottom || 0) + 12
    const scroller = [card.parentElement, document.scrollingElement].find(el => el && el.scrollHeight > el.clientHeight)
    if (scroller) scroller.scrollTop -= offset
  })
  await sleep(800)

  const tmpDir = path.join(TMP_DIR, locale)
  const outDir = path.join(OUT_DIR, locale)
  fs.mkdirSync(tmpDir, { recursive: true })
  fs.mkdirSync(outDir, { recursive: true })
  const rawFile = path.join(tmpDir, `${SHOT}.png`)
  await page.screenshot({ path: rawFile, type: 'png' })
  const finalFile = path.join(outDir, `${SHOT}.png`)
  await composeShot(rawFile, finalFile, OVERLAY[locale].hook, OVERLAY[locale].benefit)
  console.log(`  [${locale}] ${SHOT}.png  →  ${finalFile}`)

  await context.close()
}

const ALL_LOCALES = ['pl', 'en', 'de', 'fr', 'es']

async function main() {
  const arg = process.argv.slice(2).filter(a => ALL_LOCALES.includes(a))
  const locales = arg.length > 0 ? arg : ALL_LOCALES
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 120000,
  })
  for (const loc of locales) await capture(browser, loc)
  await browser.close()
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
