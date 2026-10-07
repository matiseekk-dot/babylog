// scripts/pregnancy-check.mjs
//
// Tryb ciąży (v2.17.0) od początku do końca, jako gość, w 5 językach:
//   1. formularz: "Spodziewamy się", termin porodu, widoczność bez przewijania
//   2. ekran ciąży: tydzień, odliczanie, brak wyjścia poza ekran
//   3. licznik skurczy: 2 skurcze → historia i podsumowanie godziny
//   4. "Urodziło się" → okienko prezentu 14 dni → ekran Dziś niemowlęcia
//   5. drugi przebieg (pl): "Zakończ tryb ciąży" → spokojna plansza → formularz
// Zrzuty do PREG_OUT (domyślnie store-assets/first-run).
//
// Wymaga dev servera na 5173 (npm run dev). Run: node scripts/pregnancy-check.mjs [pl en ...]

import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const APP_URL = process.env.SMOKE_URL || 'http://localhost:5173/babylog/'
const OUT = process.env.PREG_OUT || 'store-assets/first-run'
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['pl', 'en', 'de', 'fr', 'es']
const sleep = ms => new Promise(r => setTimeout(r, ms))
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

async function fresh(browser, lang, w = 360, h = 640) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const errors = []
  page.on('pageerror', e => errors.push(`WYJĄTEK: ${e.message.slice(0, 160)}`))
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(l => {
    localStorage.clear(); sessionStorage.clear()
    localStorage.setItem('babylog_locale', l); localStorage.setItem('babylog_guest', '1')
  }, lang)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2500)
  return { page, errors }
}

const setInput = (page, sel, value) => page.evaluate((s, v) => {
  const el = document.querySelector(s)
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}, sel, value)

const clickText = (page, text) => page.evaluate(tx => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(tx))
  b?.click(); return !!b
}, text)

const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)

async function createPregnancy(page, issues, tag, due) {
  await page.evaluate(() => [...document.querySelectorAll('[role=radio]')][1]?.click())
  await sleep(400)
  const hidden = await page.evaluate(() => {
    const limit = document.querySelector('div[style*="sticky"]')?.getBoundingClientRect().top ?? innerHeight
    return ['#onb-preg-name', '#onb-due'].filter(s => {
      const r = document.querySelector(s)?.getBoundingClientRect()
      return !r || r.bottom > limit + 1
    })
  })
  if (hidden.length) issues.push(`${tag} formularz ciąży: zasłonięte ${hidden.join(', ')}`)
  await setInput(page, '#onb-preg-name', 'Fasolka')
  await setInput(page, '#onb-due', due)
  await page.evaluate(() => document.querySelector('div[style*="sticky"] button')?.click())
  await sleep(1500)
}

async function run(browser, lang, issues) {
  const tag = lang
  const { page, errors } = await fresh(browser, lang)
  const shot = name => page.screenshot({ path: path.join(OUT, `preg-${lang}-${name}.png`) })
  const due = new Date(); due.setDate(due.getDate() + 20)   // 37. tydzień: karta "Urodziło się" na wierzchu
  await createPregnancy(page, issues, tag, ymd(due))
  const home = await page.evaluate(() => ({
    week: !!document.querySelector('[role=progressbar]'),
    nav: !!document.querySelector('.bottom-nav'),
  }))
  if (!home.week) issues.push(`${tag}: brak ekranu ciąży po formularzu`)
  if (home.nav) issues.push(`${tag}: pasek nawigacji niemowlęcia w trybie ciąży`)
  if (await overflow(page)) issues.push(`${tag} ekran ciąży: wychodzi poza ekran`)
  // v2.17.9: karta "Ten tydzień" (termin za 20 dni = 37 pełnych tygodni, we Francji 38 SA).
  const week = await page.evaluate(() => document.querySelector('[data-week]')?.dataset.week)
  if (week !== (lang === 'fr' ? '38' : '37')) issues.push(`${tag}: karta tygodnia pokazuje tydzień ${week}`)
  await shot('1-home')

  // v2.17.6: torba (odhaczenie + własna pozycja), wyprawka, ruchy dziecka.
  const openCard = icon => page.evaluate(i => {
    const b = [...document.querySelectorAll('button')].find(x => x.firstElementChild?.textContent === i)
    b?.click(); return !!b
  }, icon)
  const back = () => page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent === '‹')?.click())
  if (!(await openCard('🧳'))) issues.push(`${tag}: brak karty torby`)
  await sleep(500)
  await page.evaluate(() => document.querySelector('input[type=checkbox]')?.click())
  await setInput(page, 'form input', 'Głośnik')
  await page.evaluate(() => document.querySelector('form button[type=submit]')?.click())
  await sleep(500)
  const bagState = await page.evaluate(() => ({
    checked: document.querySelectorAll('input[type=checkbox]:checked').length,
    custom: document.body.innerText.includes('Głośnik'),
  }))
  if (bagState.checked !== 1 || !bagState.custom) issues.push(`${tag} torba: ${JSON.stringify(bagState)}`)
  if (await overflow(page)) issues.push(`${tag} torba: wychodzi poza ekran`)
  await shot('1c-bag')
  await back(); await sleep(400)
  if (!(await openCard('🧸'))) issues.push(`${tag}: brak karty wyprawki`)
  await sleep(500)
  if (await overflow(page)) issues.push(`${tag} wyprawka: wychodzi poza ekran`)
  await shot('1d-layette')
  await back(); await sleep(400)
  if (!(await openCard('🦶'))) issues.push(`${tag}: brak karty ruchów w 37. tygodniu`)
  await sleep(500)
  const circle = () => page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.style.borderRadius === '50%')
    b?.click(); return !!b
  })
  await circle(); await sleep(400)
  for (let i = 0; i < 3; i++) { await circle(); await sleep(150) }
  await shot('1e-kicks-running')
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.style.borderRadius === '22px')?.click())
  await sleep(500)
  const kick = await page.evaluate(() => [...document.querySelectorAll('tbody tr td')].map(td => td.textContent))
  if (kick[1] !== '3') issues.push(`${tag} ruchy: wiersz ${JSON.stringify(kick)}`)
  if (await overflow(page)) issues.push(`${tag} ruchy: wychodzi poza ekran`)
  await shot('1f-kicks')
  await back(); await sleep(400)
  const bagCard = await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.firstElementChild?.textContent === '🧳')?.textContent || '')
  if (!/1\D+\d+/.test(bagCard)) issues.push(`${tag} karta torby bez postępu: "${bagCard}"`)

  // Ustawienia: termin zamiast wieku, bez raportu PDF; lista dzieci: tydzień ciąży.
  await page.evaluate(() => [...document.querySelectorAll('.topbar button')].find(b => b.querySelector('svg circle'))?.click())
  await sleep(700)
  const settings = await page.evaluate(() => ({
    due: !!document.querySelector('#set-preg-due'),
    age: !!document.querySelector('input[type=number]'),
  }))
  if (!settings.due || settings.age) issues.push(`${tag} ustawienia ciąży: termin=${settings.due} wiek=${settings.age}`)
  await shot('1b-settings')
  await page.evaluate(() => window.__spokojnyBack?.())
  await sleep(500)
  await page.evaluate(() => document.querySelector('.baby-chip')?.click())
  await sleep(500)
  const detail = await page.evaluate(() => document.querySelector('.profile-detail')?.textContent || '')
  if (!/3[78]/.test(detail) || /kg/.test(detail)) issues.push(`${tag} lista dzieci: "${detail}"`)
  await page.evaluate(() => document.querySelector('.baby-chip')?.click())
  await sleep(500)

  // Licznik skurczy: dwa skurcze.
  await page.evaluate(() => [...document.querySelectorAll('[role=tab]')][1]?.click())
  await sleep(500)
  const mainBtn = () => page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.style.borderRadius === '50%' && x.offsetWidth >= 150)
    b?.click(); return !!b
  })
  for (let i = 0; i < 2; i++) {
    if (!(await mainBtn())) { issues.push(`${tag}: brak przycisku skurczu`); break }
    await sleep(1200)
    await mainBtn()
    await sleep(700)
  }
  const rows = await page.evaluate(() => document.querySelectorAll('tbody tr').length)
  if (rows !== 2) issues.push(`${tag} skurcze: ${rows} wierszy zamiast 2`)
  if (await overflow(page)) issues.push(`${tag} skurcze: wychodzi poza ekran`)
  await shot('2-contractions')

  // Urodziło się → prezent → Dziś.
  await page.evaluate(() => [...document.querySelectorAll('[role=tab]')][0]?.click())
  await sleep(400)
  const birthBtn = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button.btn-primary')].find(x => x.textContent.includes('👶'))
    b?.click(); return !!b
  })
  if (!birthBtn) issues.push(`${tag}: brak karty "Urodziło się" w 37. tygodniu`)
  await sleep(600)
  // v2.17.7: godzina, waga i długość → karta narodzin, potem prezent.
  await setInput(page, '#birth-time', '14:35')
  await setInput(page, '#birth-weight', '3,45')
  await setInput(page, '#birth-length', '54')
  await shot('3-birth-modal')
  await page.evaluate(() => document.querySelector('.modal-sheet button.btn-primary')?.click())
  await sleep(1500)
  const card = await page.evaluate(() => ({
    title: document.querySelector('.modal-title')?.textContent || '',
    img: !!document.querySelector('.modal-sheet img[src^="data:image"]'),
    dialogs: document.querySelectorAll('[role=dialog]').length,
    stats: document.querySelector('.modal-sheet section')?.innerText || '',
    growth: Object.entries(localStorage).find(([k]) => k.startsWith('babylog_guest_growth_'))?.[1] || '',
  }))
  if (card.dialogs !== 1) issues.push(`${tag}: na karcie narodzin ${card.dialogs} okna naraz`)
  if (!card.title.includes('👶') || !card.img) issues.push(`${tag}: po porodzie brak karty narodzin (${card.title})`)
  if (!/\d+\+\d/.test(card.stats) || !/2/.test(card.stats)) issues.push(`${tag} karta narodzin: podsumowanie "${card.stats.replace(/\n/g, ' ')}"`)
  if (!card.growth.includes('3.45') || !card.growth.includes('54')) issues.push(`${tag}: pomiar z porodu nie trafił do wzrostu: ${card.growth.slice(0, 120)}`)
  if (await overflow(page)) issues.push(`${tag} karta narodzin: wychodzi poza ekran`)
  await shot('3b-birth-card')
  await page.evaluate(() => [...document.querySelectorAll('.modal-sheet button')].pop()?.click())
  await sleep(1000)
  const gift = await page.evaluate(() => document.querySelector('.modal-title')?.textContent || '')
  if (!gift.includes('🎁')) issues.push(`${tag}: po porodzie brak okienka prezentu (tytuł: "${gift}")`)
  await shot('4-gift')
  await page.evaluate(() => document.querySelector('.modal-sheet button.btn-primary')?.click())
  await sleep(1000)
  const after = await page.evaluate(() => ({
    nav: !!document.querySelector('.bottom-nav'),
    trial: document.querySelector('.topbar')?.innerText || '',
    profile: JSON.parse(localStorage.getItem('babylog_guest_profiles') || '[]')[0] || {},
    teaser: [...document.querySelectorAll('button')].some(b => b.firstElementChild?.textContent === '👶'),
  }))
  if (!after.nav) issues.push(`${tag}: po porodzie brak zakładek niemowlęcia`)
  if (after.profile.mode !== 'baby' || !after.profile.birthDate) issues.push(`${tag}: profil po porodzie ${JSON.stringify(after.profile).slice(0, 120)}`)
  if (after.profile.birthWeightG !== 3450 || after.profile.birthLengthCm !== 54 || after.profile.birthTime !== '14:35') issues.push(`${tag}: pomiary w profilu ${JSON.stringify(after.profile).slice(0, 200)}`)
  if (!after.teaser) issues.push(`${tag}: brak karty narodzin na ekranie Dziś`)
  if (!/14/.test(after.trial)) issues.push(`${tag}: po porodzie nie widać 14 dni (topbar: ${after.trial.replace(/\n/g, ' ')})`)
  await shot('5-today')
  issues.push(...errors.map(e => `${tag} ${e}`))
  await page.close()
}

async function runEnd(browser, issues) {
  const { page, errors } = await fresh(browser, 'pl')
  const shot = name => page.screenshot({ path: path.join(OUT, `preg-pl-${name}.png`) })
  const due = new Date(); due.setDate(due.getDate() + 150)
  await createPregnancy(page, issues, 'pl/koniec', ymd(due))
  await clickText(page, 'Zakończ tryb ciąży')
  await sleep(500)
  await shot('6-end-modal')
  await page.evaluate(() => document.querySelector('.modal-sheet button')?.click())
  await sleep(1500)
  const txt = await page.evaluate(() => document.body.innerText)
  if (!txt.includes('Tryb ciąży wyłączony')) issues.push('pl/koniec: brak spokojnej planszy po zakończeniu')
  if (/Poznajmy Twoje dziecko|🤰/.test(txt)) issues.push('pl/koniec: plansza pokazuje formularz albo treści ciążowe')
  await shot('7-after-end')
  await clickText(page, 'Dodaj profil')
  await sleep(600)
  const form = await page.evaluate(() => !!document.querySelector('#onb-name'))
  if (!form) issues.push('pl/koniec: "Dodaj profil" nie otwiera formularza')
  issues.push(...errors.map(e => `pl/koniec ${e}`))
  await page.close()
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' })
const issues = []
for (const lang of LANGS) await run(browser, lang, issues)
if (LANGS.includes('pl')) await runEnd(browser, issues)
await browser.close()
console.log(issues.length ? issues.join('\n') : `OK: tryb ciąży w ${LANGS.length} językach, poród i zakończenie`)
