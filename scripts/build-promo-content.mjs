// scripts/build-promo-content.mjs
//
// Grafiki do "Treści promocyjnych" w Play Console (karta "Ważna aktualizacja":
// widżet na ekran główny), 1920×1080 (16:9), PL/EN/DE/FR/ES.
// Kluczowy tekst trzymamy z dala od krawędzi, bo Play przycina kartę różnie
// na różnych ekranach.
//
// Wynik: store-assets/promo-content/promo-widget-{lang}.png
// Run: node scripts/build-promo-content.mjs

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = path.join(ROOT, 'store-assets', 'screenshots-2026-09')
const OUT = path.join(ROOT, 'store-assets', 'promo-content')
const ICON = path.join(ROOT, 'public', 'icon-512.png')
const PHONE_CROP = { left: 100, top: 200, width: 880, height: 1760 }
const FONT = 'Segoe UI, Roboto, Arial, sans-serif'

export const PROMO = {
  pl: { app: 'Spokojny Rodzic', head: ['Nowość: widżet', 'na ekran główny'], sub: 'Karmienie, butelka lub sen jednym dotknięciem' },
  en: { app: 'Calm Parent', head: ['New: home', 'screen widget'], sub: 'Log a feeding, bottle or sleep with one tap' },
  de: { app: 'Calm Parent', head: ['Neu: Widget für', 'den Startbildschirm'], sub: 'Mahlzeit, Flasche oder Schlaf mit einem Tipp' },
  fr: { app: 'Calm Parent', head: ['Nouveau : widget', 'écran d’accueil'], sub: 'Repas, biberon ou sommeil d’un seul appui' },
  es: { app: 'Calm Parent', head: ['Novedad: widget en', 'la pantalla de inicio'], sub: 'Toma, biberón o sueño con un toque' },
}

// Podpis łamiemy na linie do ~30 znaków, żeby nie wchodził pod telefony.
const wrap = (text, max = 30) => text.split(' ').reduce((lines, w) => {
  const last = lines[lines.length - 1]
  if (last && (last + ' ' + w).length <= max) lines[lines.length - 1] = last + ' ' + w
  else lines.push(w)
  return lines
}, [])

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function phone(lang, shot, height) {
  const width = Math.round(height / 2)
  const radius = Math.round(width * 0.06)
  const screen = await sharp(path.join(SHOTS, lang, `${shot}.png`)).extract(PHONE_CROP).resize(width, height).png().toBuffer()
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`)
  const rounded = await sharp(screen).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  const pad = 40
  const shadow = await sharp(Buffer.from(`<svg width="${width + pad * 2}" height="${height + pad * 2}">
    <rect x="${pad}" y="${pad + 12}" width="${width}" height="${height}" rx="${radius}" fill="#000" fill-opacity="0.35"/></svg>`)).blur(20).png().toBuffer()
  return { buf: await sharp(shadow).composite([{ input: rounded, left: pad, top: pad }]).png().toBuffer(), pad }
}

async function build(lang) {
  const T = PROMO[lang]
  const W = 1920, H = 1080
  const size = T.head.some(l => l.length > 17) ? 92 : 104
  const svg = `<svg width="${W}" height="${H}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#B84E2E"/><stop offset="100%" stop-color="#D77460"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="250" y="262" font-family="${FONT}" font-size="46" font-weight="700" fill="#fff">${esc(T.app)}</text>
    ${T.head.map((l, i) => `<text x="160" y="${470 + i * size * 1.12}" font-family="${FONT}" font-size="${size}" font-weight="800" fill="#fff">${esc(l)}</text>`).join('')}
    ${wrap(T.sub).map((l, i) => `<text x="160" y="${470 + 2 * size * 1.12 + 40 + i * 60}" font-family="${FONT}" font-size="46" font-weight="600" fill="#fff" fill-opacity="0.93">${esc(l)}</text>`).join("")}
  </svg>`
  const a = await phone(lang, '01-today', 800)
  const b = await phone(lang, '06-feed', 800)
  const icon = await sharp(ICON).resize(76, 76).png().toBuffer()
  await sharp(Buffer.from(svg)).composite([
    { input: icon, left: 160, top: 206 },
    { input: a.buf, left: 1060 - a.pad, top: 170 - a.pad },
    { input: b.buf, left: 1420 - b.pad, top: 120 - b.pad },
  ]).png({ compressionLevel: 9 }).toFile(path.join(OUT, `promo-widget-${lang}.png`))
  console.log(`  promo-widget-${lang}.png`)
}

fs.mkdirSync(OUT, { recursive: true })
for (const lang of Object.keys(PROMO)) await build(lang)
