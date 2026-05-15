# BabyLog Skills

Collection of Claude Code skills extracted from this project, ready to use in other apps.

## Skills

### [generate-localized-screenshots](./generate-localized-screenshots/)

Automate Play Store / App Store screenshot generation in multiple languages using Puppeteer + real test data. Saves 90-180 min per release.

**Triggers when user says**: "screenshots for Play Store", "localized screenshots", "screenshot pipeline", etc.

## How to use these skills

### Per-project

Copy a skill folder into `.claude/skills/` of any project:

```bash
cp -r babylog/skills/generate-localized-screenshots .claude/skills/
```

Then Claude Code will auto-detect it when relevant.

### Global

Install once for all your projects:

```bash
cp -r babylog/skills/generate-localized-screenshots ~/.claude/skills/
```

## Why these exist

These skills represent real production patterns from BabyLog (Spokojny Rodzic) — a baby health tracker shipped to Google Play in 5 languages. The patterns were:
- Documented after they worked
- Hardened by hitting their gotchas in production
- Generalized so they apply beyond this specific app

If you ship a multi-locale PWA to app stores, these will save you time.

## Inspired by

[bidah/skill-set](https://github.com/bidah/skill-set) — a public collection of Claude Code skills with similar approach.

## Contributing

Have a pattern from your app that others would benefit from? PRs welcome. Format:

```
skills/
└── your-skill-name/
    ├── SKILL.md        (required — frontmatter + procedure)
    ├── README.md       (optional — quick-start for users)
    └── template.{mjs,sh,py}  (optional — reference implementation)
```

The SKILL.md frontmatter must have `name` and `description`. The description is critical — it's what Claude reads to decide when to trigger the skill.
