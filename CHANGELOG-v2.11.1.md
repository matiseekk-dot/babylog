# v2.11.1 — i18n leftovers fix (manual QA pass)

**Data:** 2026-05-03
**Cel:** Hot-fix dla bugów wykrytych w manualnym teście EN (Polish strings wyciekały do angielskiej wersji).

---

## TŁO

Po v2.11.0 (full MDR exit) odpaliłem app w trybie testera w obu wersjach językowych. Wszystkie nowe komponenty (TodaySummaryCard, ReferenceLibrary, WhenToSeekHelpCard) renderowały się poprawnie po PL i EN. Wszystkie krytyczne flow MDR exit zweryfikowane (38.5°C i 40.6°C u 5-mies. dziecka NIE pokazują żadnego banneru alarmowego).

ALE — w EN wykryłem 3 hardkodowane stringi PL które nie były zlokalizowane:

## Bugi naprawione

### 1. `SleepTab.jsx:188` — "sesje snu" hardkodowane
Statystyka "sleep sessions" w SleepTab pokazywała się jako "sesje snu" niezależnie od locale. Wcześniej `<div className="stat-lbl">sesje snu</div>` zamiast `t('sleep.sessions_label')`. Dodany nowy klucz `sleep.sessions_label` (PL: "sesje snu", EN: "sleep sessions").

### 2. `TodayTab.jsx:138` — surowy `l.method` bez tłumaczenia
Timeline w Today pokazywała wpisy temperatury jako `40.6°C · Odbytniczo` nawet po przełączeniu na EN. Bug: `sub: l.method ? \` · ${l.method}\` : ''` zamiast `displayMethod(l.method)`. Helper `displayMethod` istnieje w `utils/helpers.js` i mapuje wewnętrzne polskie etykiety (`'Odbytniczo'`, `'Pod pachą'`, etc.) na zlokalizowane stringi przez `t('temp.method.*')`. Po fix Today timeline używa tej samej translacji co TempTab i HistorySection.

### 3. `interpretations.js:94` — fallback "Ostatni pomiar:" hardkodowany
W `interpretTemp()` gdy mniej niż 3 pomiary, detail line była zhardkodowana po polsku: `\`Ostatni pomiar: ${temp.toFixed(1)}°C\``. Po EN switch zostawała w PL. Dodany klucz `interp.temp.last_measurement` (PL: "Ostatni pomiar: {temp}°C", EN: "Last measurement: {temp}°C") + użyty przez `t()`.

## Verification

- `npm test` → 119/119 pass (11 plików)
- `npm run build` → clean
- Manualny test po fixach:
  - PL: "Sleep" tab pokazuje "0 sesje snu" ✓
  - PL: Today timeline pokazuje "40.6°C · Odbytniczo" ✓
  - PL: TempTab card pokazuje "Ostatni pomiar: 40.6°C" ✓
  - EN: "Sleep" tab pokazuje "0 sleep sessions" ✓
  - EN: Today timeline pokazuje "40.6°C · Rectal" ✓
  - EN: TempTab card pokazuje "Last measurement: 40.6°C" ✓

## MDR exit re-verification (po fixach)

Powtórzony krytyczny flow w PL i EN — temperatura 38.5°C i 40.6°C u 5-mies. dziecka:
- ❌ Brak banneru "ZADZWOŃ DO LEKARZA" / "Call doctor"
- ❌ Brak statusu critical/alert/warning
- ❌ Brak crisis card
- ✅ Tylko neutralna etykieta `temp.label.high_fever` ("Wysoka gorączka" / "High fever") jako kategoria pomiaru — to statyczna labelka temperatury (nie z rulesEngine), MDR-friendly.
- ✅ Tylko trend "↑ Rośnie" / "↑ Rising" — fakt obserwacyjny z wykresu, nie ocena kliniczna.

## Orphan i18n keys (nie usunięte, niska priority)

W `i18n.js` zostały klucze które już nie mają konsumenta po MDR exit refactorze (v2.10.6 + v2.11.0):
- `status.free.*`, `status.empty.*`, `status.upgrade_cta`, `status.{ok,info,warning,alert,critical}`
- `crisis.{watch,call,emergency,action,reason,severity}.*`

Mogą zostać do v2.12 cleanup pass — nieużywane klucze nie wpływają na bundle size (dead code elimination ich pomija) i ich usunięcie nie daje korzyści, a niesie ryzyko że gdzieś jednak są używane przez sidekick komponenty PdfReportModal/SettingsScreen.

## Versionning

- `package.json`: 2.11.0 → 2.11.1
- SW comment: bez zmian (cache name v5 nadal obowiązuje, brak invalidation needed bo to tylko UI strings)
