/**
 * Generuje 8 mockup scen TikToka jako PNG (1080×1920) + animowany GIF preview.
 *
 * Uruchom: node marketing/tiktok-3am-fever/generate-scenes.mjs
 */

import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const OUT_DIR = join(__dirname, 'scenes')
const APP_SHOTS = join(ROOT, 'store-assets', 'screenshots-2026-05', 'pl')

mkdirSync(OUT_DIR, { recursive: true })

const W = 1080, H = 1920

// Brand colors
const C = {
  bgDark: '#0A0E14',
  bgWarm: '#1A1410',
  text: '#FFFFFF',
  textMuted: '#A0A8B0',
  brand: '#D77460',
  yellow: '#F5B847',
  green: '#3DB37D',
  red: '#E55A4B',
}

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/'/g,'&apos;')

function multiline(text, x, y, lineHeight, attrs) {
  return text.split('\n').map((line, i) =>
    `<text x="${x}" y="${y + i*lineHeight}" ${attrs}>${esc(line)}</text>`
  ).join('\n')
}

// Wrap long text
function wrapText(text, x, y, maxChars, fontSize, lineHeight, color, anchor='middle') {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w }
    else cur += ' ' + w
  }
  if (cur.trim()) lines.push(cur.trim())
  return lines.map((l, i) =>
    `<text x="${x}" y="${y + i*lineHeight}" text-anchor="${anchor}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${color}">${esc(l)}</text>`
  ).join('\n')
}

// ─── Scene 1: 3am hook ──────────────────────────────────────────────────────
function scene1() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.bgDark}"/>
    <!-- Phone mockup on bedside -->
    <rect x="280" y="640" width="520" height="900" rx="48" fill="#1F242C" stroke="#000" stroke-width="2"/>
    <rect x="294" y="654" width="492" height="872" rx="36" fill="${C.bgDark}"/>
    <!-- Big clock -->
    <text x="${W/2}" y="1100" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="200" font-weight="800" fill="${C.text}">03:14</text>
    <text x="${W/2}" y="1180" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" fill="${C.textMuted}">środa</text>
    <!-- Hook text top -->
    ${wrapText('Twoje dziecko ma 38,9°C o 3 rano.', W/2, 220, 22, 76, 100, C.text)}
    <!-- Crying emoji -->
    <text x="${W/2}" y="1700" text-anchor="middle" font-size="120">😭</text>
  </svg>`
}

// ─── Scene 2: Google panic ──────────────────────────────────────────────────
function scene2() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.bgWarm}"/>
    <!-- Top text -->
    ${wrapText('Google o 3am = większa panika', W/2, 200, 26, 76, 100, C.text)}
    <!-- Browser mockup -->
    <rect x="60" y="500" width="960" height="1300" rx="20" fill="#1A1A1A"/>
    <!-- Address bar -->
    <rect x="100" y="540" width="880" height="80" rx="40" fill="#2A2A2A"/>
    <text x="140" y="592" font-family="monospace" font-size="32" fill="#999">🔍 gorączka 38.9 niemowlę co robić</text>
    <!-- Search results (chaos) -->
    <g font-family="Arial, sans-serif" fill="${C.text}">
      <text x="120" y="700" font-size="34" font-weight="600">forum.gazeta.pl › ...</text>
      <text x="120" y="745" font-size="28" fill="${C.textMuted}">"daj zaraz paracetamol i jedź na SOR!!"</text>

      <text x="120" y="840" font-size="34" font-weight="600">babyhelp.pl › fora › ...</text>
      <text x="120" y="885" font-size="28" fill="${C.textMuted}">"NIE dawaj nic, gorączka to dobra rzecz"</text>

      <text x="120" y="980" font-size="34" font-weight="600">medonet.pl › artykuł</text>
      <text x="120" y="1025" font-size="28" fill="${C.textMuted}">"38.9°C u dziecka — TYCH RZECZY NIE rób..."</text>

      <text x="120" y="1120" font-size="34" font-weight="600">pediatra-online › blog</text>
      <text x="120" y="1165" font-size="28" fill="${C.textMuted}">"Czytaj 47 minut zanim podasz..."</text>

      <!-- Red panic overlay text -->
      <text x="${W/2}" y="1400" text-anchor="middle" font-size="120" fill="${C.red}" font-weight="800">😰</text>
      <text x="${W/2}" y="1550" text-anchor="middle" font-size="56" fill="${C.red}" font-weight="800">SPRZECZNE</text>
      <text x="${W/2}" y="1620" text-anchor="middle" font-size="56" fill="${C.red}" font-weight="800">PORADY</text>
    </g>
  </svg>`
}

// ─── Scene 3: Switch to app ─────────────────────────────────────────────────
function scene3() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C.bgDark}"/>
    ${wrapText('Otwierasz Spokojny Rodzic', W/2, 220, 24, 78, 100, C.text)}
    <!-- Phone homescreen with app icon highlighted -->
    <g transform="translate(220, 500)">
      <rect width="640" height="1280" rx="50" fill="#1F242C"/>
      <rect x="14" y="14" width="612" height="1252" rx="38" fill="${C.bgDark}"/>
      <!-- Grid of apps -->
      <g>
        <!-- Row 1 -->
        <rect x="80" y="80" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <rect x="220" y="80" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <rect x="360" y="80" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <rect x="500" y="80" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <!-- Row 2 — Spokojny Rodzic HIGHLIGHTED -->
        <rect x="80" y="240" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <rect x="220" y="240" width="120" height="120" rx="28" fill="${C.brand}" stroke="#FFF" stroke-width="4"/>
        <text x="280" y="320" text-anchor="middle" font-size="74">🍼</text>
        <rect x="360" y="240" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <rect x="500" y="240" width="120" height="120" rx="28" fill="#3A3A3A"/>
        <!-- Glow around app -->
        <circle cx="280" cy="300" r="100" fill="none" stroke="${C.yellow}" stroke-width="3" opacity="0.6"/>
        <circle cx="280" cy="300" r="120" fill="none" stroke="${C.yellow}" stroke-width="2" opacity="0.3"/>
        <text x="280" y="420" text-anchor="middle" font-size="24" font-weight="700" fill="${C.text}">Spokojny Rodzic</text>
      </g>
    </g>
    <!-- Finger tap indicator -->
    <text x="${W/2 + 80}" y="950" font-size="180">👆</text>
  </svg>`
}

// ─── Scene 4: Enter temperature ─────────────────────────────────────────────
function scene4() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#FFF8F4"/>
    ${wrapText('Wpisz temperaturę', W/2, 200, 18, 78, 100, '#1F1F1F')}
    <!-- Phone -->
    <g transform="translate(160, 460)">
      <rect width="760" height="1340" rx="48" fill="#0F1620"/>
      <rect x="16" y="16" width="728" height="1308" rx="36" fill="#FFFFFF"/>
      <!-- Title -->
      <text x="380" y="120" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" fill="#1F1F1F">🌡️ Temperatura</text>
      <!-- Input -->
      <rect x="100" y="200" width="560" height="200" rx="20" fill="#FBE8DC"/>
      <text x="380" y="340" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="140" font-weight="800" fill="${C.red}">38,9°C</text>
      <!-- Method -->
      <rect x="100" y="440" width="560" height="80" rx="14" fill="white" stroke="#EEE"/>
      <text x="380" y="490" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="#5a5a56">Pod pachą · teraz</text>
      <!-- Save button -->
      <rect x="100" y="580" width="560" height="100" rx="50" fill="${C.brand}"/>
      <text x="380" y="640" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="700" fill="white">Zapisz</text>
      <!-- Recent history list -->
      <text x="100" y="780" font-family="Inter, Arial, sans-serif" font-size="28" fill="#5a5a56">Ostatnie pomiary</text>
      <line x1="100" y1="800" x2="660" y2="800" stroke="#EEE"/>
      <g font-family="Inter, Arial, sans-serif" font-size="26" fill="#1F1F1F">
        <text x="120" y="870">17:30</text>
        <text x="240" y="870" font-weight="700" fill="${C.red}">37,6°C</text>
        <text x="120" y="930">13:00</text>
        <text x="240" y="930" font-weight="700" fill="${C.yellow}">37,4°C</text>
        <text x="120" y="990">09:00</text>
        <text x="240" y="990" font-weight="600">37,2°C</text>
      </g>
    </g>
    <!-- Finger tap on Save -->
    <text x="540" y="1140" font-size="160">👆</text>
  </svg>`
}

// ─── Scene 5: DGKJ Magic Moment ────────────────────────────────────────────
function scene5() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#FFF8F4"/>
    ${wrapText('Apka mówi co robić.', W/2, 160, 30, 64, 80, '#1F1F1F')}
    ${wrapText('Bez googlowania.', W/2, 250, 30, 64, 80, C.brand)}
    <!-- Big alert card -->
    <g transform="translate(80, 440)">
      <rect width="920" height="1320" rx="32" fill="white" stroke="${C.yellow}" stroke-width="6"/>
      <!-- Warning header -->
      <rect width="920" height="140" rx="32" fill="${C.yellow}"/>
      <text x="460" y="95" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="800" fill="white">⚠️ Uwaga</text>

      <!-- Temperature display -->
      <text x="460" y="240" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" fill="#1F1F1F">38,9°C</text>
      <text x="460" y="290" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" fill="#5a5a56">u dziecka 8 mies.</text>

      <!-- Action items -->
      <g font-family="Inter, Arial, sans-serif" font-size="36" fill="#1F1F1F">
        <circle cx="100" cy="430" r="24" fill="${C.yellow}"/>
        <text x="100" y="442" text-anchor="middle" font-size="26" font-weight="700" fill="white">1</text>
        <text x="160" y="445" font-weight="600">Wskazana konsultacja</text>
        <text x="160" y="492" font-weight="600">pediatry</text>

        <circle cx="100" cy="580" r="24" fill="${C.yellow}"/>
        <text x="100" y="592" text-anchor="middle" font-size="26" font-weight="700" fill="white">2</text>
        <text x="160" y="595" font-weight="600">Obserwacja co 2 godziny</text>

        <circle cx="100" cy="730" r="24" fill="${C.yellow}"/>
        <text x="100" y="742" text-anchor="middle" font-size="26" font-weight="700" fill="white">3</text>
        <text x="160" y="745" font-weight="600">Można podać Paracetamol</text>
        <text x="160" y="792" font-size="28" fill="#5a5a56">(według ulotki ChPL)</text>
      </g>

      <!-- Traffic lights -->
      <g transform="translate(0, 880)">
        <text x="460" y="40" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" fill="#5a5a56">Skala oceny</text>
        <circle cx="280" cy="120" r="50" fill="${C.green}" opacity="0.25"/>
        <circle cx="460" cy="120" r="60" fill="${C.yellow}"/>
        <text x="460" y="138" text-anchor="middle" font-size="48" font-weight="800" fill="white">!</text>
        <circle cx="640" cy="120" r="50" fill="${C.red}" opacity="0.25"/>
        <text x="280" y="220" text-anchor="middle" font-size="24" fill="#5a5a56">obserwuj</text>
        <text x="460" y="220" text-anchor="middle" font-size="26" fill="${C.yellow}" font-weight="700">konsultacja</text>
        <text x="640" y="220" text-anchor="middle" font-size="24" fill="#5a5a56">112</text>
      </g>

      <!-- Source -->
      <rect x="40" y="1200" width="840" height="80" rx="40" fill="#FBE8DC"/>
      <text x="460" y="1252" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="${C.brand}" font-weight="600">📚 Źródło: KOMPAS GORĄCZKA · ChPL</text>
    </g>
  </svg>`
}

// ─── Scene 6: Relief ───────────────────────────────────────────────────────
function scene6() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A1410"/>
        <stop offset="100%" stop-color="#2D2419"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#warm)"/>

    <!-- Soft glow -->
    <circle cx="${W/2}" cy="${H/2}" r="500" fill="${C.brand}" opacity="0.1"/>

    <!-- Sleeping baby emoji centerpiece -->
    <text x="${W/2}" y="900" text-anchor="middle" font-size="500">😴</text>

    <!-- Soft text -->
    ${wrapText('Spokój.', W/2, 1100, 12, 110, 130, C.text)}
    ${wrapText('Bez paniki.', W/2, 1280, 12, 90, 110, C.textMuted)}
    ${wrapText('Plan.', W/2, 1420, 12, 90, 110, C.brand)}

    <!-- Stars / night -->
    <text x="180" y="400" font-size="60" opacity="0.6">✨</text>
    <text x="900" y="500" font-size="50" opacity="0.5">⭐</text>
    <text x="${W-200}" y="350" font-size="70" opacity="0.7">🌙</text>
  </svg>`
}

// ─── Scene 7: Trust signals ────────────────────────────────────────────────
function scene7() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>

    ${wrapText('Wytyczne medyczne.', W/2, 180, 18, 70, 90, '#1F1F1F')}
    ${wrapText('RGPD. Bez reklam.', W/2, 280, 18, 70, 90, C.brand)}

    <!-- Badges grid -->
    <g transform="translate(80, 450)">
      <!-- Row 1 -->
      <rect x="0" y="0" width="440" height="200" rx="20" fill="#E8F4E8" stroke="${C.green}" stroke-width="3"/>
      <text x="220" y="80" text-anchor="middle" font-size="80">🛡️</text>
      <text x="220" y="160" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" fill="#1F1F1F">RGPD</text>

      <rect x="480" y="0" width="440" height="200" rx="20" fill="#FBE8DC" stroke="${C.brand}" stroke-width="3"/>
      <text x="700" y="80" text-anchor="middle" font-size="80">🇪🇺</text>
      <text x="700" y="160" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#1F1F1F">Serwery EU</text>

      <!-- Row 2 -->
      <rect x="0" y="240" width="440" height="200" rx="20" fill="#FFF1E8" stroke="${C.yellow}" stroke-width="3"/>
      <text x="220" y="320" text-anchor="middle" font-size="80">🚫</text>
      <text x="220" y="400" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#1F1F1F">Bez reklam</text>

      <rect x="480" y="240" width="440" height="200" rx="20" fill="#E3EEFB" stroke="#4A90E2" stroke-width="3"/>
      <text x="700" y="320" text-anchor="middle" font-size="80">📴</text>
      <text x="700" y="400" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#1F1F1F">Działa offline</text>

      <!-- Row 3 -->
      <rect x="0" y="480" width="440" height="200" rx="20" fill="#F0E8FB" stroke="#7C4ADB" stroke-width="3"/>
      <text x="220" y="560" text-anchor="middle" font-size="80">📚</text>
      <text x="220" y="640" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#1F1F1F">PSO · DGKJ · CAV-AEP</text>

      <rect x="480" y="480" width="440" height="200" rx="20" fill="#FCE8EC" stroke="#E55A4B" stroke-width="3"/>
      <text x="700" y="560" text-anchor="middle" font-size="80">5️⃣</text>
      <text x="700" y="640" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#1F1F1F">Pięć języków</text>
    </g>

    <!-- Flags row -->
    <g transform="translate(0, 1330)">
      <text x="${W/2}" y="0" text-anchor="middle" font-size="80">🇵🇱  🇬🇧  🇩🇪  🇫🇷  🇪🇸</text>
    </g>
  </svg>`
}

// ─── Scene 8: CTA ──────────────────────────────────────────────────────────
function scene8() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FBE8DC"/>
        <stop offset="100%" stop-color="#FFF8F4"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Big logo circle -->
    <circle cx="${W/2}" cy="800" r="240" fill="${C.brand}"/>
    <text x="${W/2}" y="880" text-anchor="middle" font-size="280">🍼</text>

    <!-- Brand -->
    ${wrapText('Spokojny Rodzic', W/2, 1200, 16, 100, 110, '#1F1F1F')}
    ${wrapText('Aplikacja dla rodziców', W/2, 1320, 28, 44, 56, '#5a5a56')}

    <!-- CTA -->
    <rect x="180" y="1500" width="720" height="180" rx="90" fill="#1F1F1F"/>
    <text x="${W/2}" y="1610" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800" fill="white">▶ Google Play</text>

    <!-- 7 days free badge -->
    <rect x="280" y="1730" width="520" height="100" rx="50" fill="${C.green}"/>
    <text x="${W/2}" y="1795" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="700" fill="white">7 dni Premium GRATIS</text>
  </svg>`
}

// ─── Generate all scenes ────────────────────────────────────────────────────

const scenes = [
  ['01-hook', scene1()],
  ['02-google-panic', scene2()],
  ['03-open-app', scene3()],
  ['04-enter-temp', scene4()],
  ['05-dgkj-card', scene5()],
  ['06-relief', scene6()],
  ['07-trust-signals', scene7()],
  ['08-cta', scene8()],
]

console.log('Generating 8 TikTok scene mockups (1080×1920)...\n')

for (const [name, svg] of scenes) {
  const out = join(OUT_DIR, `${name}.png`)
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${name}.png`)
}

// ─── Stitch into animated GIF preview ────────────────────────────────────
//
// Sharp może łączyć obrazy w animowany WebP. Każda klatka 3 sek.
// To NIE jest TikTok-ready MP4 — to preview konceptu dla użytkownika.

console.log('\nGenerating animated WebP preview...')

const frames = []
for (const [name] of scenes) {
  const buf = await sharp(join(OUT_DIR, `${name}.png`)).resize(540, 960).toBuffer()
  frames.push(buf)
}

// Stack frames vertically as a single tall image, then sharp can convert to animated WebP.
// Actually sharp's animated input/output is via raw multi-frame approach. Easiest:
// use loop of single frames into single animated WebP.

const W2 = 540, H2 = 960
const composite = await sharp({
  create: { width: W2, height: H2 * scenes.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } }
})
.composite(frames.map((buf, i) => ({ input: buf, top: i * H2, left: 0 })))
.png()
.toBuffer()

// Now convert to animated WebP with each frame being a slice
await sharp(composite, { animated: true, pages: scenes.length, pageHeight: H2 })
  .webp({ quality: 80, loop: 0, delay: 3000 })
  .toFile(join(__dirname, 'preview.webp'))

console.log(`✓ preview.webp (animated, 8 frames × 3s)`)
console.log(`\n📁 Output: ${OUT_DIR}`)
console.log(`📁 Preview: ${join(__dirname, 'preview.webp')}`)
