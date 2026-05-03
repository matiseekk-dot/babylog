# v2.11.2 — Comprehensive i18n cleanup (full PL+EN audit)

**Data:** 2026-05-03
**Cel:** Systematycznie wyczyścić wszystkie zostałe hardkodowane stringi PL, które wyciekały do EN UI. Pełen audyt wszystkich tabów + komponentów + utils.

**Poprzednie:** v2.11.1 (3 hot-fix'y po manualnym teście).

---

## TŁO

Po v2.11.1 zrobiłem kombinowany audyt:
- **A)** systematyczny grep za hardkodowanymi PL stringami w całym `src/`
- **B)** manualne testowanie każdego ekranu w obu locale (PL + EN)

Znaleziono dodatkowe 12 miejsc gdzie stringi PL były hardkodowane lub gdzie i18n dictionary miało buga.

---

## Bugi naprawione

### Tab forms (DietTab, CoughTab, MilestonesTab, MedsTab)

`<button>Wszystkie</button>`, `<label>Emoji</label>`, `<label>Data</label>`, etc. — wszystkie hardkodowane i zostawały po PL niezależnie od `_currentLocale`.

- **DietTab.jsx:75,118,120** — "Wszystkie", "Nowy produkt", "Emoji produktu" → `t('common.all')`, `t('diet.modal.title')`, `t('diet.emoji_label')`
- **CoughTab.jsx:488,497,508** — "Data", "Godzina", "Notatka (opcjonalnie)" → `t('common.date')`, `t('common.time')`, `t('common.note_optional')`
- **MilestonesTab.jsx:121,163,175** — "Wszystkie", "Emoji", "Opis etapu" → `t('common.all')`, `t('milestones.emoji_label')`, `t('milestones.desc_label')`
- **MedsTab.jsx:273** — "Emoji leku" → `t('meds.emoji_label')`

### ProfilesScreen

- **ProfilesScreen.jsx:46** — `'Noworodek'` (jeden z fallbacków `ageLabel()`) → `t('profiles.age.newborn')`
- **ProfilesScreen.jsx:79,82** — "+ Dodaj dziecko" button + "Nowe dziecko" modal title → `t('profiles.add')`, `t('profiles.add.title')` (klucze już istniały, były nieużywane)
- **ProfilesScreen.jsx:89,189** — "Avatar" label x2 → `t('profiles.avatar_label')`

### SettingsScreen

- **i18n.js:1858** — "Download a PDF report ... for your doctor**..**" — typo: podwójna kropka. Fixed.
- **SettingsScreen.jsx:691** — Footer hardkodowane `Spokojny Rodzic v{APP_VERSION}` zamiast `{t('app.title')} v{APP_VERSION}`. EN użytkownicy widzieli polską nazwę aplikacji w stopce. Fixed.

### Engine (interpretations.js, whoNorms.js)

- **interpretations.js:94** (już z v2.11.1) — "Ostatni pomiar" hardkodowane.
- **whoNorms.js:258-276** — `interpretPercentile()` zwracał WSZYSTKIE komunikaty hardkodowane po polsku ("waga poniżej P3 — warto skonsultować z pediatrą", "W normie — zdrowy rozwój", etc.). EN użytkownicy widzieli pełne polskie zdania w wykresie wzrostu. Refactored na `t('who.*')` z parametrem `{label}`.

### Utils

- **pdfReport.js:302** — kolumny tabeli wzrostu w PDF: `'Wzrost'` i `'Obwód głowy'` hardkodowane (ale `t('pdf.header.date')` już używane). Fixed na `t('pdf.col.height')`, `t('pdf.col.head_circ')`.

### Nowe klucze i18n (PL + EN, 22 klucze x 2 locale = 44 nowe wpisy)

```
common.all                  / All
common.emoji                / Emoji
common.note_optional        / Note (optional)
common.description          / Description
milestones.emoji_label      / Emoji
milestones.desc_label       / Milestone description
diet.emoji_label            / Product emoji
meds.emoji_label            / Medication emoji
pdf.col.height              / Height
pdf.col.head_circ           / Head circ.
profiles.age.newborn        / Newborn
profiles.avatar_label       / Avatar
who.type.weight             / weight
who.type.height             / height
who.type.head_circ          / head circumference
who.below_p3                / {label} below P3 — consult with your pediatrician
who.above_p97               / {label} above P97 — consult with your pediatrician
who.near_median             / Near the median (P50) — typical development
who.in_range                / Within normal range — healthy development
who.lower_normal            / On the lower end of normal range, but OK
who.upper_normal            / On the upper end of normal range, but OK
who.lower_observe           / Lower percentile — observe the trend
who.upper_observe           / Higher percentile — observe the trend
```

---

## Co zostało przetestowane manualnie

**W EN** (po fixach):
- ✅ Settings (cały scrollable screen, footer, notifications)
- ✅ ProfilesScreen (lista + modal Add child + edit)
- ✅ PaywallScreen (cała oferta Premium)
- ✅ Health → Temperature (read + add 38.5°C, 40.6°C — verified NO crisis banner)
- ✅ Health → Medicine (Paracetamol, Ibuprofen, Saline)
- ✅ Health → Symptoms (4 quick-log buttons)
- ✅ Today (timeline z entries)
- ✅ Feed tab (3 quick types)
- ✅ Sleep tab
- ✅ More → Milestones (43 items, 3 filtry)
- ✅ More → Teething
- ✅ More → Growth (add measurement + history)
- ✅ More → Cough
- ✅ More → Vaccinations
- ✅ More → Solids (24 produkty, 3 filtry)
- ✅ More → Doctor notes
- ✅ More → AAP/PTP guidelines (ReferenceLibrary)
- ✅ More → When to seek help (WhenToSeekHelpCard, expand/collapse)
- ✅ Quick Add FAB (3 feed + 3 diaper + sleep + temp)
- ✅ Language toggle PL ↔ EN

**W PL** (sanity check po fixach):
- ✅ Wszystkie powyższe nadal działają poprawnie po polsku

---

## MDR exit re-verification

Po wszystkich fixach krytyczny test ciągle przechodzi:
- Temperatura 38.5°C i 40.6°C u 5-mies. dziecka NIE generuje banneru "ZADZWOŃ DO LEKARZA"
- Brak kategorii critical/alert/warning w UI
- Tylko statyczna labelka kategorii temperatury + neutralny trend `↑ Rośnie`/`↑ Rising`

---

## Verification

- `npm test` → 119/119 pass (11 plików)
- `npm run build` → clean

---

## Co NIE zostało przetestowane (świadome cuts)

- **PDF report generation** — wymaga premium + długie generowanie. Jednak fix `pdf.col.height/head_circ` jest dokonany na podstawie kodu, key dodany; gdy użytkownik wygeneruje PDF, kolumny będą już prawidłowo zlokalizowane.
- **CSV export** — sprawdzony tylko wizualnie (przyciski w Settings). Treść CSV nie testowana.
- **Notifications flow** — wymaga uprawnień przeglądarki + akceptacji.
- **Service worker offline** — wymaga emulacji offline.
- **Edge cases** typu: bardzo długie nazwy, wpisy z 24h+ wstecz, multi-profile, etc.

Lista pozostałych orphan keys w `i18n.js` (dawne `crisis.*` / `status.*` po MDR exit) jest udokumentowana w CHANGELOG-v2.11.1 i pozostaje do v2.12 — nieużywane klucze nie powodują bugów, tylko pesh-up bundle.

---

## Versionning

- `package.json`: 2.11.1 → 2.11.2
- SW comment: bez zmian (cache name v5 nadal obowiązuje)
