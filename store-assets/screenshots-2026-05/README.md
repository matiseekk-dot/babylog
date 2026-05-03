# Spokojny Rodzic — Play Store Screenshots (2026-05-03)

**Wersja apki:** 2.11.5
**Locale:** PL + EN
**Rozdzielczość:** 1080×2160 (DPR 2.5 z viewport 432×864)
**Format:** PNG, 24-bit, no alpha
**Aspect ratio:** 1:2 (mieści się w Play Store rule "max dimension max 2× min")

## Pliki

```
pl/
├── 01-today.png              — Today dashboard z 4 KPI + timeline 15 wpisów
├── 02-temperature.png        — Health → Temperatura, wykres + trend insight
├── 03-meds.png               — Health → Leki, ulotki Paracetamol + Ibuprofen
├── 04-reference-library.png  — Wytyczne PTP/AAP (statyczna biblioteka)
├── 05-when-to-seek-help.png  — Kiedy szukać pomocy + 112
└── 06-feed.png               — Karmienia z quick action buttons + historia

en/
├── 01-today.png              — Same as PL but English UI ("Calm Parent")
├── 02-temperature.png        — Health → Temperature with chart
├── 03-meds.png               — Health → Medicine, AAP/SmPC info
├── 04-reference-library.png  — AAP/PTP guidelines + dual °C/°F table
├── 05-when-to-seek-help.png  — When to seek help + 112
└── 06-feed.png               — Feeding tab
```

## Sugerowana kolejność dla Play Console

Play Store pozwala max 8 screenshotów per locale, min 2.
Sugerowana wersja Hero (pierwsze 4):

1. **01-today.png** — pierwsze wrażenie: bogaty dashboard z realnymi danymi pokazuje co apka robi.
2. **04-reference-library.png** — kluczowy dla MDR framing: "statyczna biblioteka wytycznych pediatrycznych". Nie jest decision support, tylko reference material.
3. **02-temperature.png** — wykres temperatury + neutralna obserwacja "Temperatura rośnie". Bez critical alertów (po MDR exit).
4. **05-when-to-seek-help.png** — pasywna lista warning signs + numer alarmowy 112.

Bonus (5-6):
5. **03-meds.png** — info o lekach z ulotek (ChPL/SmPC).
6. **06-feed.png** — quick logging karmień.

## Po stronie Play Console

1. **Production / Internal Testing track** → Store listing → Graphics
2. Dla **Polski** locale: upload pl/01..06.png
3. Dla **English** locale: upload en/01..06.png
4. (opcjonalnie) Tablet 7"/10" — pominąć, albo użyć tych samych (Play Store je przeskaluje)

## Re-generacja

Wszystkie screenshoty są wygenerowane skryptem `scripts/generate-screenshots.mjs`
przy pomocy `puppeteer-core` + lokalnie zainstalowany Chrome. Jak coś się
zmieni w UI:

```bash
# Najpierw odpal dev server (port 5173):
npm run dev

# W drugim terminalu:
node scripts/generate-screenshots.mjs
```

Skrypt sam:
- Uruchamia headless Chrome (z `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`)
- Tworzy 2 sesje: PL + EN
- Wstrzykuje realistic test data do localStorage (Zosia, 8 mies., 5 karmień, 2 sny, 4 pieluchy, 4 pomiary temperatury, 1 paracetamol, 1 pomiar wzrostu)
- Klika przez nawigację (Today → Health → Temperatura → ...)
- Zapisuje 6 PNG per locale w 1080×2160

## Demo profile

Dane realistyczne:
- **Imię:** Zosia, 🌸, 8 miesięcy
- **Trial:** 11 dni (3-day-old trial, 14-day total)
- **Today:**
  - 5 karmień (2× pierś lewa, 2× pierś prawa, 1× butelka 150ml)
  - 2 drzemki (75min + 90min = 2h 45m)
  - 4 pieluchy (3× mokra, 1× brudna)
  - 4 pomiary temp: 37.2°C → 37.4°C → 37.6°C (po paracetamolu) — pokazuje rosnący trend
  - 1 dawka Paracetamol 2.5ml o 14:00
- **Yesterday:** 1 pomiar wzrostu 8.2kg / 69cm / 44cm

## MDR-friendly framing widoczny na zrzutach

- Screen 04: "Statyczna biblioteka — tabele referencyjne PTP/AAP. Identyczna treść niezależnie od danych Twojego dziecka. Materiał do przeczytania, nie diagnoza."
- Screen 05: "Lista objawów alarmowych według PTP/AAP. Otwórz, gdy chcesz przejrzeć — apka nie sugeruje nic na podstawie wpisów Twojego dziecka."
- Screen 02: Trend "Temperatura rośnie ↑" (neutralna obserwacja, nie ocena kliniczna)
- Brak banera "ZADZWOŃ DO LEKARZA" na żadnym screenshot.
