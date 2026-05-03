# v2.11.3 — CSV/data export i18n + multi-profile sanity

**Data:** 2026-05-03
**Cel:** Zlokalizować eksport CSV (per-child + full backup) który był w 100% hardkodowany po polsku z mieszanką "CALM PARENT" w nagłówku. Plus przetestowany i potwierdzony multi-profile workflow.

**Poprzednie:** v2.11.2 (kompleksowy i18n cleanup po manualnym audicie).

---

## Bug raczej "duży"

CSV export (per-child) był wprowadzony dla zgodności z RODO art. 20 — prawo do przenoszenia danych. Ale plik był tylko po polsku, **z nagłówkiem "CALM PARENT — EKSPORT DANYCH"** (mieszanka angielskiej nazwy apki z polskim tekstem). Niezależnie od locale wybranego w UI:

```
# CALM PARENT — EKSPORT DANYCH        ← zawsze, nawet w PL
# Dziecko: Zosia                       ← zawsze PL
# Karmienia: 0, Sen: 0...              ← zawsze PL
# KARMIENIE                            ← zawsze PL
data,godzina,typ,ilosc,jednostka       ← zawsze PL
```

Polski user widział "CALM PARENT" (dziwne, nazwa apki to "Spokojny Rodzic"). Angielski user widział kompletnie polski plik.

## Bug "mniejszy ale ważny"

Full backup CSV (`dataExport.js`):
- Section header `# PROFILE DZIECI` hardkodowany.
- Filename `spokojny-rodzic-dane-2026-05-03.csv` zawierał polską nazwę produktu w EN locale.
- JSON backup: `spokojny-rodzic-backup-...json` — to samo.

## Fixy

### `src/utils/csvExport.js` — pełna lokalizacja

- Header: `# {t('app.title')} — {t('csv.header.export')}` → "Spokojny Rodzic — EKSPORT DANYCH" w PL, "Calm Parent — DATA EXPORT" w EN.
- Wszystkie meta-fields (`Dziecko/Child`, `Data eksportu/Export date`, counts, GDPR notice).
- Section names: `KARMIENIE→FEEDING`, `SEN→SLEEP`, `PIELUCHY→DIAPERS`, `TEMPERATURA→TEMPERATURE`, `LEKI→MEDICATIONS`, `WZROST→GROWTH`.
- Column headers: `data→date`, `godzina→time`, `typ→type`, `ilosc→amount`, `jednostka→unit`, `czas_minut→duration_min`, `zrodlo→source`, `notatka→note`, `temp_celsius→temp_celsius`, `metoda→method`, `lek→medication`, `dawka→dose`, `waga_kg→weight_kg`, `wzrost_cm→height_cm`, `obwod_glowy_cm→head_circ_cm`.
- Values: `reczny→manual`, `stoper→timer`.
- Internal labels (`Pierś lewa`, `Odbytniczo`) teraz idą przez `displayMethod()` / nowy `displayFeedType()` helper → "Left breast / Rectal" w EN.

API change: `exportAllToCsv()` zachował side-effect (download), ale wydzielony `buildCsv()` zwraca string (do testów + downstream).

### `src/utils/dataExport.js` — częściowa lokalizacja

- `# PROFILE DZIECI` → `t('csv.section.profiles')` ("PROFILE DZIECI" / "CHILD PROFILES").
- Filename `spokojny-rodzic-backup-{date}.json` → `babylog-backup-{date}.json` (locale-neutral, lepszy dla EN userów).
- Filename `spokojny-rodzic-dane-{date}.csv` → `babylog-data-{date}.csv` (locale-neutral).

### `src/utils/helpers.js` — nowy helper

- `displayFeedType(type)` analogiczny do `displayMethod()` — używany przez CSV (i potencjalnie PDF) do tłumaczenia internal `'Pierś lewa'` na `t('feed.type.left')`.

### Nowe i18n keys (PL + EN)

29 par PL/EN dla `csv.*`:
```
csv.header.{export, child, export_date, counts, counts2, gdpr}
csv.section.{feed, sleep, diaper, temp, meds, growth, profiles}
csv.col.{date, time, type, amount, unit, duration_min, source, note,
        temp_celsius, method, med, dose, weight_kg, height_cm, head_circ_cm}
csv.value.{manual, timer}
```

---

## Multi-profile workflow — przetestowany w PL

W ramach manualnej weryfikacji potwierdziłem:
- ✅ Dodawanie drugiego profilu (Kacper, 8 mies.) — modal "Nowy profil dziecka" w PL.
- ✅ Auto-switch na nowo dodany profil (topbar zmienia chip).
- ✅ Per-profile data isolation (Kacper ma 0 pomiarów temp, Zosia ma 38.5°/40.6°).
- ✅ Edycja profilu (modal "Edytuj profil").
- ✅ Usunięcie profilu (potwierdzenie window.confirm + fallback na Zosia).
- ✅ Lista profili w PL ("Profile dzieci", "Wybierz aktywne dziecko lub dodaj nowe").

---

## Verification

- `npm test` → 119/119 pass
- `npm run build` → clean
- Manual CSV check w PL → "Spokojny Rodzic — EKSPORT DANYCH" + polskie sekcje.
- Manual CSV check w EN → "Calm Parent — DATA EXPORT" + angielskie sekcje.

---

## Co dalej (pozostała lista)

- [ ] PDF report — formalnie fixed w v2.11.2 (`pdf.col.height`, `pdf.col.head_circ`), ale nie zweryfikowane w UI. Wymaga premium + wygenerowania PDF.
- [ ] Test notifications (test notification button) — wymaga uprawnień przeglądarki + akceptacji.
- [ ] Service worker offline mode — wymaga emulacji offline.
- [ ] Edge cases: long names, special characters, very old entries.

Versionning: `package.json`: 2.11.2 → 2.11.3.
