// scripts/e2e-shared-merge.mjs
//
// Test na emulatorze Firebase: dwa telefony na tym samym koncie, jeden bez
// internetu. Oba dodają karmienie. Po odzyskaniu sieci na serwerze muszą być
// OBA wpisy (v2.16.13: scalanie list zamiast nadpisywania).
//
// Wymaga: emulatory auth+firestore (porty 9099/8080, reguły z firestore.rules)
// i Vite na emulatorach (port 5174, scripts/screenshots/vite.emulators.config.mjs).
// Run: node scripts/e2e-shared-merge.mjs

import puppeteer from 'puppeteer-core'
import { CHROME_PATH, buildState } from './generate-screenshots-overlay.mjs'

const APP = 'http://localhost:5174/babylog/'
const PROJECT = 'babylog-3c1cc'
const KEY = 'feed_demo'
const PROTECTED = new Set(['premium_purchased', 'premium_meta', 'trial_start', 'linked_owner'])
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Stan gościa z przykładowymi danymi → dokumenty konta.
function accountDocs() {
  const docs = {}
  for (const [k, v] of Object.entries(buildState('pl'))) {
    if (!k.startsWith('babylog_guest_')) continue
    const key = k.slice('babylog_guest_'.length)
    if (!PROTECTED.has(key) && !key.startsWith('trial_start')) docs[key] = JSON.parse(v)
  }
  return docs
}
function localSettings() {
  return Object.fromEntries(Object.entries(buildState('pl'))
    .filter(([k]) => !k.startsWith('babylog_guest') ))
}

async function serverIds(uid) {
  const r = await fetch(`http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/data/${KEY}`,
    { headers: { Authorization: 'Bearer owner' } })
  const j = await r.json()
  return (j.fields?.value?.arrayValue?.values || []).map(v => v.mapValue.fields.id.stringValue)
}

async function openPhone(browser) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 432, height: 864 })
  page.on('pageerror', e => console.log('  wyjątek:', e.message.slice(0, 120)))
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(s => {
    localStorage.clear()
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v))
    localStorage.setItem('babylog_medical_consent_v1', '1')
  }, localSettings())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__emu, { timeout: 30000 })
  return page
}

async function quickAdd(page, emoji) {
  await page.evaluate(() => {
    const fab = [...document.querySelectorAll('button')].find(b => getComputedStyle(b).position === 'fixed' && b.getAttribute('aria-label'))
    fab?.click()
  })
  await sleep(700)
  return page.evaluate((emoji, key) => {
    const before = new Set((JSON.parse(localStorage.getItem('babylog_' + key) || '[]')).map(e => e.id))
    const sheet = document.querySelector('[role="dialog"]')
    const tile = [...(sheet?.querySelectorAll('button') || [])].find(b => b.textContent.includes(emoji))
    tile?.click()
    return new Promise(res => setTimeout(() => {
      const after = JSON.parse(localStorage.getItem('babylog_' + key) || '[]')
      res(after.map(e => e.id).find(id => !before.has(id)) || null)
    }, 800))
  }, emoji, KEY)
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const A = await openPhone(browser)
  const B = await openPhone(browser)

  const uid = await A.evaluate(async docs => {
    const uid = await window.__emu.signIn('merge-demo', 'Tomek')
    await window.__emu.seed(uid, docs, {})
    return uid
  }, accountDocs())
  await B.evaluate(() => window.__emu.signIn('merge-demo', 'Tomek'))
  for (const p of [A, B]) { await p.reload({ waitUntil: 'domcontentloaded' }); }
  await sleep(6000)

  const start = await serverIds(uid)
  console.log('Na serwerze na początku:', start.length, 'karmień')

  await B.setOfflineMode(true)
  await sleep(1500)
  const idB = await quickAdd(B, '🤱')       // telefon B bez internetu
  const idA = await quickAdd(A, '🍼')       // telefon A online
  console.log('Dodane: A (online)', idA, '| B (offline)', idB)
  await sleep(4000)
  const mid = await serverIds(uid)
  console.log('Serwer, gdy B offline: A', mid.includes(idA) ? 'jest' : 'BRAK', '| B', mid.includes(idB) ? 'jest' : 'jeszcze nie')

  await B.setOfflineMode(false)
  let end = []
  for (let i = 0; i < 30; i++) {
    await sleep(1000)
    end = await serverIds(uid)
    if (end.includes(idA) && end.includes(idB)) break
  }
  const lostOld = start.filter(id => !end.includes(id))
  const ok = !!idA && !!idB && end.includes(idA) && end.includes(idB) && lostOld.length === 0
  console.log('Serwer po powrocie B online:', end.length, 'karmień;',
    'A', end.includes(idA) ? 'jest' : 'BRAK', '| B', end.includes(idB) ? 'jest' : 'BRAK',
    '| zgubione stare:', lostOld.length)

  await sleep(2000)
  const localA = await A.evaluate(k => JSON.parse(localStorage.getItem('babylog_' + k) || '[]').map(e => e.id), KEY)
  const localB = await B.evaluate(k => JSON.parse(localStorage.getItem('babylog_' + k) || '[]').map(e => e.id), KEY)
  console.log('Telefon A widzi oba:', localA.includes(idA) && localA.includes(idB), '| Telefon B widzi oba:', localB.includes(idA) && localB.includes(idB))

  // Krok 2: B (bez internetu) usuwa wpis, A w tym czasie dodaje nowy.
  await B.setOfflineMode(true)
  await sleep(1000)
  await B.evaluate(() => document.querySelectorAll('.bottom-nav .nav-item')[1]?.click())
  await sleep(1000)
  const deleted = await B.evaluate(k => {
    const before = JSON.parse(localStorage.getItem('babylog_' + k) || '[]').map(e => e.id)
    document.querySelector('button[aria-label="Usuń"]')?.click()
    return new Promise(res => setTimeout(() => {
      const after = new Set(JSON.parse(localStorage.getItem('babylog_' + k) || '[]').map(e => e.id))
      res(before.find(id => !after.has(id)) || null)
    }, 800))
  }, KEY)
  const idA2 = await quickAdd(A, '🍼')
  console.log('\nKrok 2: B (offline) usuwa', deleted, '| A (online) dodaje', idA2)
  await sleep(3000)
  await B.setOfflineMode(false)
  let end2 = []
  for (let i = 0; i < 30; i++) {
    await sleep(1000)
    end2 = await serverIds(uid)
    if (end2.includes(idA2) && !end2.includes(deleted)) break
  }
  await sleep(2000)
  const lA = await A.evaluate(k => JSON.parse(localStorage.getItem('babylog_' + k) || '[]').map(e => e.id), KEY)
  const lB = await B.evaluate(k => JSON.parse(localStorage.getItem('babylog_' + k) || '[]').map(e => e.id), KEY)
  const ok2 = !!deleted && !!idA2 && end2.includes(idA2) && !end2.includes(deleted)
    && end2.length === end.length && lA.length === end2.length && lB.length === end2.length
  console.log('Serwer:', end2.length, 'karmień; usunięty', end2.includes(deleted) ? 'WRÓCIŁ' : 'zniknął',
    '| nowy od A', end2.includes(idA2) ? 'jest' : 'BRAK', '| telefony widzą:', lA.length, lB.length)

  // Krok 3: nowy telefon (gość) traci zasięg, zanim wykresy zdążą się pobrać.
  // Zakładka Karmienie ma działać, zamiast wykresu krótki komunikat.
  const ctxC = await browser.createBrowserContext()
  const C = await ctxC.newPage()
  await C.setViewport({ width: 432, height: 864 })
  const errorsC = []
  C.on('pageerror', e => errorsC.push(e.message.slice(0, 120)))
  await C.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await C.evaluate(s => {
    localStorage.clear()
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v))
    localStorage.setItem('babylog_medical_consent_v1', '1')
  }, buildState('pl'))
  await C.reload({ waitUntil: 'networkidle0', timeout: 60000 })
  await C.setOfflineMode(true)           // przed preloadCharts (4 s po starcie)
  await C.evaluate(() => document.querySelectorAll('.bottom-nav .nav-item')[1]?.click())
  await sleep(1500)
  const offlineView = await C.evaluate(() => ({
    msg: document.body.innerText.includes('Wykres pojawi się, gdy wróci internet'),
    tabOk: !!document.querySelector('button[aria-label="Usuń"]'),
  }))
  console.log('\nKrok 3 (offline, wykres niepobrany): komunikat', offlineView.msg ? 'jest' : 'BRAK',
    '| lista karmień działa', offlineView.tabOk ? 'tak' : 'NIE', '| wyjątki:', errorsC.length)
  await C.setOfflineMode(false)
  await sleep(4000)
  const chartBack = await C.evaluate(() => !document.body.innerText.includes('Wykres pojawi się') && !!document.querySelector('.recharts-wrapper, svg.recharts-surface'))
  console.log('Po powrocie internetu wykres się pojawił:', chartBack)
  const ok3 = offlineView.msg && offlineView.tabOk && errorsC.length === 0

  const all = ok && ok2 && ok3
  console.log(all ? '\nWYNIK: OK, żaden wpis nie zginął ani nie wrócił po usunięciu, zakładka działa bez internetu.' : '\nWYNIK: BŁĄD')
  await browser.close()
  process.exit(all ? 0 : 1)
}

main().catch(e => { console.error('FAILED:', e); process.exit(1) })
