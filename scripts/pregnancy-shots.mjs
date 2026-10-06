// scripts/pregnancy-shots.mjs
//
// Zrzuty trybu ciąży (880×1760, jak telefon w Shorts) w 5 językach: ekran
// ciąży, licznik skurczy i (PL) badania. Gość z przykładowym profilem
// (31. tydzień), kilka skurczy, odhaczone badania. Wynik:
// store-assets/screenshots-preg/{lang}/preg-home.png, preg-contractions.png, preg-exams.png
// v2.17.6: także preg-bag-before/after (odhaczenie ładowarki) i preg-kicks (paczka Shorts 4).
//
// Wymaga dev servera na 5173. Run: node scripts/pregnancy-shots.mjs [pl en ...]

import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'url'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store-assets', 'screenshots-preg')
const URL = 'http://localhost:5173/babylog/'
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['pl', 'en', 'de', 'fr', 'es']
const NAMES = { pl: 'Fasolka', en: 'Little Bean', de: 'Krümel', fr: 'Petit pois', es: 'Garbancito' }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const pad = n => String(n).padStart(2, '0')
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function state(lang) {
  const term = lang === 'fr' ? 287 : 280
  const due = new Date(); due.setHours(12); due.setDate(due.getDate() + (term - 220))   // 31+3
  const id = 'preg1'
  const now = Date.now()
  const min = 60 * 1000
  // Skurcze z ostatniej godziny: co ok. 6 minut, po ok. 50 s.
  const contractions = [0, 1, 2, 3].map(i => {
    const start = now - (4 - i) * 6.2 * min
    return { id: `c${i}`, start, end: start + (45 + i * 4) * 1000 }
  }).reverse()
  const g = 'babylog_guest_'
  return {
    babylog_locale: lang,
    babylog_guest: '1',
    babylog_medical_consent_v1: '1',
    babylog_disclaimer_ack: new Date().toISOString(),
    [`${g}onboarding_done`]: 'true',
    [`${g}activeProfile`]: JSON.stringify(id),
    [`${g}profiles`]: JSON.stringify([{ id, mode: 'pregnancy', name: NAMES[lang], dueDate: ymd(due), termDays: term, avatar: '🤰', avatarColor: '#FBEAF0', months: 0, weight: null, sex: null, toiletMode: 'diapers' }]),
    [`${g}trial_start_guest`]: String(now - 2 * 24 * 3600 * 1000),
    [`${g}contractions_${id}`]: JSON.stringify(contractions),
    [`${g}lists_${id}`]: JSON.stringify({ bag: Object.fromEntries(['id', 'notes', 'insurance', 'nightdress', 'robe', 'pads', 'babyclothes', 'hat', 'diapers'].map(k => [k, true])) }),
    [`${g}kicks_${id}`]: JSON.stringify([[1, 21, 12, 34], [2, 20, 10, 41], [3, 21, 14, 28], [4, 22, 11, 37], [5, 21, 13, 30]].map(([d, h, count, mins]) => {
      const start = new Date(); start.setDate(start.getDate() - d); start.setHours(h, 10, 0, 0)
      return { id: `k${d}`, start: start.getTime(), end: start.getTime() + mins * min, count }
    })),
    [`${g}exams_${id}`]: JSON.stringify({ 'w0:0': true, 'w0:1': true, 'w0:2': true, 'w0:3': true, 'w11:0': true, 'w15:0': true, 'w15:1': true, 'w18:0': true, 'w24:0': true }),
  }
}

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 2.2, isMobile: true, hasTouch: true })
for (const lang of LANGS) {
  const dir = path.join(OUT, lang)
  fs.mkdirSync(dir, { recursive: true })
  await page.goto(URL, { waitUntil: 'domcontentloaded' })
  await page.evaluate(s => { localStorage.clear(); Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)) }, state(lang))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await sleep(2500)
  await page.screenshot({ path: path.join(dir, 'preg-home.png') })
  await page.evaluate(() => [...document.querySelectorAll('[role=tab]')][1]?.click())
  await sleep(800)
  await page.screenshot({ path: path.join(dir, 'preg-contractions.png') })
  // Torba: przed i po odhaczeniu ładowarki (7. pozycja w grupie Dla mamy), potem ruchy dziecka.
  const card = icon => page.evaluate(i => [...document.querySelectorAll('button')].find(x => x.firstElementChild?.textContent === i)?.click(), icon)
  await page.evaluate(() => [...document.querySelectorAll('[role=tab]')][0]?.click())
  await sleep(500)
  await card('🧳')
  await sleep(800)
  // Wiersz ładowarki podświetlony na obu zrzutach, żeby w filmie było widać, co się zmieniło.
  await page.evaluate(() => Object.assign(document.querySelectorAll('section')[1].querySelectorAll('li')[6].style, { background: '#FFF1BF', borderRadius: '8px', margin: '0 -8px', padding: '0 8px' }))
  await page.screenshot({ path: path.join(dir, 'preg-bag-before.png') })
  await page.evaluate(() => document.querySelectorAll('section')[1]?.querySelectorAll('input[type=checkbox]')[6]?.click())
  await sleep(600)
  await page.screenshot({ path: path.join(dir, 'preg-bag-after.png') })
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent === '‹')?.click())
  await sleep(500)
  await card('🦶')
  await sleep(800)
  await page.screenshot({ path: path.join(dir, 'preg-kicks.png') })
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent === '‹')?.click())
  await sleep(400)
  if (lang === 'pl') {
    await page.evaluate(() => [...document.querySelectorAll('[role=tab]')][2]?.click())
    await sleep(800)
    // Bieżący okres badań na górze ekranu.
    await page.evaluate(() => {
      const now = [...document.querySelectorAll('section[aria-label]')].find(x => x.style.border.includes('2px'))
      if (now) window.scrollTo({ top: now.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' })
    })
    await sleep(400)
    await page.screenshot({ path: path.join(dir, 'preg-exams.png') })
  }
  console.log(`  ${lang}: gotowe`)
}
await browser.close()
