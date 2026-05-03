// scripts/generate-feature-graphic.mjs
//
// Generates Play Store feature graphic (1024×500) for PL and EN locales.
// Output: store-assets/feature-graphic-{pl,en}-2026-05.png

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'store-assets')
const CHROME_PATH = process.env.CHROME_PATH ||
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

// Color palette — taken from src/index.css design tokens
const C = {
  brand600: '#0F6E56',  // primary green
  brand500: '#1D9E75',
  brand100: '#9FE1CB',
  greenLight: '#E1F5EE',
  text: '#1A1A18',
  text2: '#5A5A56',
  text3: '#8A8A82',
  surface: '#FAFAF7',
  bg: '#F5F5F0',
  pink: '#FFD6E8',
}

const COPY = {
  pl: {
    title: 'Spokojny Rodzic',
    tagline: 'Dziennik zdrowia dziecka',
    subtitle: 'Twoje dane i wytyczne pediatryczne w jednym miejscu',
    bullets: [
      'Karmienie • sen • temperatura',
      'Wytyczne PTP/AAP do przeczytania',
      'Bez reklam, bez śledzenia',
    ],
  },
  en: {
    title: 'Calm Parent',
    tagline: 'Child health journal',
    subtitle: 'Your data and pediatric guidelines in one place',
    bullets: [
      'Feeding • sleep • temperature',
      'AAP/PTP guidelines to read',
      'No ads, no tracking',
    ],
  },
}

function buildHtml(locale) {
  const t = COPY[locale]
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
  html, body { width: 1024px; height: 500px; overflow: hidden; }
  .stage {
    width: 1024px; height: 500px;
    background: linear-gradient(135deg, ${C.greenLight} 0%, ${C.surface} 50%, ${C.pink}66 100%);
    display: flex; align-items: center;
    padding: 40px 60px; gap: 40px;
    position: relative;
  }
  /* Decorative blob in background */
  .blob1 {
    position: absolute; top: -100px; right: -150px; width: 400px; height: 400px;
    background: radial-gradient(circle, ${C.brand500}33 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }
  .blob2 {
    position: absolute; bottom: -120px; left: -100px; width: 350px; height: 350px;
    background: radial-gradient(circle, ${C.pink}80 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }
  .left { flex: 1.3; max-width: 590px; z-index: 2; }
  .right { flex: 1; display: flex; align-items: center; justify-content: center; z-index: 2; }

  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    background: ${C.surface};
    border: 1.5px solid ${C.brand100};
    border-radius: 100px;
    font-size: 13px; font-weight: 600; color: ${C.brand600};
    margin-bottom: 18px;
  }
  .title {
    font-size: 56px; font-weight: 800; color: ${C.text};
    letter-spacing: -1.5px; line-height: 1.05;
    margin-bottom: 12px;
  }
  .tagline {
    font-size: 28px; font-weight: 700; color: ${C.brand600};
    margin-bottom: 8px; letter-spacing: -0.5px;
  }
  .subtitle {
    font-size: 18px; color: ${C.text2}; line-height: 1.4;
    margin-bottom: 24px; max-width: 540px;
  }
  ul.bullets {
    list-style: none; padding: 0;
  }
  ul.bullets li {
    font-size: 15px; color: ${C.text2}; font-weight: 600;
    padding: 6px 0 6px 26px; position: relative;
    letter-spacing: 0.1px;
  }
  ul.bullets li::before {
    content: '✓'; position: absolute; left: 0; top: 7px;
    width: 18px; height: 18px;
    background: ${C.brand600}; color: #fff;
    border-radius: 50%; font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  /* Phone mockup */
  .phone {
    width: 240px; height: 480px;
    background: #fff;
    border-radius: 36px;
    box-shadow: 0 20px 60px rgba(15,110,86,0.15), 0 8px 24px rgba(0,0,0,0.08);
    border: 8px solid #1a1a18;
    overflow: hidden;
    position: relative;
  }
  .phone-notch {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 80px; height: 18px;
    background: #1a1a18; border-radius: 0 0 14px 14px;
    z-index: 5;
  }
  .phone-content {
    padding: 32px 16px 16px;
    height: 100%;
    background: ${C.bg};
    display: flex; flex-direction: column; gap: 10px;
  }
  .topbar-mock {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 4px;
  }
  .topbar-title-mock {
    font-size: 13px; font-weight: 800; color: ${C.text};
  }
  .baby-chip-mock {
    background: ${C.greenLight}; color: ${C.brand600};
    font-size: 9px; font-weight: 700;
    padding: 3px 8px; border-radius: 100px;
  }
  .stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .stat-card-mock {
    background: ${C.surface}; border: 0.5px solid #E5E7EB;
    border-radius: 8px; padding: 8px;
  }
  .stat-card-mock.green { background: ${C.greenLight}; }
  .stat-card-mock.purple { background: #ECE6FB; }
  .stat-card-mock.blue { background: #DDE9F8; }
  .stat-card-mock.orange { background: #FFE7DC; }
  .stat-icon { font-size: 12px; line-height: 1; margin-bottom: 4px; opacity: 0.8; }
  .stat-num { font-size: 16px; font-weight: 800; color: ${C.text}; line-height: 1; }
  .stat-num.green { color: ${C.brand600}; }
  .stat-num.purple { color: #6B47C6; }
  .stat-num.blue { color: #185FA5; }
  .stat-num.orange { color: #B43E15; }
  .stat-lbl { font-size: 8px; color: ${C.text3}; margin-top: 2px; }
  .timeline {
    margin-top: 6px; flex: 1;
    background: ${C.surface}; border-radius: 8px;
    border: 0.5px solid #E5E7EB;
    padding: 6px;
  }
  .tl-row {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 0; border-bottom: 0.5px solid #F0F0EC;
    font-size: 9px;
  }
  .tl-row:last-child { border-bottom: none; }
  .tl-icon { font-size: 11px; }
  .tl-text { flex: 1; color: ${C.text}; font-weight: 500; }
  .tl-time { color: ${C.text3}; font-size: 8px; }
</style>
</head>
<body>
<div class="stage">
  <div class="blob1"></div>
  <div class="blob2"></div>
  <div class="left">
    <div class="badge">🍼 ${locale === 'en' ? 'Free • No ads' : 'Bezpłatnie • Bez reklam'}</div>
    <h1 class="title">${t.title}</h1>
    <div class="tagline">${t.tagline}</div>
    <p class="subtitle">${t.subtitle}</p>
    <ul class="bullets">
      ${t.bullets.map(b => `<li>${b}</li>`).join('')}
    </ul>
  </div>
  <div class="right">
    <div class="phone">
      <div class="phone-notch"></div>
      <div class="phone-content">
        <div class="topbar-mock">
          <div class="topbar-title-mock">${t.title}</div>
          <div class="baby-chip-mock">🌸 Zosia</div>
        </div>
        <div class="stat-row">
          <div class="stat-card-mock green">
            <div class="stat-icon">🍼</div>
            <div class="stat-num green">5</div>
            <div class="stat-lbl">${locale === 'en' ? 'feeds' : 'karmień'}</div>
          </div>
          <div class="stat-card-mock purple">
            <div class="stat-icon">🌙</div>
            <div class="stat-num purple">2h 45m</div>
            <div class="stat-lbl">${locale === 'en' ? 'sleep' : 'sen'}</div>
          </div>
          <div class="stat-card-mock blue">
            <div class="stat-icon">👶</div>
            <div class="stat-num blue">4</div>
            <div class="stat-lbl">${locale === 'en' ? 'diapers' : 'pieluch'}</div>
          </div>
          <div class="stat-card-mock orange">
            <div class="stat-icon">🌡️</div>
            <div class="stat-num orange">37.6°</div>
            <div class="stat-lbl">${locale === 'en' ? 'last temp' : 'ostatnia temp'}</div>
          </div>
        </div>
        <div class="timeline">
          <div class="tl-row"><span class="tl-icon">🌙</span><span class="tl-text">${locale === 'en' ? 'Sleep · 1h 30min' : 'Sen · 1h 30min'}</span><span class="tl-time">20:30</span></div>
          <div class="tl-row"><span class="tl-icon">🤱</span><span class="tl-text">${locale === 'en' ? 'Right breast · 15ml' : 'Pierś prawa · 15ml'}</span><span class="tl-time">19:00</span></div>
          <div class="tl-row"><span class="tl-icon">🌡️</span><span class="tl-text">37.6°C</span><span class="tl-time">17:30</span></div>
          <div class="tl-row"><span class="tl-icon">💧</span><span class="tl-text">${locale === 'en' ? 'Wet' : 'Mokra'}</span><span class="tl-time">17:00</span></div>
          <div class="tl-row"><span class="tl-icon">🤱</span><span class="tl-text">${locale === 'en' ? 'Left breast · 15ml' : 'Pierś lewa · 15ml'}</span><span class="tl-time">16:15</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

async function generate(browser, locale) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 })
  const html = buildHtml(locale)
  await page.setContent(html, { waitUntil: 'networkidle0' })
  // Wait extra for fonts
  await new Promise(r => setTimeout(r, 1500))
  const file = path.join(OUT_DIR, `feature-graphic-${locale}-2026-05.png`)
  await page.screenshot({ path: file, type: 'png', omitBackground: false, fullPage: false, clip: {x:0, y:0, width:1024, height:500} })
  console.log(`  feature-graphic-${locale}-2026-05.png  →  ${path.relative(ROOT, file)}`)
  await page.close()
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox'],
  })
  console.log('Generating feature graphics 1024×500…')
  await generate(browser, 'pl')
  await generate(browser, 'en')
  await browser.close()
  console.log('Done.')
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
