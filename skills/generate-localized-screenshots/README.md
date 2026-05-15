# generate-localized-screenshots

A Claude Code skill for generating real, production-quality screenshots of your PWA in multiple languages — for Google Play / App Store listings.

## Quick start

### 1. Install this skill

Copy this folder into one of:

```bash
# Project-scoped (only this repo):
mkdir -p .claude/skills/
cp -r path/to/generate-localized-screenshots .claude/skills/

# Global (all your projects):
mkdir -p ~/.claude/skills/
cp -r path/to/generate-localized-screenshots ~/.claude/skills/
```

### 2. Activate in Claude Code

Ask Claude Code:

```
"Generate screenshots for Play Store in DE, FR and ES"
```

Or any variation — Claude will detect this skill and apply it.

### 3. What happens

Claude Code will:
1. Read your project (i18n setup, component structure, storage schema)
2. Copy `template.mjs` to `scripts/generate-screenshots.mjs`
3. Adapt it to your specific app (replace `CUSTOMIZE:` markers)
4. Identify "internal enums" so test data matches what your app expects
5. Start `npm run dev` if not running
6. Generate screenshots to `screenshots/{locale}/`

## Manual fallback (without Claude)

If you want to use it yourself:

1. `cp template.mjs scripts/generate-screenshots.mjs`
2. Edit all `CUSTOMIZE:` markers
3. `npm i -D puppeteer-core sharp`
4. `npm run dev` (in another terminal)
5. `node scripts/generate-screenshots.mjs`

## Output

```
screenshots/
├── de/
│   ├── 01-home.png        (1080×2160 PNG)
│   ├── 02-tab1.png
│   └── ...
├── fr/
└── es/
```

Ready to drag-and-drop into Play Console / App Store Connect.

## Why this skill

Manual screenshot capture takes **~5-10 min per shot** × N locales × M screens.

For a typical app launch (3 locales × 6 screens = 18 shots), that's **90-180 minutes** of manual work per release.

This script does it in **~3 minutes runtime** + 30 min one-time setup.

## What it solves

- ✅ Real screenshots, not mockups
- ✅ Realistic test data injected via localStorage
- ✅ Multi-locale (any number)
- ✅ Crisp 1080×2160 (Play Store sweet spot)
- ✅ Reproducible — same data each run
- ✅ Handles 2 common bugs (internal enums, UTC dates)

## Origin

Extracted from [BabyLog (Spokojny Rodzic)](https://github.com/matiseekk-dot/babylog) — a baby health tracker app shipped to Google Play in 5 languages (PL/EN/DE/FR/ES).

The reference implementation generated all v2.12.0 launch screenshots (30 PNGs across 5 locales) in 3 minutes for the production release.

## License

MIT — use it however you want.
