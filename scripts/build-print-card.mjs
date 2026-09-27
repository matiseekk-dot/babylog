// scripts/build-print-card.mjs
//
// Karta A6 dla rodziców (do rozdania przez położne i szkoły rodzenia) z kodem QR
// prowadzącym na skudev.pl/pobierz (przekierowanie do Google Play z utm_source=ulotka).
// Białe tło, żeby nie trzeba było spadów: drukarnia tnie po krawędzi A6.
//
// Wynik: store-assets/print/
//   karta-A6.pdf           jedna karta 105×148 mm (do drukarni)
//   karty-A4-4szt.pdf      4 karty na A4 z liniami cięcia (do wydruku w domu)
//   karta-A6.png           podgląd
// Run: node scripts/build-print-card.mjs

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store-assets', 'print')
const qr = fs.readFileSync(path.join(OUT, 'qr-skudev-pobierz.svg'), 'utf8')
const icon = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'public', 'icon-512.png')).toString('base64')}`

const CARD_CSS = `
.card { width: 105mm; height: 148mm; padding: 9mm 8.5mm 7mm; display: flex; flex-direction: column;
  font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #2A1A12; background: #fff; overflow: hidden; }
.brand { display: flex; align-items: center; gap: 3mm; font-size: 12pt; font-weight: 700; color: #B84E2E; }
.brand img { width: 11mm; height: 11mm; border-radius: 2.6mm; }
h1 { font-size: 19pt; line-height: 1.08; font-weight: 800; letter-spacing: -0.3pt; margin: 5mm 0 2.2mm; }
.sub { font-size: 10.5pt; color: #5A463C; font-weight: 600; margin-bottom: 4.5mm; }
ul { list-style: none; display: grid; gap: 1.8mm; margin-bottom: auto; }
li { font-size: 10pt; line-height: 1.3; padding-left: 5.5mm; position: relative; }
li::before { content: ''; position: absolute; left: 0; top: 1.3mm; width: 2.6mm; height: 2.6mm; border-radius: 50%; background: #B84E2E; }
.qrrow { display: flex; align-items: center; gap: 5mm; margin-top: 5mm; padding: 4mm; border-radius: 4mm; background: #FBF1EA; }
.qr { width: 30mm; height: 30mm; flex: none; background: #fff; padding: 2mm; border-radius: 2mm; }
.qr svg { width: 100%; height: 100%; display: block; }
.qrtext { font-size: 9.5pt; line-height: 1.35; }
.qrtext b { display: block; font-size: 11.5pt; color: #B84E2E; margin-top: 1mm; }
.foot { margin-top: 3mm; font-size: 7.6pt; color: #7A665C; line-height: 1.35; }
`

const card = `<div class="card">
  <div class="brand"><img src="${icon}">Spokojny Rodzic</div>
  <h1>Karmienie, sen i gorączka w jednym miejscu</h1>
  <div class="sub">Dziennik niemowlaka dla obojga rodziców</div>
  <ul>
    <li>Karmienie, sen i pieluchy jednym dotknięciem, także w nocy</li>
    <li>Te same wpisy na telefonach obojga rodziców</li>
    <li>Podane leki z godziną i przypomnienia</li>
    <li>Progi gorączki z wytycznych pediatrów</li>
    <li>Raport PDF na wizytę u pediatry</li>
  </ul>
  <div class="qrrow">
    <div class="qr">${qr}</div>
    <div class="qrtext">Zeskanuj telefonem albo wpisz w przeglądarce:<b>skudev.pl/pobierz</b></div>
  </div>
  <div class="foot">Android, Google Play. Bez reklam, 14 dni Premium za darmo. Aplikacja nie zastępuje lekarza.</div>
</div>`

const page = (body, extraCss = '') => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
${CARD_CSS}${extraCss}</style></head><body>${body}</body></html>`

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const pg = await browser.newPage()

  await pg.setContent(page(card, '@page { size: 105mm 148mm; margin: 0 }'), { waitUntil: 'load' })
  const overflow = await pg.evaluate(() => { const c = document.querySelector('.card'); return c.scrollHeight > c.clientHeight + 1 })
  if (overflow) console.warn('UWAGA: treść nie mieści się na karcie A6')
  await pg.pdf({ path: path.join(OUT, 'karta-A6.pdf'), width: '105mm', height: '148mm', printBackground: true })
  await pg.setViewport({ width: 397, height: 559, deviceScaleFactor: 3 })
  await pg.screenshot({ path: path.join(OUT, 'karta-A6.png'), clip: { x: 0, y: 0, width: 397, height: 559 } })

  // A4 (210×297 mm): 2×2 karty A6, cienkie linie cięcia na styku.
  const sheet = `<div class="sheet">${card.repeat(4)}</div>`
  await pg.setContent(page(sheet, `@page { size: A4; margin: 0 }
    .sheet { width: 210mm; height: 297mm; display: grid; grid-template-columns: 105mm 105mm; grid-template-rows: 148mm 148mm; padding-top: 0.5mm; }
    .sheet .card { outline: 0.2mm dashed #C9B8AE; }`), { waitUntil: 'load' })
  await pg.pdf({ path: path.join(OUT, 'karty-A4-4szt.pdf'), format: 'A4', printBackground: true })

  await browser.close()
  console.log('karta-A6.pdf, karty-A4-4szt.pdf, karta-A6.png')
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
