// scripts/build-pregnancy-cheatsheet.mjs
//
// Ściągawka ciążowa na lodówkę (A4, jedna strona, PL): badania według tygodni
// (polski standard opieki okołoporodowej, src/data/pregnancyExamsPl.js), objawy,
// przy których jedzie się do szpitala od razu, kiedy jechać przy skurczach,
// torba do szpitala i miejsce na telefony. Kod QR: skudev.pl/pobierz.
// Treść zgodna z poradnikiem na skudev.pl (badania, torba, kiedy jechać).
//
// Wynik: store-assets/print/sciagawka-ciaza-pl.pdf i .png (podgląd)
// Run: node scripts/build-pregnancy-cheatsheet.mjs

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'
import { EXAM_PERIODS } from '../src/data/pregnancyExamsPl.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store-assets', 'print')
const qr = fs.readFileSync(path.join(OUT, 'qr-skudev-pobierz.svg'), 'utf8')
const icon = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'public', 'icon-512.png')).toString('base64')}`

const T = {
  app: 'Spokojny Rodzic',
  title: 'Ciąża: badania, torba i kiedy jechać do szpitala',
  sub: 'Ściągawka na lodówkę według standardu opieki okołoporodowej (stan na 2026 r.)',
  examsTitle: 'Badania według tygodni ciąży',
  examsHead: ['Kiedy', 'Badania'],
  visits: 'Wizyta u lekarza albo położnej nie rzadziej niż co 4 tygodnie.',
  urgentTitle: 'Jedź do szpitala albo dzwoń od razu, gdy:',
  urgent: [
    'odejdą wody, zwłaszcza zielone, brązowe albo o nieprzyjemnym zapachu',
    'pojawi się krwawienie z pochwy',
    'dziecko rusza się słabiej albo rzadziej niż zwykle',
    'skurcze zaczną się przed 37. tygodniem',
    'masz silny, stały ból brzucha albo gorączkę',
    'masz silny ból głowy, zaburzenia widzenia, nagły obrzęk twarzy i rąk',
  ],
  laborTitle: 'Skurcze: kiedy jechać',
  labor: [
    'Często mówi się o regularnych skurczach co około 5 minut przez godzinę.',
    'Zapytaj położną albo szpital, czego trzymać się u Ciebie.',
    'Przy kolejnym porodzie ruszaj wcześniej.',
  ],
  bagTitle: 'Torba (spakuj około 36. tygodnia)',
  bag: [
    'Dowód osobisty, karta ciąży i wyniki badań',
    'Koszule do karmienia, kapcie, podpaski poporodowe',
    'Ładowarka z długim kablem, woda, przekąski',
    'Dla dziecka: body i pajacyk 56, czapeczka',
    'Fotelik samochodowy na wyjście',
  ],
  fill: [['Termin porodu', 'Położna, tel.'], ['Szpital, porodówka', 'tel.']],
  qrText: 'Tydzień ciąży, licznik skurczy i po porodzie dziennik niemowlaka. Oboje rodzice widzą te same wpisy.',
  qrCta: 'Spokojny Rodzic, Google Play',
  sources: 'Źródła: standard organizacyjny opieki okołoporodowej (Dz.U. 2026 poz. 1140), NHS, ACOG.',
  disclaimer: 'Ściągawka ma charakter informacyjny i nie zastępuje lekarza ani położnej. Lekarz może zlecić inne lub dodatkowe badania. W zagrożeniu życia dzwoń 112.',
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 0; }
body { width: 210mm; height: 297mm; padding: 12mm 13mm 10mm; font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  color: #12302A; background: #fff; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 3mm; font-size: 12pt; font-weight: 700; color: #0F6E56; }
.brand img { width: 10mm; height: 10mm; border-radius: 2.4mm; }
h1 { font-size: 21pt; line-height: 1.1; font-weight: 800; letter-spacing: -0.3pt; margin: 3.5mm 0 1.2mm; }
.sub { font-size: 10pt; color: #3E5A52; font-weight: 600; margin-bottom: 4mm; }
h2 { font-size: 12.5pt; font-weight: 800; color: #0F6E56; margin: 0 0 1.8mm; }
table { width: 100%; border-collapse: collapse; font-size: 9.3pt; }
th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .4pt; color: #5F7570; padding: 0 2mm 1.2mm; border-bottom: 1.1pt solid #12302A; }
td { padding: 1.45mm 2mm; border-bottom: .5pt solid #D4E6DE; vertical-align: top; line-height: 1.28; }
td:first-child { font-weight: 800; white-space: nowrap; width: 24mm; }
.visits { font-size: 9pt; color: #3E5A52; margin: 1.6mm 0 3.5mm; }
.urgentbox { border: 2pt solid #C0392B; border-radius: 3mm; padding: 3mm 4mm; margin-bottom: 3.5mm; }
.urgentbox h2 { color: #C0392B; }
.urgentbox ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 4mm; }
.urgentbox li { font-size: 9.6pt; line-height: 1.28; padding-left: 5.5mm; position: relative; font-weight: 600; }
.urgentbox li::before { content: '!'; position: absolute; left: 0; top: .2mm; width: 3.8mm; height: 3.8mm; border-radius: 50%;
  background: #C0392B; color: #fff; font-size: 7.5pt; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 3.5mm; }
.box { background: #EEF7F2; border-radius: 3mm; padding: 3mm 3.8mm; }
.box ul { padding-left: 4.2mm; display: grid; gap: 1mm; font-size: 9.3pt; line-height: 1.28; }
.fill { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm 6mm; font-size: 9.6pt; color: #3E5A52; margin-bottom: auto; }
.fill div { display: flex; gap: 2mm; align-items: flex-end; }
.fill span { flex: 1; border-bottom: .8pt solid #12302A; height: 6.5mm; }
.bottom { display: flex; align-items: center; gap: 5mm; margin-top: 3.5mm; padding: 3mm 4mm; border-radius: 3mm; background: #EEF7F2; }
.qr { width: 24mm; height: 24mm; flex: none; background: #fff; padding: 1.6mm; border-radius: 2mm; }
.qr svg { width: 100%; height: 100%; display: block; }
.qrtext { font-size: 9.5pt; line-height: 1.35; }
.qrtext b { display: block; font-size: 10.5pt; color: #0F6E56; margin-top: 1mm; }
.foot { margin-top: 2.5mm; font-size: 7.6pt; color: #5F7570; line-height: 1.35; }
`

function html() {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="brand"><img src="${icon}">${T.app}</div>
  <h1>${T.title}</h1>
  <div class="sub">${T.sub}</div>
  <h2>${T.examsTitle}</h2>
  <table><thead><tr>${T.examsHead.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${EXAM_PERIODS.map(p => `<tr><td>${p.label}</td><td>${p.short}</td></tr>`).join('')}
  </tbody></table>
  <div class="visits">${T.visits}</div>
  <div class="urgentbox"><h2>${T.urgentTitle}</h2><ul>${T.urgent.map(u => `<li>${u}</li>`).join('')}</ul></div>
  <div class="cols">
    <div class="box"><h2>${T.laborTitle}</h2><ul>${T.labor.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="box"><h2>${T.bagTitle}</h2><ul>${T.bag.map(x => `<li>${x}</li>`).join('')}</ul></div>
  </div>
  <div class="fill">${T.fill.flat().map(f => `<div>${f}:<span></span></div>`).join('')}</div>
  <div class="bottom">
    <div class="qr">${qr}</div>
    <div class="qrtext">${T.qrText}<b>${T.qrCta}</b></div>
  </div>
  <div class="foot">${T.sources} ${T.disclaimer}</div>
</body></html>`
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const pg = await browser.newPage()
  await pg.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 })
  await pg.setContent(html(), { waitUntil: 'load' })
  const fits = await pg.evaluate(() => document.body.scrollHeight <= document.body.clientHeight + 1)
  if (!fits) console.warn('  UWAGA: nie mieści się na jednej stronie')
  await pg.pdf({ path: path.join(OUT, 'sciagawka-ciaza-pl.pdf'), format: 'A4', printBackground: true, pageRanges: '1' })
  await pg.screenshot({ path: path.join(OUT, 'sciagawka-ciaza-pl.png'), fullPage: false })
  console.log('  pl: sciagawka-ciaza-pl.pdf')
  await browser.close()
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
