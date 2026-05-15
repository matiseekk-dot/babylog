---
name: generate-localized-screenshots
description: Use this skill when the user wants to generate marketing screenshots for an app store (Google Play, App Store) from a Progressive Web App (PWA) in multiple languages. Particularly useful when the user has built i18n support and needs polished store listing assets per locale. Handles real screenshot capture via Puppeteer (not mockups), automatic test data injection via localStorage, multi-locale rendering, and common bugs like internal-enum mismatch and UTC-vs-local date issues. Triggers when user mentions Play Store screenshots, App Store screenshots, marketing screenshots, store listing assets, localized screenshots, or multi-language screenshots.
---

# Generate Localized Screenshots for App Store

Automate production-quality screenshots from a running PWA, in multiple languages, with realistic test data — for Google Play / App Store listings.

## What this skill does

Instead of:
- Manually opening the app on a phone × N languages × M screens
- Or building fake mockup images that don't match the actual UI
- Or asking designers to mock things up

This skill:
1. Spins up the PWA locally (`npm run dev` or production build via `vite preview`)
2. Uses Puppeteer + headless Chrome to navigate to each screen
3. Injects realistic test data via `localStorage` BEFORE the app loads
4. Switches language by setting the locale in `localStorage`
5. Captures crisp screenshots at Play Store resolution (1080×2160 or similar)
6. Outputs PNGs organized by locale: `screenshots/{de,fr,es}/01-today.png`

The output looks like real app screenshots because **it is** real app screenshots — just with curated test data.

## When to trigger this skill

Trigger when user says any of:
- "Generate screenshots for Play Store"
- "Make screenshots in DE/FR/ES" (or any locales)
- "I need store listing screenshots"
- "Screenshot pipeline"
- "Automate app store screenshots"
- "Localized screenshots for my PWA"

Do NOT trigger when:
- User wants screenshots of a website (not an app store listing)
- User wants documentation screenshots (consider just using built-in screenshot tools)
- User is not building a PWA / mobile-first app

## Prerequisites

The user's project must have:

1. **PWA / SPA** built with any framework (React, Vue, Svelte, vanilla JS)
2. **i18n system** with a way to set locale (typically `localStorage` or URL param)
3. **`puppeteer-core`** + **`sharp`** in `devDependencies` (or you can install them)
4. **Chrome / Chromium** installed locally (the script needs an executable path)
5. **A dev server** that can serve the app (`npm run dev`, `vite preview`, etc.)
6. **localStorage-based state** OR an obvious way to seed app state (Firestore SDK, Redux persist, etc.)

If any of these are missing, gracefully ask the user before proceeding.

## Step-by-step procedure

### Step 1 — Discover the project structure

Read these files (if they exist) to understand the codebase:

- `package.json` — confirm React/Vue/etc., find dev command, deps
- `src/i18n.js` or `src/i18n/index.ts` — understand locale storage key + supported locales
- `vite.config.js` / `next.config.js` — find dev server URL
- Main app entry (`src/App.jsx`, `src/main.tsx`) — find storage prefix conventions
- Tab components — identify navigation pattern (bottom nav? sidebar?)

Capture:
- `APP_URL` (e.g. `http://localhost:5173/yourapp/`)
- `LOCALES` (e.g. `['en', 'de', 'fr']`)
- `LOCALE_STORAGE_KEY` (e.g. `babylog_locale`)
- `STATE_STORAGE_PREFIX` (e.g. `babylog_guest_` or just `appname_`)
- Navigation structure (e.g. `.bottom-nav .nav-item` with 5 items)

### Step 2 — Identify "internal enums" vs translatable strings

CRITICAL — this is the #1 bug everyone hits.

Many apps store enum-like values in their **original language** (typically English or the founder's native language) because they're internal identifiers, not user-facing labels. The UI translates them at render time via `t()`.

Example from BabyLog (this skill's origin project):
```js
// In Firestore / localStorage — ALWAYS Polish:
{ type: 'Pierś lewa', amount: '15' }   // "Left breast" in PL

// In UI — translated:
<button>{t('feed.type.left')}</button>  // Renders "Left breast" / "Brust links" / "Sein gauche"

// The translation is at READ time:
function feedTypeLabel(type) {
  if (type === 'Pierś lewa') return t('feed.type.left')
}
```

**If your test data seeds `type: 'Brust links'` (German label), the app won't recognize it as a feed entry** because the matching logic checks `type === 'Pierś lewa'`. Your screenshots will show empty stats.

**Procedure**:
1. Grep components for `case '...'` or `type === '...'` patterns
2. Read enum constants (often top of files: `const TYPES = ['...', '...']`)
3. Build a map: `ENUMS = { feedLeft: 'Pierś lewa', ... }` — use ORIGINAL values
4. Free-text user content (notes, custom names) can be translated per locale

### Step 3 — Handle the UTC vs local date bug

Another #1 bug for late-night/early-morning script runs.

Apps typically store dates as `YYYY-MM-DD` in local time, then filter "today's entries" by matching local date.

If your script does:
```js
const today = new Date().toISOString().slice(0, 10)  // ❌ UTC date
```

…you'll seed entries with yesterday's UTC date when running between 22:00–23:59 in UTC+2 (CEST). The app sees them as yesterday and shows empty "today" stats.

**Use a local-date helper that matches the app's own:**
```js
function localYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const today = localYMD(new Date())
```

Confirm by reading the app's own `todayDate()` / `dateYMD()` utility.

### Step 4 — Build test data ("buildState")

Construct a `state` object with realistic, comprehensive data:

```js
function buildState(locale) {
  const today = localYMD(new Date())
  const yest = localYMD(new Date(Date.now() - 86400000))
  const u = USER_STRINGS[locale] || USER_STRINGS.en
  
  return {
    [`${LOCALE_STORAGE_KEY}`]: locale,
    [`${STATE_PREFIX}consent_v1`]: '1',
    [`${STATE_PREFIX}onboarding_done`]: 'true',
    
    [`${STATE_PREFIX}profiles`]: JSON.stringify([{
      id: 'demo',
      name: CHILD_NAME[locale] || 'Test',  // Translate user-content
      ...
    }]),
    
    [`${STATE_PREFIX}feed_demo`]: JSON.stringify([
      { id: 'f1', date: today, type: ENUMS.breastL, ... },  // Internal enum — DO NOT translate
      ...
    ]),
    
    // Notes are free text — translate per locale:
    [`${STATE_PREFIX}temp_demo`]: JSON.stringify([
      { id: 't1', date: today, temp: 37.6, note: u.afterMed },
    ]),
  }
}
```

Aim for **5+ entries per category** so screenshots look "real" not empty.

### Step 5 — Multi-locale click selectors

When clicking through tabs / buttons to reach each screen, button text varies per locale. Use alternation regexes:

```js
function clickByText(textPattern) {
  return async (page) => {
    await page.evaluate((src) => {
      const re = new RegExp(src)
      const btn = [...document.querySelectorAll('button')].find(b => re.test(b.textContent.trim()))
      btn?.click()
    }, textPattern)
  }
}

// Use alternation across all locales:
await clickByText('^(Temperatura|Temperature|Temperatur|Température)$')(page)
```

Alternatively: click bottom-nav items by INDEX (more stable):
```js
function clickNav(idx) {
  return async (page) => {
    await page.evaluate((i) => {
      document.querySelectorAll('.bottom-nav .nav-item')[i]?.click()
    }, idx)
  }
}
```

### Step 6 — Capture loop

For each locale × each screen:

```js
async function screenshotForLocale(browser, locale) {
  const page = await browser.newPage()
  await page.setViewport({
    width: 432, height: 864,
    deviceScaleFactor: 2.5,  // Up-render to ~1080×2160 for crisp Play Store quality
  })
  
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  
  // Inject state
  const state = buildState(locale)
  await page.evaluate((s) => {
    Object.keys(localStorage).filter(k => k.startsWith('babylog')).forEach(k => localStorage.removeItem(k))
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v))
  }, state)
  
  // Reload — app picks up localStorage on init
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(2500)
  
  for (const shot of SHOTS) {
    if (shot.action) await shot.action(page)
    await sleep(1500)  // Wait for transitions / chart animations
    await page.screenshot({
      path: `screenshots/${locale}/${shot.name}.png`,
      type: 'png',
    })
  }
  
  await page.close()
}
```

### Step 7 — Reference implementation

A full working template is provided at `template.mjs` in this skill folder. Adapt it to the user's specific project structure.

Key variables to customize per project:
- `APP_URL` — dev server URL
- `CHROME_PATH` — Chrome binary path (Windows: `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`)
- `OUT_DIR` — where to save screenshots
- `VIEWPORT` — typically `{ width: 432, height: 864 }` × scaleFactor 2.5
- `LOCALES` — array of locale codes
- `USER_STRINGS` — per-locale free-text (notes, labels)
- `ENUMS` — internal enum values (DO NOT translate)
- `SHOTS` — array of { name, action } for each screen
- `STATE_PREFIX` — localStorage key prefix
- `LOCALE_STORAGE_KEY` — where current locale is stored

## Running the script

```bash
# Start dev server (in separate terminal)
npm run dev

# Wait for "ready", then capture:
node scripts/generate-screenshots.mjs              # All locales
node scripts/generate-screenshots.mjs de fr        # Subset
APP_URL=http://localhost:5174/ node scripts/...    # Override URL
```

Output structure:
```
screenshots/
├── de/
│   ├── 01-today.png        (1080×2160)
│   ├── 02-temperature.png
│   ├── 03-meds.png
│   └── ...
├── fr/
│   └── (same screens)
└── es/
    └── (same screens)
```

These PNGs are ready to upload directly to Play Console / App Store Connect.

## Common pitfalls

### "Stats show 0 even though entries are in localStorage"
→ Bug #1: Internal enum mismatch. Your seeded `type: '...'` doesn't match what the app's matching logic expects. See Step 2.

### "Today's entries show as 'no entries'"
→ Bug #2: UTC vs local date. Run `localYMD()` instead of `toISOString().slice(0,10)`. See Step 3.

### "Timeout navigating to localhost"
→ Vite changed port (5173 → 5174 → 5175). Either restart dev server cleanly or use `APP_URL` env var override.

### "Onboarding banner blocks the screenshot"
→ Add a dismiss step after `page.reload()`. Look for the close button and click it.

### "Charts not rendered yet"
→ Recharts / chart libs animate on mount. Wait extra time (3000ms) for screens with charts.

### "Wrong locale rendered"
→ Confirm `LOCALE_STORAGE_KEY` is correct AND that the app reads it on init (not just on language switch). Some apps use cookies or URL params instead.

### "TopBar shows debug elements (language switcher, dev badge)"
→ Best to move dev-only UI out of TopBar before generating production screenshots. Or hide via CSS injection right after `page.reload()`.

## Bonus: post-process to add headlines

For Play Store, you might want headlines above the phone mockup ("Track sleep with WHO percentiles"). Use `sharp` to compose:

```js
import sharp from 'sharp'

const headline = `<svg width="1080" height="400">
  <text x="540" y="200" font-size="84" font-weight="800" text-anchor="middle">${title}</text>
  <text x="540" y="280" font-size="38" text-anchor="middle" opacity="0.7">${subtitle}</text>
</svg>`

await sharp({
  create: { width: 1080, height: 2560, channels: 4, background: '#FFF' }
})
.composite([
  { input: Buffer.from(headline), top: 0, left: 0 },
  { input: 'screenshots/de/01-today.png', top: 400, left: 0 },
])
.png()
.toFile('screenshots-final/de/01-today.png')
```

## Time savings

Manual approach: ~5-10 min per screenshot × 3 langs × 6 screens = **90-180 min** per release.

With this skill: ~30s of runtime + 1× setup of buildState (~30 min total once).

Worth it after the 2nd release.

## Origin

This skill was extracted from the BabyLog project (Spokojny Rodzic) — a baby health tracker shipped to Google Play in 5 languages (PL/EN/DE/FR/ES + LATAM variants). The reference implementation generated 30 screenshots (5 locales × 6 screens) in ~3 minutes for the v2.12.0 launch.

The bugs documented above (internal-enum mismatch, UTC date) were both discovered and fixed during that launch. Saved here so the next dev doesn't hit them.

## Files in this skill

- `SKILL.md` — this file
- `template.mjs` — reference implementation, adapt per project
- `README.md` — quick-start for end users
