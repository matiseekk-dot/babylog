# v2.10.5 — MDR EXIT REFACTOR

**Data:** 2026-04-26
**Cel:** Wyłączyć apkę z definicji Medical Device Software (MDSW) wg MDR Rule 11. Sprowadzić ryzyko prawne MDR z "wysokie" do "praktycznie zerowe".

---

## Zmiany w skrócie

Apka zmieniła *intended purpose* z **clinical decision support** na **health journal + reference library**.

**Co to znaczy:** Apka pokazuje user'owi (a) jego własne dane, (b) statyczne tabele PTP/AAP. Apka nie ocenia, nie alertuje, nie diagnozuje — tabele są IDENTYCZNE niezależnie od pomiarów dziecka.

To wyłącza apkę z definicji MDSW wg MDCG 2019-11, bo nie jest spełnione kryterium #2 ("output specific to that patient").

---

## NOWE pliki

```
src/data/referenceTables.js                    — statyczne tabele PTP/AAP
src/components/TodaySummaryCard.jsx            — neutralny journal summary
src/components/ReferenceLibrary.jsx            — UI dla statycznych wytycznych
src/components/WhenToSeekHelpCard.jsx          — statyczna lista warning signs
```

## ZMIENIONE pliki

```
src/engine/rulesEngine.js                      — bez statusów severity, neutralne observations
src/hooks/useChildStatus.js                    — zwraca summary + observations zamiast globalStatus
src/components/MedicalConsentScreen.jsx        — positive declaration + RODO art. 9 consent
src/i18n.js                                    — ~70 nowych kluczy PL+EN (consent.v2.*, summary.*, obs.*, ref.*, seek_help.*, nav.reference, nav.seek_help)
src/App.jsx                                    — usunięte: crisis detection, status hierarchy, FREE_STATUS/EMPTY_STATUS, severity rendering. Dodane: TodaySummaryCard, ReferenceLibrary, WhenToSeekHelpCard.
package.json                                   — version 2.10.4 → 2.10.5
```

## USUNIĘTE pliki

```
src/hooks/useCrisisDetection.js                — active alarm = MDR
src/components/CallDoctorCard.jsx              — active alarm UI = MDR
src/components/ChildStatusCard.jsx             — severity classification = MDR
src/components/ChildStatusBar.jsx              — severity classification = MDR
```

`CallDoctorPrep.jsx` ZOSTAJE — to pure data export (lista pytań do pediatry, brak crisis trigger). Dostępna teraz z WhenToSeekHelpCard.

---

## Kluczowe API zmiany

### useChildStatus — przed:
```javascript
const { globalStatus, topStatus, messages, sectionMessages, refresh } = useChildStatus(...)
// globalStatus.status: 'critical' | 'alert' | 'warning' | 'info' | 'ok'
```

### useChildStatus — po:
```javascript
const { summary, observations, sectionObservations, refresh } = useChildStatus(...)
// summary: { feeds, sleeps, sleepHours, lastTemp, medsToday, ... }
// observations: [{ type: 'info' | 'reference', title, message, source }]
// BEZ severity. Backwards-compat shim w rulesEngine.js zwraca puste/legacy values.
```

### evaluateRules — przed:
```javascript
const { messages, topStatus } = evaluateRules(ctx)
// messages[].status: 'critical'/'alert'/'warning'/'info'/'ok'
```

### evaluateRules — po:
```javascript
const { observations } = evaluateRules(ctx)
// observations[].type: 'info' | 'reference' (BEZ severity hierarchy)
```

### Reguły usunięte:
- temp_infant_emergency, temp_extreme, temp_critical, temp_alert, temp_young_infant
- combined_critical, no_entries_today, all_ok
- sleep_deficit, med_not_working, med_too_soon, med_daily_limit, med_expired

### Reguły zachowane (jako neutralne observations):
- temp_rising — fact obserwacyjny
- temp_reference_available — link do ReferenceLibrary
- feed_time — fakt: ostatnie karmienie X godzin temu
- med_interval_passed — neutralny timer
- med_count_24h — neutralny licznik dawek (info, nie alert)

---

## Co po wgraniu

1. `npm install` (jeśli node_modules nie ma)
2. `npm run dev` — przetestuj lokalnie
3. `npm run test` — wszystkie testy zielone (legacy klucze rule.* w i18n zachowane dla shim)
4. `npm run build` — produkcja
5. `git commit -am "v2.10.5: MDR exit refactor"`
6. `git push` — GitHub Pages deploy

## Test manualny po wdrożeniu

1. **Onboarding:** MedicalConsentScreen pokazuje pozytywną deklarację + 2 checkboxy (zrozumienie + RODO art. 9)
2. **TodayTab:** widać TodaySummaryCard z neutralnymi statystykami. BRAK kolorów alarmowych. BRAK badge "critical"
3. **Wpisz temp 39.5°C dla dziecka 4 mies.:** apka NIE generuje active alarmu. W summary card jest "Ostatnia temp: 39.5°"
4. **More → Wytyczne PTP/AAP:** pokazuje statyczną tabelę temperatur wg wieku
5. **More → Kiedy szukać pomocy:** statyczna lista warning signs + 112 + button "Lista pytań do pediatry"

---

## Zmiany Play Store (do zrobienia ręcznie)

### Store description PL — zmień slogan z:
~~"Aplikacja, która pomaga Ci wiedzieć co robić, gdy dziecko jest chore."~~

Na:
"Dziennik zdrowia dziecka. Twoje dane i wytyczne pediatryczne w jednym miejscu."

### Pełen nowy copy PL+EN:
W rozmowie z Claude jest plik `04-STORE-COPY-NEW.md` — wklej zawartość do Play Console.

### Privacy policy:
Zmień `public/privacy.html` zgodnie z `05-PRIVACY-POLICY-DELTA.md` — dodaj art. 9 RODO consent, Schrems II info, IDENTYFIKACJĘ administratora.

---

## Async (po deployu)

1. **Konsultacja prawna MDR** (~1500-2500 PLN, DZP / DLA Piper / Sobota Jachira)
   - Cel: pisemna opinia "Class I, exempt from notified body"
2. **Polisa OC** dewelopera oprogramowania (~500-1500 PLN/rok, ERGO Hestia / PZU)
3. **Akcept DPA Firebase** (Firebase Console → Project settings → Account settings)
4. **Notyfikacja secondary employment do ING** przed launchem

---

## Backwards compat

- Stare klucze i18n `rule.*`, `crisis.*`, `status.alert/warning/critical` — **zachowane**, używane przez shim w rulesEngine.js
- `useChildStatus` zwraca shim values dla `globalStatus`, `topStatus`, `messages`, `sectionMessages` — istniejące komponenty (np. SectionAlerts w innych tabach) nie wybuchną
- W v2.11+ usuniesz shim razem z legacy kluczami

## Istniejące user accept consent v1.0

Obecni userzy z `med_disclaimer_version='1.0'` i `babylog_medical_consent_v1='1'` w localStorage NIE muszą re-acceptować — kod traktuje v1.0 i v2.0 jako equivalent. Tylko nowi userzy zobaczą nowy ekran consent.

---

## Plus marketing reframe (osobny dokument 04-STORE-COPY-NEW.md)

Slogan PL:
- ~~"Aplikacja, która pomaga Ci wiedzieć co robić..."~~
- "Dziennik zdrowia dziecka. Twoje dane i wytyczne pediatryczne w jednym miejscu."

Slogan EN:
- ~~"Calm Parent — know what to do when your child is sick."~~
- "Child Health Journal. Your data and AAP guidelines in one place."

Pełen copy w `04-STORE-COPY-NEW.md` z poprzedniej paczki.
