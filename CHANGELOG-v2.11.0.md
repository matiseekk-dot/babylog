# v2.11.0 — Full MDR exit (rules-engine refactor)

**Data:** 2026-05-03
**Cel:** Dokończyć MDR exit refactor zadeklarowany w CHANGELOG-v2.10.5 — usunąć severity-classified rules z silnika reguł, tak żeby apka nie mogła już produkować klinicznych klasyfikacji `critical`/`alert`/`warning` na poziomie kodu (nie tylko UI).

**Poprzednie:** v2.10.6 (MDR exit na poziomie UI, App.jsx).

---

## TŁO

v2.10.6 usunęło **konsumpcję** severity messages z UI — `ChildStatusBar`, `ChildStatusCard`, `CallDoctorCard`, `useCrisisDetection` zostały wyrzucone z App.jsx. To wystarczyło, żeby apka nie krzyczała globalnie "ZADZWOŃ DO LEKARZA". Ale silnik reguł (`src/engine/rulesEngine.js`) nadal **produkował** wiadomości typu `status: 'critical'`, `status: 'alert'` — i tabowe `sectionAlerts` (np. `<TempTab sectionAlerts={...}>`) mogły je nadal renderować jako kolorowe banery.

v2.11.0 zamyka tę dziurę: silnik nie produkuje już żadnej klasyfikacji severity. Wszystkie zachowane reguły zwracają neutralne `status: 'info'` observations.

---

## Zmiany

### `src/engine/rulesEngine.js` — pełny rewrite

**Usunięte reguły** (per CHANGELOG-v2.10.5 promise):
- `temp_infant_emergency` (niemowlak <3mo + 38°C → `critical`)
- `temp_extreme` (≥40.5°C → `critical`)
- `temp_critical` (≥39°C → `critical`)
- `temp_alert` (≥38.5°C → `alert`)
- `temp_young_infant` (3-6mo + 38°C → `alert`)
- `temp_no_drop_after_med` (brak spadku 2h po leku → `alert`)
- `med_expired` (minął czas działania leku → `info`)
- `med_too_soon` (kolejna dawka za wcześnie → `info`)
- `med_daily_limit` (4× paracetamol → `alert`)
- `sleep_deficit` (sen poniżej normy → `warning`)
- `combined_critical` (gorączka + brak snu + brak jedzenia → `critical`)
- `no_entries_today` (brak wpisów do południa → `info`)
- `all_ok` (wszystko w normie → `ok`)

**Zachowane reguły** (jako neutralne `status: 'info'` observations):
- `temp_rising` — fakt obserwacyjny "ostatnie 3 pomiary rosną" (status zmienione z `warning` na `info`)
- `feed_time` — fakt "ostatnie karmienie X godzin temu" (już było `info`)

**Public API** — backward-compat shim:
- `evaluateRules(ctx)` zwraca `{messages, topStatus}` jak wcześniej, ale `topStatus` to teraz tylko `'ok'` lub `'info'`. Hierarchy `critical > alert > warning > info > ok` skompresowała się do `info > ok`.
- `STATUS_RANK`, `higherStatus`, `getGlobalStatus`, `getSectionMessages`, `minutesSince` — eksporty zachowane (legacy konsumenci).

### `src/engine/rulesEngine.test.js` — przepisane

- Usunięte testy weryfikujące severity rules (które sprawdzały `result.messages.find(m => m.status === 'critical')` itp.).
- Zastąpione **negative tests** — sprawdzają, że dawne progi NIE produkują już severity messages:
  - "niemowlak <3mo + temp 38.2°C → BRAK critical/alert (MDR exit)"
  - "temp 40.6°C → BRAK critical (MDR exit, brak progów klinicznych)"
  - "4× paracetamol w 24h → BRAK alert (MDR exit, neutralny silnik)"
- Dodane positive tests dla zachowanych reguł:
  - "temp_rising: 3 rosnące pomiary → info observation"
  - "temp_rising NIE odpala dla pomiarów nierosnących"
- Dodany kontrakt API: "topStatus zawsze 'ok' lub 'info' (brak severity hierarchy)".
- 9 testów w pliku (tyle samo co przed), wszystkie zielone.

### `package.json` + `public/sw.js`

- Wersja: 2.10.6 → 2.11.0.
- SW comment v4 → v5 (cache name nie używany dla fetch, więc bezpieczne).

---

## Stan compliance po v2.11.0

**Co apka pokazuje:**
- Dane dziecka (taby Feed/Sleep/Health/Today timeline).
- Statyczne tabele referencyjne PTP/AAP w More → "Wytyczne".
- Statyczna lista warning signs w More → "Kiedy szukać pomocy".
- Maksymalnie neutralne observations w sekcjach (`info` only) — np. "Ostatnie 3 pomiary temperatury rosną: 37.2 → 37.6 → 38.0".

**Czego apka NIE robi:**
- NIE klasyfikuje zdrowia dziecka jako critical/alert/warning.
- NIE generuje active alarms typu "ZADZWOŃ DO LEKARZA".
- NIE łączy danych w "diagnozę" (combined_critical usunięte).
- NIE pokazuje "wszystko OK" / "potrzebna pomoc" jako podsumowania pomiarów.

**MDR ocena:**
- Software, które tylko pokazuje user'owi (a) jego własne dane, (b) statyczne tabele referencyjne, NIE wpada pod definicję MDSW wg MDCG 2019-11 (brak kryterium #2: "output specific to that patient").
- Apka jest teraz na poziomie "health journal + reference library" — analogiczna do papierowego dzienniczka pediatrycznego z ulotką PTP w środku.
- **Nadal zalecana konsultacja prawna MDR** przed publikacją (~1500-2500 PLN, opinia "Class I, exempt from notified body" lub "out-of-scope"). Decyzja MDR jest zawsze case-by-case, zależna od marketing copy i intended purpose.

---

## Verification

- `npm test` — 119/119 pass (11 plików, 9 testów rulesEngine zaktualizowanych)
- `npm run build` — clean. Index chunk 496 → 490 kB (lekki spadek z usuniętych reguł)

---

## Re-upload do Play Store

Patrz CHANGELOG-v2.10.6.md — kroki bubblewrap są takie same. Nowy versionCode w bubblewrap config dla 2.11.0.

**Zalecane (per v2.10.5 CHANGELOG):**
- Konsultacja MDR (~1500-2500 PLN).
- Polisa OC dewelopera oprogramowania.
- Slogan/copy w Play Console: nowa wersja, zaktualizować na "Dziennik zdrowia dziecka. Twoje dane i wytyczne pediatryczne w jednym miejscu." (z poprzedniego CHANGELOG-v2.10.5).
- Privacy policy update per `05-PRIVACY-POLICY-DELTA.md` (nie wykonane przez tę sesję — z brakiem dostępu do tego pliku).
