# v2.10.6 — MDR EXIT REFACTOR (UI surface) + Play Store re-upload fixes

**Data:** 2026-05-02
**Cel:** Dokończyć MDR exit refactor zadeklarowany w CHANGELOG-v2.10.5 (App.jsx UI), naprawić krytyczny bug w `assetlinks.json` blokujący TWA verification, posprzątać duplikat rejestracji SW.

---

## TŁO

CHANGELOG-v2.10.5.md zadeklarował usunięcie 4 plików clinical-decision-support i podpięcie 3 statycznych komponentów referencyjnych — ale to **nie zostało zrobione w kodzie**. v2.10.5 została wypchnięta z UI nadal renderującym `ChildStatusBar`/`ChildStatusCard`/`CallDoctorCard` napędzane przez `useCrisisDetection`. Marketing premise tej wersji ("apka NIE jest już MDSW") nie zgadzał się ze stanem kodu.

v2.10.6 dokańcza co v2.10.5 zadeklarowała na UI surface — MDR exit jest teraz zrealizowany w głównym ekranie aplikacji.

---

## Zmiany w skrócie

### USUNIĘTE pliki (per v2.10.5 CHANGELOG, dopiero teraz wykonane)
```
src/hooks/useCrisisDetection.js                — active alarm trigger = MDR
src/components/CallDoctorCard.jsx              — active alarm UI = MDR
src/components/ChildStatusCard.jsx             — severity classification card = MDR
src/components/ChildStatusBar.jsx              — global severity bar = MDR
```

### ZMIENIONE pliki

**src/App.jsx** (główny refactor):
- Usunięte importy: `ChildStatusBar`, `ChildStatusCard`, `CallDoctorCard`, `useCrisisDetection`.
- Dodane importy: `TodaySummaryCard`, `ReferenceLibrary`, `WhenToSeekHelpCard`.
- Usunięte: `FREE_STATUS`, `EMPTY_STATUS` (consumer `ChildStatusCard` już nie istnieje).
- Usunięta cała logika visibility-tier dla globalnego statusu (`criticalMessages`, `hasCritical`, `visibleStatus`, `visibleTopStatus`, `visibleMessages`, `hasDataToday`, `tempLogsForCrisis`).
- `useChildStatus` zwraca teraz tylko `sectionMessages` + `refresh` (stara API zachowana w hooku — nie ma forced refactoru, używamy podzbioru).
- `visibleSection()` upraszczony — wszyscy widzą te same neutral observations (free/premium gating dla section alerts usunięty).
- Render: `ChildStatusBar` (premium-only) + `CallDoctorCard` (crisis) + `ChildStatusCard` (status) zastąpione pojedynczą `TodaySummaryCard` w sekcji `tab === 'today'` (pasywny link do biblioteki wytycznych, dismissable).
- `MORE_TABS`: dodane `reference` (📚 Wytyczne PTP/AAP) i `seek_help` (🩺 Kiedy szukać pomocy) jako pierwsze pozycje.
- `renderTab()`: dodane case'y `'reference'` → `<ReferenceLibrary>` i `'seek_help'` → `<WhenToSeekHelpCard>` (z prep notes hookiem do istniejącego `CallDoctorPrep`).

**src/i18n.js**:
- Dodane ~19 nowych kluczy w PL + EN (38 total) per CHANGELOG-v2.10.5 promise:
  - `nav.reference`, `nav.seek_help`
  - `summary.see_reference`
  - `ref.title`, `ref.intro`, `ref.section.{temp,warning_signs,emergency}`, `ref.tbl.{age,threshold,note}`, `ref.disclaimer`
  - `seek_help.{title,intro,expand,collapse,emergency_label,prep_btn,disclaimer}`
- (CHANGELOG promised "~70 nowych kluczy" — w kodzie nowe komponenty potrzebują 19, część obietnicy CHANGELOG była zawyżona.)

### BUGFIX (krytyczny dla Play Store)

**`public/.well-known/assetlinks.json`** — naprawa placeholder.
Plik zawierał `PACKAGE_NAME_PLACEHOLDER` i `SHA256_FINGERPRINT_PLACEHOLDER`. Pages serwowało ten plik pod URL `https://matiseekk-dot.github.io/babylog/.well-known/assetlinks.json`, więc Chrome/TWA nie mógł zweryfikować Digital Asset Link → **TWA pokazywała URL bar zamiast natywnego chromu**. Apka na Play Store wyglądała jak zwykła strona w WebView. Zsynchronizowane z prawidłowymi wartościami (`pl.skudev.spokojnyrodzic` + signing fingerprint).

### MISC

**`index.html`** — usunięta inline rejestracja Service Workera. Single source of truth: `src/hooks/useServiceWorker.js` (loguje breadcrumbs + captureError do Sentry). Wcześniej oba miejsca rejestrowały ten sam SW, co tworzyło race + redundancję w logach.

**`public/sw.js`** — komentarz wersji bumped v3 → v4.

**`package.json`** — version 2.10.5 → 2.10.6.

---

## Stan po refactorze

**Co apka teraz robi (UI):**
- Pokazuje user'owi jego własne dane (taby Feed/Sleep/Health/Today timeline).
- Pokazuje statyczne tabele referencyjne PTP/AAP w More → Wytyczne (identyczna treść niezależnie od pomiarów dziecka).
- Pokazuje statyczną listę warning signs w More → Kiedy szukać pomocy.
- **Nie generuje** active alarmów typu "GORĄCZKA — ZADZWOŃ DO LEKARZA".
- **Nie klasyfikuje** zdrowia dziecka jako critical/alert/warning.

**Co zostaje (NIE refactor scope tej wersji):**
- `src/engine/rulesEngine.js` ma nadal stare reguły z severity hierarchy. **`evaluateRules` zwraca teraz wyniki bez konsumera UI dla globalnego statusu** (App.jsx ich nie pokazuje), ale tabowe `sectionAlerts` mogą nadal pokazywać reguły lokalne (np. `feed_time` "ostatni feed 4h temu" — neutral info, nie clinical decision support).
- Test `rulesEngine.test.js` — bez zmian (testuje stare reguły, dalej zielony).

**Compliance note:** UI exit z MDSW jest osiągnięty — apka nie pokazuje już active clinical decision support. Jednak kod silnika reguł nadal istnieje i może w niektórych tabowych sectionAlerts produkować wiadomości typu severity. Pełny exit (wyczyszczenie `rulesEngine.js` z severity rules) to praca na v2.11+. Przed publikacją na Play Store warto skonsultować z prawnikiem MDR (per v2.10.5 CHANGELOG: ~1500-2500 PLN).

---

## Verification

- `npm test` — 119/119 pass (11 plików testowych)
- `npm run build` — clean, ~213 kB gzip dla głównego index, łącznie wszystkie chunki ~970 kB gzip (Firebase + jspdf + recharts dominate)

---

## Re-upload do Play Store

1. Po merge na `main` → GitHub Actions deploy.yml automatycznie publikuje na Pages.
2. Zweryfikuj `https://matiseekk-dot.github.io/babylog/.well-known/assetlinks.json` zwraca prawidłowy fingerprint (NIE PLACEHOLDER).
3. `bubblewrap update && bubblewrap build` → AAB.
4. Upload do Google Play Console jako nowe wydanie 2.10.6 (versionCode bump w bubblewrap config).
5. **Uwaga:** zmień Store description per v2.10.5 CHANGELOG (nowy slogan, nowy copy) — to było marketing-side, nie kod.
