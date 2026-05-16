/**
 * Tworzy contact sheet — wszystkie 8 scen w jednym PNG (4 kolumny × 2 wiersze).
 * Do szybkiego podglądu konceptu i udostępniania.
 */

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCENES_DIR = join(__dirname, 'scenes')

const COLS = 4
const ROWS = 2
const TILE_W = 540   // each scene scaled to 540×960 (50%)
const TILE_H = 960
const GAP = 20
const PADDING = 40
const HEADER_H = 100

const sheetW = COLS * TILE_W + (COLS - 1) * GAP + 2 * PADDING
const sheetH = HEADER_H + ROWS * TILE_H + (ROWS - 1) * GAP + 2 * PADDING

const scenes = [
  '01-hook', '02-google-panic', '03-open-app', '04-enter-temp',
  '05-dgkj-card', '06-relief', '07-trust-signals', '08-cta',
]

// Title overlay
const titleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${HEADER_H}">
  <rect width="${sheetW}" height="${HEADER_H}" fill="#1F1F1F"/>
  <text x="${sheetW/2}" y="68" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800" fill="white">TikTok storyboard: "3am Fever Panic" · Spokojny Rodzic</text>
</svg>`

const composite = []

// Header
composite.push({
  input: Buffer.from(titleSvg),
  top: 0,
  left: 0,
})

// Scenes
for (let i = 0; i < scenes.length; i++) {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const x = PADDING + col * (TILE_W + GAP)
  const y = HEADER_H + PADDING + row * (TILE_H + GAP)

  const scene = scenes[i]
  const img = await sharp(join(SCENES_DIR, `${scene}.png`))
    .resize(TILE_W, TILE_H)
    .toBuffer()

  composite.push({ input: img, top: y, left: x })

  // Scene label below
  const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="50">
    <rect width="${TILE_W}" height="50" fill="rgba(0,0,0,0.85)"/>
    <text x="${TILE_W/2}" y="34" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="white">${i+1}. ${scene.replace(/^\d+-/, '').replace(/-/g, ' ')}</text>
  </svg>`
  composite.push({
    input: Buffer.from(labelSvg),
    top: y + TILE_H - 50,
    left: x,
  })
}

await sharp({
  create: {
    width: sheetW,
    height: sheetH,
    channels: 4,
    background: { r: 245, g: 245, b: 245, alpha: 1 },
  },
})
.composite(composite)
.png({ compressionLevel: 9 })
.toFile(join(__dirname, 'preview-contact-sheet.png'))

console.log(`✓ preview-contact-sheet.png (${sheetW}×${sheetH})`)
