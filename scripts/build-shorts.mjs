// scripts/build-shorts.mjs
//
// Krótkie filmy edukacyjne na YouTube Shorts / Reels / TikTok (2026-09).
// Same napisy, bez głosu i bez muzyki (muzykę dodaje się w aplikacji YouTube
// przy wrzucaniu). Treść pochodzi z danych, które już są w apce:
// src/data/referenceTables.js (progi gorączki, objawy alarmowe),
// feedingNorms.js, sleepNorms.js, dailyTips.js. Nie dopisujemy własnych porad.
//
// Klatki renderuje Chrome (HTML → PNG 1080×1920), ffmpeg skleja je z krótkimi
// przejściami. Tekst trzymamy w "bezpiecznej strefie" Shorts: z prawej są
// przyciski (polubienia, komentarze), na dole tytuł i opis filmu.
//
// Wynik: store-assets/shorts/{lang}/{slug}.mp4 i {slug}-cover.png
// Run: FFMPEG_PATH=/sciezka/ffmpeg node scripts/build-shorts.mjs [pl] [slug...]

import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = path.join(ROOT, 'store-assets', 'screenshots-2026-09')
const OUT = path.join(ROOT, 'store-assets', 'shorts')
const ICON = path.join(ROOT, 'public', 'icon-512.png')
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'

const W = 1080
const H = 1920
const FADE = 0.22
// Telefon w screenie sklepu (patrz build-ad-assets.mjs).
const PHONE_CROP = { left: 100, top: 200, width: 880, height: 1760 }

const COMMON = {
  pl: {
    app: 'Spokojny Rodzic',
    cta: 'Pobierz z Google Play',
    tagline: 'Dziennik niemowlaka dla obojga rodziców',
    sourceLabel: 'Źródło',
    sourcesLabel: 'Źródła',
  },
}

// Typy klatek: hook, card, list (odsłanianie po jednym), note, source, end.
// dur = ile sekund klatka jest widoczna.
const VIDEOS = {
  pl: [
    {
      slug: '01-goraczka-kiedy-do-lekarza',
      frames: [
        { type: 'hook', kicker: 'Zapisz, przyda się w nocy', title: 'Gorączka u niemowlaka. Kiedy do lekarza?', sub: 'Progi z wytycznych pediatrów', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u niemowlaka', label: 'Poniżej 3 miesięcy', value: 'od 38,0°C', action: 'Pilnie do lekarza, nawet w nocy', tone: 'urgent', dur: 3.0 },
        { type: 'card', kicker: 'Gorączka u niemowlaka', label: '3 do 6 miesięcy', value: 'od 38,0°C', action: 'Skontaktuj się z pediatrą', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u dziecka', label: 'Powyżej 6 miesięcy', value: 'od 39,0°C', action: 'Skontaktuj się z pediatrą', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u dziecka', label: 'W każdym wieku', value: 'od 40,5°C', action: 'Pilna pomoc lekarska', tone: 'urgent', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u dziecka', label: 'Gorączka trwa', value: 'ponad 72 h', action: 'Skontaktuj się z pediatrą', foot: 'dziecko powyżej 6 miesięcy', tone: 'consult', dur: 3.0 },
        { type: 'source', plural: false, text: 'KOMPAS GORĄCZKA, Polskie Towarzystwo Pediatryczne', disclaimer: 'Ten film nie zastępuje lekarza. Gdy coś Cię niepokoi, dzwoń do lekarza lub pod 112.', dur: 3.4 },
        { type: 'end', shot: '01-today', headline: 'Progi i pomiary masz zawsze pod ręką', dur: 3.4 },
      ],
    },
    {
      slug: '02-ile-razy-je-niemowle',
      frames: [
        { type: 'hook', kicker: 'Karmienie niemowlaka', title: 'Ile razy na dobę je niemowlę?', sub: 'Typowe zakresy według wieku', dur: 2.4 },
        { type: 'list', heading: 'Karmienia na dobę', pairs: true, items: [['0-1 mies.', '8-12 razy'], ['2-3 mies.', '7-9 razy'], ['4-6 mies.', '5-7 razy'], ['7-12 mies.', '4-6 razy']], durs: [1.7, 1.7, 1.7, 2.8] },
        { type: 'note', emoji: '🍼', text: 'To zakresy, nie norma.', sub: 'Karmienie na żądanie to standard według American Academy of Pediatrics.', dur: 3.2 },
        { type: 'note', emoji: '🤱', text: 'Noworodek je zwykle co 2-3 godziny.', sub: 'Każde dziecko ma swój rytm.', dur: 2.6 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, WHO, ESPGHAN', disclaimer: 'Ten film nie zastępuje lekarza ani doradcy laktacyjnego. Wątpliwości omów z pediatrą.', dur: 3.2 },
        { type: 'end', shot: '06-feed', headline: 'Karmienie zapiszesz jednym dotknięciem', dur: 3.4 },
      ],
    },
    {
      slug: '03-mokre-pieluchy',
      frames: [
        { type: 'hook', kicker: 'Pieluchy', title: 'Ile mokrych pieluch to dobry znak?', sub: 'Prosty sygnał, że maluch nie jest odwodniony', dur: 2.6 },
        { type: 'card', kicker: 'Mokre pieluchy', label: 'Od około 5. doby życia', value: '6 i więcej', action: 'mokrych pieluch na dobę', tone: 'good', dur: 3.0 },
        { type: 'note', emoji: '💧', text: 'Mniej niż 6 mokrych pieluch może oznaczać odwodnienie.', dur: 2.8 },
        { type: 'list', heading: 'Sygnały odwodnienia', items: ['Sucha pielucha ponad 6 godzin', 'Płacz bez łez', 'Zapadnięte ciemiączko'], durs: [1.8, 1.8, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Wtedy skontaktuj się z lekarzem.', sub: 'Szczególnie u niemowlęcia.', dur: 2.4 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, Polskie Towarzystwo Pediatryczne', disclaimer: 'Ten film nie zastępuje lekarza.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Pieluchy z całego dnia policzą się same', dur: 3.4 },
      ],
    },
    {
      slug: '04-ile-spi-niemowle',
      frames: [
        { type: 'hook', kicker: 'Sen niemowlaka', title: 'Ile powinno spać niemowlę?', sub: 'Łącznie z drzemkami, w ciągu doby', dur: 2.4 },
        { type: 'list', heading: 'Sen na dobę', pairs: true, items: [['0-3 mies.', '14-17 h'], ['4-11 mies.', '12-15 h'], ['1-2 lata', '11-14 h']], durs: [1.8, 1.8, 2.8] },
        { type: 'note', emoji: '🌙', text: 'Noworodek budzi się co 1-3 godziny.', sub: 'To normalne, nie problem ze snem.', dur: 2.6 },
        { type: 'note', emoji: '💤', text: 'Około 4. miesiąca sen często się psuje.', sub: 'To skok rozwojowy mózgu, nie Twój błąd.', dur: 3.0 },
        { type: 'source', plural: true, text: 'National Sleep Foundation, American Academy of Pediatrics', disclaimer: 'Każde dziecko śpi inaczej. To zakresy, nie norma.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Sen z całego dnia zsumuje się sam', dur: 3.4 },
      ],
    },
    {
      slug: '05-objawy-alarmowe',
      frames: [
        { type: 'hook', kicker: 'Zapisz, oby się nie przydało', title: '5 objawów, z którymi nie czekasz do rana', sub: 'Według wytycznych pediatrów', dur: 2.6 },
        { type: 'list', heading: 'Nie czekaj, gdy widzisz:', numbered: true, items: [
          'Gorączka od 38°C u niemowlęcia poniżej 3 miesięcy',
          'Apatia, trudność z wybudzeniem, brak reakcji',
          'Trudności w oddychaniu, sine usta',
          'Drgawki lub sztywność karku',
          'Plamy, które nie bledną przy ucisku',
        ], durs: [2.1, 2.0, 1.9, 1.8, 2.8] },
        { type: 'note', emoji: '🚨', text: 'Pilna pomoc: SOR lub 112', sub: 'Lepiej sprawdzić o jeden raz za dużo.', tone: 'urgent', dur: 2.8 },
        { type: 'source', plural: true, text: 'KOMPAS GORĄCZKA (Polskie Towarzystwo Pediatryczne), American Academy of Pediatrics', disclaimer: 'Ten film nie zastępuje lekarza.', dur: 3.2 },
        { type: 'end', shot: '01-today', headline: 'Objawy alarmowe i numer 112 zawsze pod ręką', dur: 3.4 },
      ],
    },
  ],
}

// ─── HTML ────────────────────────────────────────────────────────────────────

// Twarda spacja po jednoliterowych słowach i po liczbach: "u niemowlaka",
// "3 miesięcy", "72 h" nie rozjeżdżają się na dwie linie. Zakres "2-3" nie
// łamie się na łączniku, a krótkie ostatnie słowo nie zostaje samo w linii.
const glue = s => String(s)
  .replace(/(^|[\s(])([AaIiOoUuWwZz])\s+/g, '$1$2 ')
  .replace(/(\d)\s+(?=\S)/g, '$1 ')
  .replace(/(\d)-(\d)/g, '$1⁠-⁠$2')
  .replace(/ (\S{1,7})$/, ' $1')
const esc = s => glue(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const b64 = buf => `data:image/png;base64,${buf.toString('base64')}`

const TONES = {
  urgent:  { bg: '#C0392B', fg: '#fff', value: '#fff' },
  consult: { bg: '#fff',    fg: '#2A1A12', value: '#B84E2E' },
  good:    { bg: '#1F8A6B', fg: '#fff', value: '#fff' },
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #2A1A12; background: #FBF4EE; }
body.brand { background: linear-gradient(180deg, #B84E2E 0%, #D77460 100%); color: #fff; }
.pill { position: absolute; left: 70px; top: 100px; display: flex; align-items: center; gap: 20px;
  font-size: 40px; font-weight: 700; }
.pill img { width: 72px; height: 72px; border-radius: 18px; }
/* Bezpieczna strefa: 160 px wolne z prawej, 440 px na dole (UI Shorts). */
.safe { position: absolute; left: 70px; right: 160px; top: 230px; bottom: 440px;
  display: flex; flex-direction: column; justify-content: center; }
.kicker { font-size: 40px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #B84E2E; margin-bottom: 40px; }
.brand .kicker { color: #fff; background: rgba(255,255,255,.2); align-self: flex-start;
  padding: 16px 30px; border-radius: 999px; letter-spacing: 0; text-transform: none; font-weight: 600; font-size: 44px; }
.title { font-size: 124px; font-weight: 800; line-height: 1.06; letter-spacing: -1px; }
.sub { font-size: 54px; font-weight: 600; opacity: .92; margin-top: 44px; line-height: 1.25; }
.card { border-radius: 48px; padding: 72px 60px; box-shadow: 0 18px 50px rgba(80, 30, 10, .16); }
.card .label { font-size: 62px; font-weight: 600; }
.card .value { font-size: 190px; font-weight: 800; line-height: 1.05; margin: 26px 0 30px; letter-spacing: -3px; white-space: nowrap; }
.card .action { font-size: 68px; font-weight: 700; line-height: 1.18; }
.card .foot { font-size: 46px; font-weight: 600; opacity: .85; margin-top: 26px; }
.heading { font-size: 88px; font-weight: 800; line-height: 1.08; margin-bottom: 48px; }
.rows { display: flex; flex-direction: column; gap: 26px; }
.row { background: #fff; border-radius: 34px; padding: 32px 38px; display: flex; align-items: center; gap: 30px;
  box-shadow: 0 8px 24px rgba(80, 30, 10, .08); border: 5px solid transparent; }
.row.hidden { visibility: hidden; }
.dense .heading { font-size: 76px; margin-bottom: 36px; }
.dense .rows { gap: 20px; }
.dense .row { padding: 24px 32px; }
.dense .row .txt { font-size: 47px; }
.dense .row .num { width: 72px; height: 72px; font-size: 42px; }
.row.new { border-color: #B84E2E; }
.row .num { flex: none; width: 84px; height: 84px; border-radius: 50%; background: #B84E2E; color: #fff;
  font-size: 48px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.row .txt { font-size: 54px; font-weight: 700; line-height: 1.16; }
.row .k { font-size: 58px; font-weight: 600; flex: 1; }
.row .v { font-size: 80px; font-weight: 800; color: #B84E2E; white-space: nowrap; }
.note .emoji { font-size: 180px; line-height: 1; margin-bottom: 48px; }
.note .text { font-size: 104px; font-weight: 800; line-height: 1.08; letter-spacing: -1px; }
.note .text.urgent { color: #C0392B; }
.note .sub { color: #5A463C; opacity: 1; }
.src .label { font-size: 44px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #B84E2E; }
.src .text { font-size: 76px; font-weight: 800; line-height: 1.14; margin: 28px 0 60px; }
.src .disc { background: #fff; border-radius: 34px; padding: 44px 48px; font-size: 52px; font-weight: 600; line-height: 1.28;
  color: #5A463C; box-shadow: 0 8px 24px rgba(80, 30, 10, .08); }
.end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; }
.end .headline { margin-top: 190px; width: 860px; text-align: center; font-size: 80px; font-weight: 800; line-height: 1.1; }
.end .phone { margin-top: 50px; width: 420px; height: 840px; border-radius: 42px; box-shadow: 0 30px 70px rgba(60, 15, 0, .35); }
.end .brandrow { margin-top: 44px; display: flex; align-items: center; gap: 22px; font-size: 60px; font-weight: 800; }
.end .brandrow img { width: 92px; height: 92px; border-radius: 22px; }
.end .cta { margin-top: 24px; font-size: 44px; font-weight: 700; background: #fff; color: #B84E2E;
  padding: 18px 44px; border-radius: 999px; }
`

// Duża wartość na karcie ("od 38,0°C") zawsze w jednej linii: zmniejszamy
// czcionkę, aż się zmieści.
const FIT_SCRIPT = `<script>
for (const el of document.querySelectorAll('.card .value')) {
  let size = parseFloat(getComputedStyle(el).fontSize)
  while (el.scrollWidth > el.clientWidth && size > 60) { size -= 4; el.style.fontSize = size + 'px' }
}
</script>`

function page(bodyClass, inner, icon, app) {
  const pill = bodyClass === 'end' ? '' : `<div class="pill"><img src="${icon}">${esc(app)}</div>`
  const cls = bodyClass === 'hook' || bodyClass === 'end' ? 'brand' : ''
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
    <body class="${cls}">${pill}${inner}${FIT_SCRIPT}</body></html>`
}

function htmlFrames(frame, ctx) {
  const { icon, T } = ctx
  switch (frame.type) {
    case 'hook':
      return [{ dur: frame.dur, html: page('hook', `<div class="safe">
        <div class="kicker">${esc(frame.kicker)}</div>
        <div class="title">${esc(frame.title)}</div>
        <div class="sub">${esc(frame.sub)}</div></div>`, icon, T.app) }]
    case 'card': {
      const t = TONES[frame.tone]
      return [{ dur: frame.dur, html: page('card', `<div class="safe">
        <div class="kicker">${esc(frame.kicker)}</div>
        <div class="card" style="background:${t.bg};color:${t.fg}">
          <div class="label">${esc(frame.label)}</div>
          <div class="value" style="color:${t.value}">${esc(frame.value)}</div>
          <div class="action">${esc(frame.action)}</div>
          ${frame.foot ? `<div class="foot">${esc(frame.foot)}</div>` : ''}
        </div></div>`, icon, T.app) }]
    }
    case 'list':
      // Jedna klatka na każdy odsłonięty punkt; nieodsłonięte trzymają miejsce,
      // żeby lista nie skakała.
      return frame.items.map((_, shown) => ({
        dur: frame.durs[shown],
        html: page('list', `<div class="safe${frame.items.length >= 5 ? ' dense' : ''}">
          <div class="heading">${esc(frame.heading)}</div>
          <div class="rows">${frame.items.map((item, i) => {
            const cls = i > shown ? 'row hidden' : i === shown ? 'row new' : 'row'
            if (frame.pairs) return `<div class="${cls}"><div class="k">${esc(item[0])}</div><div class="v">${esc(item[1])}</div></div>`
            const num = `<div class="num">${frame.numbered ? i + 1 : '!'}</div>`
            return `<div class="${cls}">${num}<div class="txt">${esc(item)}</div></div>`
          }).join('')}</div></div>`, icon, T.app),
      }))
    case 'note':
      return [{ dur: frame.dur, html: page('note', `<div class="safe note">
        <div class="emoji">${frame.emoji}</div>
        <div class="text ${frame.tone || ''}">${esc(frame.text)}</div>
        ${frame.sub ? `<div class="sub">${esc(frame.sub)}</div>` : ''}</div>`, icon, T.app) }]
    case 'source':
      return [{ dur: frame.dur, html: page('source', `<div class="safe src">
        <div class="label">${esc(frame.plural ? T.sourcesLabel : T.sourceLabel)}</div>
        <div class="text">${esc(frame.text)}</div>
        <div class="disc">${esc(frame.disclaimer)}</div></div>`, icon, T.app) }]
    case 'end':
      return [{ dur: frame.dur, html: page('end', `<div class="end">
        <div class="headline">${esc(frame.headline)}</div>
        <img class="phone" src="${ctx.phones[frame.shot]}">
        <div class="brandrow"><img src="${icon}">${esc(T.app)}</div>
        <div class="cta">${esc(T.cta)}</div></div>`, icon, T.app) }]
    default:
      throw new Error(`Nieznany typ klatki: ${frame.type}`)
  }
}

// ─── Wideo ───────────────────────────────────────────────────────────────────

function encode(frames, out) {
  const args = ['-y']
  // Każde wejście trwa dur + FADE, bo przejście zjada FADE z sąsiednich klatek.
  frames.forEach(f => args.push('-loop', '1', '-framerate', '30', '-t', (f.dur + FADE).toFixed(2), '-i', f.file))
  const total = frames.reduce((s, f) => s + f.dur, 0) + FADE
  args.push('-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=r=48000:cl=stereo')
  let chain = ''
  let last = '[0:v]'
  let offset = 0
  for (let i = 1; i < frames.length; i++) {
    offset += frames[i - 1].dur
    const label = `[v${i}]`
    chain += `${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${(offset - FADE / 2).toFixed(2)}${label};`
    last = label
  }
  chain += `${last}format=yuv420p[out]`
  args.push('-filter_complex', chain, '-map', '[out]', '-map', `${frames.length}:a`,
    '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out)
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] })
  return total
}

async function phoneImage(lang, shot) {
  const buf = await sharp(path.join(SHOTS, lang, `${shot}.png`)).extract(PHONE_CROP).resize(440, 880).png().toBuffer()
  return b64(buf)
}

async function main() {
  const args = process.argv.slice(2)
  const langs = args.filter(a => VIDEOS[a])
  const slugs = args.filter(a => !VIDEOS[a])
  const icon = b64(await sharp(ICON).resize(128, 128).png().toBuffer())
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const pg = await browser.newPage()
  await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 })

  for (const lang of (langs.length ? langs : Object.keys(VIDEOS))) {
    const T = COMMON[lang]
    const dir = path.join(OUT, lang)
    const tmp = path.join(OUT, '.tmp', lang)
    fs.mkdirSync(dir, { recursive: true })
    fs.mkdirSync(tmp, { recursive: true })
    const phones = {}
    for (const v of VIDEOS[lang]) for (const f of v.frames) if (f.shot && !phones[f.shot]) phones[f.shot] = await phoneImage(lang, f.shot)

    for (const video of VIDEOS[lang]) {
      if (slugs.length && !slugs.some(s => video.slug.startsWith(s))) continue
      const frames = video.frames.flatMap(f => htmlFrames(f, { icon, T, phones }))
      for (const [i, f] of frames.entries()) {
        f.file = path.join(tmp, `${video.slug}-${String(i).padStart(2, '0')}.png`)
        await pg.setContent(f.html, { waitUntil: 'load' })
        const overflow = await pg.evaluate(() => {
          const s = document.querySelector('.safe')
          if (!s) return false
          const kids = [...s.children].map(c => c.getBoundingClientRect())
          const box = s.getBoundingClientRect()
          return kids.some(r => r.top < box.top - 1 || r.bottom > box.bottom + 1)
        })
        if (overflow) console.warn(`  UWAGA: ${video.slug} klatka ${i} wychodzi poza bezpieczną strefę`)
        await pg.screenshot({ path: f.file, type: 'png' })
      }
      fs.copyFileSync(frames[0].file, path.join(dir, `${video.slug}-cover.png`))
      const out = path.join(dir, `${video.slug}.mp4`)
      const total = encode(frames, out)
      console.log(`  [${lang}] ${video.slug}.mp4  ${total.toFixed(1)} s, ${frames.length} klatek, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`)
    }
  }
  await browser.close()
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
