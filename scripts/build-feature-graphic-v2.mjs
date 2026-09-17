// scripts/build-feature-graphic-v2.mjs
//
// v2 feature graphic — faktyczny screenshot apki (wycięty ze screenshots-2026-09
// bez overlay text) zamiast schematycznego phone mockup SVG.
//
// Input: store-assets/screenshots-2026-09/{lang}/01-today.png (1080×2160,
//        z 200px top overlay + 1760px phone + 200px bottom overlay)
// Extract: środkowy 1760px = czysty screen apki (880 wide po fit contain)
// Output: store-assets/feature-graphic-{lang}-2026-09-v2.png (1024×500)

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const TEXTS = {
  pl: {
    brand: 'Spokojny Rodzic',
    tagline: 'Dziennik zdrowia dziecka',
    hook: 'Wiedz co robić, gdy dziecko choruje o 3 w nocy.',
    b1: 'Obserwuj temperaturę, karmienie, sen, leki',
    b2: 'Wytyczne Polskiego Towarzystwa Pediatrycznego',
    b3: 'Analiza wzrostu + raport dla pediatry',
    b4: '14 dni Premium GRATIS',
  },
  en: {
    brand: 'Calm Parent',
    tagline: 'Baby Health Journal',
    hook: 'Know what to do when your baby is sick at 3 AM.',
    b1: 'Track temperature, feedings, sleep, meds',
    b2: 'American Academy of Pediatrics guidelines',
    b3: 'Growth analysis + doctor report',
    b4: '14-day Premium free trial',
  },
  de: {
    brand: 'Calm Parent',
    tagline: 'Baby-Tagebuch für Gesundheit',
    hook: 'Wissen, was zu tun ist, wenn das Baby nachts krank ist.',
    b1: 'Beobachte Temperatur, Mahlzeiten, Schlaf, Meds',
    b2: 'American Academy of Pediatrics Richtlinien',
    b3: 'Wachstumsanalyse + Arztbericht',
    b4: '14 Tage Premium gratis',
  },
  fr: {
    brand: 'Calm Parent',
    tagline: 'Carnet de santé bébé',
    hook: "Sachez quoi faire quand votre bébé est malade à 3h du matin.",
    b1: 'Observez température, biberons, sommeil, meds',
    b2: 'Recommandations de l\'American Academy of Pediatrics',
    b3: 'Analyse de croissance + rapport médecin',
    b4: '14 jours Premium gratuits',
  },
  es: {
    brand: 'Calm Parent',
    tagline: 'Diario de salud del bebé',
    hook: 'Sabe qué hacer cuando tu bebé enferma a las 3 de la mañana.',
    b1: 'Observa temperatura, tomas, sueño, medicamentos',
    b2: 'Pautas de la American Academy of Pediatrics',
    b3: 'Análisis de crecimiento + informe médico',
    b4: '14 días Premium gratis',
  },
}

// Layout 1024×500
const CANVAS_W = 1024
const CANVAS_H = 500
// Phone screen — prawa strona
const PHONE_H = 460  // 92% wysokości canvas
const PHONE_W = Math.round(PHONE_H * (432 / 864))  // 230 (aspect apki 1:2)
const PHONE_X = CANVAS_W - PHONE_W - 60  // 60px right padding
const PHONE_Y = Math.round((CANVAS_H - PHONE_H) / 2)  // 20

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

// SVG bez phone mockup — sam background + lewy content
function makeBgSvg(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stop-color="#F5CFC4"/>
        <stop offset="50%"  stop-color="#F0BBA9"/>
        <stop offset="100%" stop-color="#D77460"/>
      </linearGradient>
    </defs>
    <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#bg)"/>
    <circle cx="900" cy="60"  r="80" fill="#fff" opacity="0.10"/>
    <circle cx="80"  cy="440" r="60" fill="#fff" opacity="0.12"/>
    <circle cx="180" cy="70"  r="30" fill="#fff" opacity="0.14"/>

    <defs>
      <linearGradient id="trialBadge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="#FFC94A"/>
        <stop offset="100%" stop-color="#FFB020"/>
      </linearGradient>
    </defs>

    <!-- Brand + tagline + hook (przesunięte w prawo o 80px żeby zmieścić mikro-ikonę bobasa) -->
    <g transform="translate(140, 100)">
      <text x="0" y="0" font-family="-apple-system, Segoe UI, Roboto, sans-serif"
            font-size="52" font-weight="800" fill="#fff" letter-spacing="-1.5">${escapeXml(t.brand)}</text>
      <text x="0" y="40" font-family="-apple-system, sans-serif"
            font-size="22" font-weight="600" fill="#fff" opacity="0.95">${escapeXml(t.tagline)}</text>
      <text x="0" y="76" font-family="-apple-system, sans-serif"
            font-size="16" font-weight="500" fill="#fff" opacity="0.92" font-style="italic">${escapeXml(t.hook)}</text>
    </g>

    <!-- Benefits — pełna szerokość lewa (zaczyna od 60px) -->
    <g transform="translate(60, 245)">
      <g>
        <circle cx="14" cy="14" r="14" fill="#fff"/>
        <path d="M 7,14 L 12,19 L 21,10" stroke="#0F6E56" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="40" y="20" font-family="-apple-system, sans-serif" font-size="17" font-weight="600" fill="#fff">${escapeXml(t.b1)}</text>
      </g>
      <g transform="translate(0, 42)">
        <circle cx="14" cy="14" r="14" fill="#fff"/>
        <path d="M 7,14 L 12,19 L 21,10" stroke="#0F6E56" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="40" y="20" font-family="-apple-system, sans-serif" font-size="17" font-weight="600" fill="#fff">${escapeXml(t.b2)}</text>
      </g>
      <g transform="translate(0, 84)">
        <circle cx="14" cy="14" r="14" fill="#fff"/>
        <path d="M 7,14 L 12,19 L 21,10" stroke="#0F6E56" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="40" y="20" font-family="-apple-system, sans-serif" font-size="17" font-weight="600" fill="#fff">${escapeXml(t.b3)}</text>
      </g>
      <!-- Trial badge — wyróżniony gradient żółto-złoty z prezentem 🎁 -->
      <g transform="translate(-8, 122)">
        <rect x="0" y="0" width="560" height="36" rx="18" ry="18" fill="url(#trialBadge)"/>
        <text x="18" y="24" font-family="-apple-system, sans-serif" font-size="18">🎁</text>
        <text x="50" y="24" font-family="-apple-system, sans-serif" font-size="17" font-weight="800" fill="#5C3A00">${escapeXml(t.b4)}</text>
      </g>
    </g>
  </svg>`
}

// Drop shadow overlay — subtelny cień pod screen dla głębi (bez phone frame,
// nowoczesny minimalistyczny look: samplowany screen z rounded corners).
// Canvas o TE same rozmiary co całe feature graphic, żeby cień mógł wyjść
// poza sam screen bez przycinania.
function makeShadowSvg() {
  const sx = PHONE_X
  const sy = PHONE_Y
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    <defs>
      <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
        <feOffset dx="0" dy="6" result="offsetblur"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect x="${sx}" y="${sy}" width="${PHONE_W}" height="${PHONE_H}" rx="24" ry="24"
          fill="#1a1a18" opacity="0.25" filter="url(#drop)"/>
  </svg>`
}

async function buildForLocale(lang) {
  const t = TEXTS[lang]
  if (!t) { console.warn(`No texts for ${lang}, skipping`); return }

  // 1. Extract czysty screen apki z 2026-09 screenshot (środek bez overlay)
  //    Source: 1080×2160, overlay top=200, phone=1760, phone_x=100, phone_w=880
  //    v2 iter: 02-temperature (wykres trendu — USP) zamiast 01-today (dashboard)
  const rawScreenshot = path.join(ROOT, 'store-assets', 'screenshots-2026-09', lang, '02-temperature.png')
  if (!fs.existsSync(rawScreenshot)) {
    console.warn(`Missing screenshot: ${rawScreenshot}`); return
  }
  const extracted = await sharp(rawScreenshot)
    .extract({ left: 100, top: 200, width: 880, height: 1760 })
    .resize(PHONE_W, PHONE_H, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer()

  // Zaokrągl rogi ekranu tak samo jak ramka telefonu (rx=24), inaczej
  // prostokątne rogi screena wystają poza rounded corners ramki i widać
  // białe punkty tła canvas w rogach.
  const roundMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W}" height="${PHONE_H}">
       <rect x="0" y="0" width="${PHONE_W}" height="${PHONE_H}" rx="24" ry="24" fill="#fff"/>
     </svg>`
  )
  const cleanScreen = await sharp(extracted)
    .composite([{ input: roundMask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  // 2. Background SVG (lewa strona z tekstem)
  const bgSvg = Buffer.from(makeBgSvg(t))

  // 3. Shadow (rysowany UNDER screen, dla głębi)
  const shadowSvg = Buffer.from(makeShadowSvg())

  // 4. Mikro-ikona bobasa (spójność z app icon na Play Store)
  //    Terakotowe tło ikony ~zlewa się z bg feature graphic, więc bobas
  //    "wyłania się" naturalnie.
  const babyIconPath = path.join(ROOT, 'public', 'icon-512.png')
  const babyIcon = await sharp(babyIconPath).resize(70, 70).png().toBuffer()

  // 5. Composite w kolejności: bg → shadow → screen (rounded) → baby icon
  //    Bez phone frame — nowoczesny minimalistyczny look. Screen "unosi się"
  //    nad tłem dzięki cieniowi.
  const output = path.join(ROOT, 'store-assets', `feature-graphic-${lang}-2026-09-v2.png`)
  await sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: '#F0BBA9' }
  })
    .composite([
      { input: bgSvg,       top: 0, left: 0 },
      { input: shadowSvg,   top: 0, left: 0 },
      { input: cleanScreen, top: PHONE_Y, left: PHONE_X },
      { input: babyIcon,    top: 65, left: 60 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(output)

  console.log(`  ${lang}: OK → ${path.relative(ROOT, output)}`)
}

for (const lang of ['pl', 'en', 'de', 'fr', 'es']) {
  await buildForLocale(lang)
}
console.log('✅ Done — 5 feature graphics v2 with real app screenshot')
