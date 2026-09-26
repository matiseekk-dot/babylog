// scripts/build-ad-assets.mjs
//
// Materiały do kampanii Google Ads (App promotion) — PL, EN, DE, FR i ES, 2026-09.
// Źródło: prawdziwe screeny z store-assets/screenshots-2026-09/{lang}/ (wycinamy
// sam telefon spod pasków z tekstem). Wynik: store-assets/ads/{lang}/
//   image-{wariant}-landscape.png  1200×628  (1,91:1)
//   image-{wariant}-square.png     1200×1200 (1:1)
//   image-{wariant}-portrait.png   1200×1500 (4:5)
//   video-portrait.mp4             1080×1920 (9:16), ~15 s, bez dźwięku
//   video-landscape.mp4            1920×1080 (16:9)
// Filmy trzeba wgrać na YouTube (niepubliczne) i podać link w Google Ads.
//
// Run: FFMPEG_PATH=/sciezka/ffmpeg node scripts/build-ad-assets.mjs [pl en de fr es]

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = path.join(ROOT, 'store-assets', 'screenshots-2026-09')
const OUT = path.join(ROOT, 'store-assets', 'ads')
const ICON = path.join(ROOT, 'public', 'icon-512.png')
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'

// Screen w pliku sklepu: 1080×2160, telefon 880×1760 od (100, 200) — patrz
// generate-screenshots-overlay.mjs (TOP_BAND=200, PHONE_X=100).
const PHONE_CROP = { left: 100, top: 200, width: 880, height: 1760 }

const BRAND_TOP = '#B84E2E'
const BRAND_BOT = '#D77460'
const FONT = 'Segoe UI, Roboto, Arial, sans-serif'

const TEXT = {
  pl: {
    app: 'Spokojny Rodzic',
    tagline: 'Mniej stresu. Więcej spokoju.',
    cta: 'Pobierz z Google Play',
    variants: {
      fever:  { shot: '02-temperature',    head: ['Gorączka', 'o 3 w nocy?'],           sub: 'Wykres i trend na jednym ekranie' },
      shared: { shot: '07-shared-account', head: ['Jedno Premium', 'dla obojga rodziców'], sub: 'Te same wpisy na obu telefonach' },
      feed:   { shot: '06-feed',           head: ['Karmienie', 'w 2 sekundy'],           sub: 'Pierś, butelka i godzina jednym dotknięciem' },
      today:  { shot: '01-today',          head: ['Wszystko', 'w jednym miejscu'],       sub: 'Karmienie, sen i temperatura z całego dnia' },
    },
  },
  en: {
    app: 'Calm Parent',
    tagline: 'Less stress. More calm.',
    cta: 'Available on Google Play',
    variants: {
      fever:  { shot: '02-temperature',    head: ['Fever at', '3 in the morning?'],    sub: 'Chart and trend at a glance' },
      shared: { shot: '07-shared-account', head: ['One Premium for', 'both parents'],   sub: 'The same entries on both phones' },
      feed:   { shot: '06-feed',           head: ['A feeding logged', 'in 2 seconds'], sub: 'Breast, bottle and time with one tap' },
      today:  { shot: '01-today',          head: ['Everything', 'in one place'],       sub: 'Feedings, sleep and temperature for today' },
    },
  },
  fr: {
    app: 'Calm Parent',
    tagline: 'Moins de stress. Plus de sérénité.',
    cta: 'Disponible sur Google Play',
    variants: {
      fever:  { shot: '02-temperature',    head: ['Fièvre à 3 h', 'du matin ?'],        sub: 'Courbe et tendance en un coup d’œil' },
      shared: { shot: '07-shared-account', head: ['Un Premium pour', 'les deux parents'], sub: 'Les mêmes entrées sur vos deux téléphones' },
      feed:   { shot: '06-feed',           head: ['Un repas noté', 'en 2 secondes'],     sub: 'Sein, biberon et heure d’un seul appui' },
      today:  { shot: '01-today',          head: ['Tout au même', 'endroit'],            sub: 'Repas, sommeil et température du jour' },
    },
  },
  es: {
    app: 'Calm Parent',
    tagline: 'Menos estrés. Más calma.',
    cta: 'Disponible en Google Play',
    variants: {
      fever:  { shot: '02-temperature',    head: ['¿Fiebre a las', '3 de la mañana?'],  sub: 'Gráfico y tendencia de un vistazo' },
      shared: { shot: '07-shared-account', head: ['Un Premium para', 'ambos padres'],   sub: 'Los mismos registros en ambos móviles' },
      feed:   { shot: '06-feed',           head: ['Una toma anotada', 'en 2 segundos'], sub: 'Pecho, biberón y hora con un toque' },
      today:  { shot: '01-today',          head: ['Todo en', 'un solo lugar'],          sub: 'Tomas, sueño y temperatura del día' },
    },
  },
  de: {
    app: 'Calm Parent',
    tagline: 'Weniger Stress. Mehr Ruhe.',
    cta: 'Jetzt bei Google Play',
    variants: {
      fever:  { shot: '02-temperature',    head: ['Fieber um', '3 Uhr nachts?'],        sub: 'Verlauf und Trend auf einen Blick' },
      shared: { shot: '07-shared-account', head: ['Ein Premium für', 'beide Eltern'],     sub: 'Dieselben Einträge auf beiden Handys' },
      feed:   { shot: '06-feed',           head: ['Mahlzeit erfasst', 'in 2 Sekunden'],   sub: 'Brust, Flasche und Uhrzeit mit einem Tipp' },
      today:  { shot: '01-today',          head: ['Alles an', 'einem Ort'],              sub: 'Mahlzeiten, Schlaf und Temperatur von heute' },
    },
  },
}

const IMAGE_VARIANTS = ['shared', 'fever', 'feed']
const VIDEO_SCENES = ['fever', 'shared', 'feed', 'today']

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function background(w, h) {
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${BRAND_TOP}"/><stop offset="100%" stop-color="${BRAND_BOT}"/>
  </linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`
}

function textLines({ x, y, lines, size, weight = 800, anchor = 'start', lineHeight = 1.15, opacity = 1 }) {
  return lines.map((line, i) => `<text x="${x}" y="${y + i * size * lineHeight}" font-family="${FONT}"
    font-size="${size}" font-weight="${weight}" fill="#fff" fill-opacity="${opacity}" text-anchor="${anchor}">${esc(line)}</text>`).join('')
}

// Telefon: wycięty screen, zaokrąglone rogi, cień pod spodem.
async function phone(lang, shot, height) {
  const width = Math.round(height / 2)
  const radius = Math.round(width * 0.06)
  const src = path.join(SHOTS, lang, `${shot}.png`)
  const screen = await sharp(src).extract(PHONE_CROP).resize(width, height).png().toBuffer()
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`)
  const rounded = await sharp(screen).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  const pad = 40
  const shadow = await sharp(Buffer.from(`<svg width="${width + pad * 2}" height="${height + pad * 2}">
      <rect x="${pad}" y="${pad + 10}" width="${width}" height="${height}" rx="${radius}" fill="#000" fill-opacity="0.35"/></svg>`))
    .blur(18).png().toBuffer()
  return sharp(shadow).composite([{ input: rounded, left: pad, top: pad }]).png().toBuffer()
    .then(buf => ({ buf, width: width + pad * 2, height: height + pad * 2, pad }))
}

async function icon(size) {
  return sharp(ICON).resize(size, size).png().toBuffer()
}

// Wspólny kompozytor: tło + tekst (SVG) + telefon + ikona.
async function compose({ w, h, svgBody, phoneImg, phoneX, phoneY, iconSize, iconX, iconY, file }) {
  const layers = [{ input: Buffer.from(`<svg width="${w}" height="${h}">${background(w, h)}${svgBody}</svg>`), left: 0, top: 0 }]
  if (phoneImg) layers.push({ input: phoneImg.buf, left: phoneX - phoneImg.pad, top: phoneY - phoneImg.pad })
  if (iconSize) layers.push({ input: await icon(iconSize), left: iconX, top: iconY })
  await sharp({ create: { width: w, height: h, channels: 4, background: BRAND_TOP } })
    .composite(layers).png({ compressionLevel: 9 }).toFile(file)
}

function brandRow(x, y, app, size = 30) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#fff">${esc(app)}</text>`
}

async function images(lang) {
  const T = TEXT[lang]
  const dir = path.join(OUT, lang)
  for (const id of IMAGE_VARIANTS) {
    const v = T.variants[id]

    // 1200×628 — tekst po lewej, telefon po prawej
    await compose({
      w: 1200, h: 628, file: path.join(dir, `image-${id}-landscape.png`),
      svgBody: textLines({ x: 70, y: 210, lines: v.head, size: 60 })
        + textLines({ x: 70, y: 370, lines: [v.sub], size: 27, weight: 600, opacity: 0.92 })
        + brandRow(140, 555, T.app),
      // telefon + cień (2×40 px) musi się zmieścić w 628 px wysokości
      phoneImg: await phone(lang, v.shot, 540), phoneX: 860, phoneY: 44,
      iconSize: 56, iconX: 70, iconY: 514,
    })

    // 1200×1200 — marka u góry, nagłówek, telefon pod spodem
    await compose({
      w: 1200, h: 1200, file: path.join(dir, `image-${id}-square.png`),
      svgBody: brandRow(130, 88, T.app, 34)
        + textLines({ x: 600, y: 200, lines: v.head, size: 70, anchor: 'middle' })
        + textLines({ x: 600, y: 350, lines: [v.sub], size: 32, weight: 600, anchor: 'middle', opacity: 0.92 }),
      phoneImg: await phone(lang, v.shot, 740), phoneX: 600 - 185, phoneY: 400,
      iconSize: 56, iconX: 60, iconY: 46,
    })

    // 1200×1500 — jak kwadrat, większy telefon
    await compose({
      w: 1200, h: 1500, file: path.join(dir, `image-${id}-portrait.png`),
      svgBody: brandRow(136, 100, T.app, 36)
        + textLines({ x: 600, y: 235, lines: v.head, size: 80, anchor: 'middle' })
        + textLines({ x: 600, y: 405, lines: [v.sub], size: 36, weight: 600, anchor: 'middle', opacity: 0.92 }),
      phoneImg: await phone(lang, v.shot, 1000), phoneX: 600 - 250, phoneY: 460,
      iconSize: 60, iconX: 60, iconY: 55,
    })
    console.log(`  [${lang}] image-${id}-{landscape,square,portrait}.png`)
  }
}

// Klatki filmu (statyczne slajdy) → ffmpeg z przejściami xfade.
async function videoFrames(lang, orientation, tmp) {
  const T = TEXT[lang]
  const portrait = orientation === 'portrait'
  const [w, h] = portrait ? [1080, 1920] : [1920, 1080]
  const files = []
  for (const id of VIDEO_SCENES) {
    const v = T.variants[id]
    const file = path.join(tmp, `${lang}-${orientation}-${id}.png`)
    if (portrait) {
      await compose({
        w, h, file,
        svgBody: brandRow(150, 118, T.app, 40)
          + textLines({ x: 540, y: 290, lines: v.head, size: 86, anchor: 'middle' })
          + textLines({ x: 540, y: 480, lines: [v.sub], size: 38, weight: 600, anchor: 'middle', opacity: 0.92 }),
        phoneImg: await phone(lang, v.shot, 1300), phoneX: 540 - 325, phoneY: 560,
        iconSize: 72, iconX: 64, iconY: 68,
      })
    } else {
      await compose({
        w, h, file,
        svgBody: textLines({ x: 120, y: 420, lines: v.head, size: 96 })
          + textLines({ x: 120, y: 660, lines: [v.sub], size: 42, weight: 600, opacity: 0.92 })
          + brandRow(215, 960, T.app, 44),
        phoneImg: await phone(lang, v.shot, 960), phoneX: 1300, phoneY: 60,
        iconSize: 80, iconX: 120, iconY: 900,
      })
    }
    files.push(file)
  }
  // Karta końcowa: ikona, nazwa, hasło, gdzie pobrać.
  const end = path.join(tmp, `${lang}-${orientation}-end.png`)
  const iconSize = portrait ? 300 : 260
  const cx = w / 2
  const iconY = portrait ? 560 : 170
  await compose({
    w, h, file: end,
    svgBody: textLines({ x: cx, y: iconY + iconSize + 130, lines: [T.app], size: portrait ? 96 : 88, anchor: 'middle' })
      + textLines({ x: cx, y: iconY + iconSize + 220, lines: [T.tagline], size: portrait ? 44 : 42, weight: 600, anchor: 'middle', opacity: 0.95 })
      + textLines({ x: cx, y: iconY + iconSize + 320, lines: [T.cta], size: portrait ? 40 : 38, weight: 700, anchor: 'middle', opacity: 0.85 }),
    iconSize, iconX: Math.round(cx - iconSize / 2), iconY,
  })
  files.push(end)
  return { files, w, h }
}

function encode({ files, w, h }, out) {
  const SLIDE = 3.2
  const FADE = 0.5
  const args = ['-y']
  files.forEach(f => args.push('-loop', '1', '-t', String(SLIDE), '-i', f))
  let chain = ''
  let last = '[0:v]'
  for (let i = 1; i < files.length; i++) {
    const label = `[v${i}]`
    const offset = (i * (SLIDE - FADE)).toFixed(2)
    chain += `${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset}${label};`
    last = label
  }
  chain += `${last}scale=${w}:${h},format=yuv420p[out]`
  args.push('-filter_complex', chain, '-map', '[out]', '-r', '30',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', out)
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] })
}

async function main() {
  const langs = process.argv.slice(2).filter(l => TEXT[l])
  for (const lang of (langs.length ? langs : Object.keys(TEXT))) {
    const dir = path.join(OUT, lang)
    const tmp = path.join(OUT, '.tmp', lang)
    fs.mkdirSync(dir, { recursive: true })
    fs.mkdirSync(tmp, { recursive: true })
    await images(lang)
    for (const orientation of ['portrait', 'landscape']) {
      const frames = await videoFrames(lang, orientation, tmp)
      const out = path.join(dir, `video-${orientation}.mp4`)
      encode(frames, out)
      console.log(`  [${lang}] video-${orientation}.mp4 (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`)
    }
  }
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
