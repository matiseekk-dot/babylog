# Play Store — English Variants (dodatkowe rynki)

**Cel:** Dodać apkę do angielskojęzycznych rynków gdzie EN jest naturalne, używając już przygotowanych EN assets. Zero nowej pracy — tylko copy-paste w Play Console.

**Efekt:** Potencjalne +100-500 organic instalacji miesięcznie za darmo, bez ryzyka „not in my language" recenzji.

---

## 🎯 Priorytet rynków (od najlepszych do dodania)

| Locale | Kraj | EN speakers | ARPU | Priorytet | Uzasadnienie |
|---|---|---|---|---|---|
| **en-GB** | United Kingdom | 60M | Wysoki | ⭐⭐⭐ 1 | Największy EU EN rynek, dobra siła nabywcza |
| **en-AU** | Australia | 25M | Bardzo wysoki | ⭐⭐⭐ 2 | Wysokie ARPU, kultura app-buying |
| **en-CA** | Canada | 30M | Wysoki | ⭐⭐⭐ 3 | Podobne do USA, ale niższe CPI |
| **en-IN** | India | 500M+ | Niski | ⭐⭐ 4 | Ogromny volume, niski ARPU. Ale zwiększa MAU |
| **en-PH** | Philippines | 100M+ | Średni | ⭐⭐ 5 | Dobry app-buying rynek, przyjazny EN |
| **en-SG** | Singapore | 6M | Bardzo wysoki | ⭐⭐ 6 | Mały pool, ale bogaci EN speakers |
| **en-IE** | Ireland | 5M | Wysoki | ⭐ 7 | Mały pool, ale EU market |
| **en-NZ** | New Zealand | 5M | Wysoki | ⭐ 8 | Mały pool, ale bogaci |
| **en-ZA** | South Africa | 60M | Niski | ⭐ 9 | Duży pool, ale niskie ARPU |

**Rekomendacja start:** dodaj **en-GB + en-AU + en-CA + en-IN** (4 kraje, 10-15 min pracy). Reszta po tygodniu jak zobaczysz efekt.

---

## 📋 CO WKLEJAĆ DO PLAY CONSOLE

**Dla WSZYSTKICH English variants — użyj DOKŁADNIE tych samych assets co en-US.** Google Play automatycznie konwertuje cenę na lokalną walutę (£, A$, C$, ₹, itd.).

### Nazwa, krótki i pełny opis
Skopiuj z sekcji **🇬🇧 EN** w [appstore-copy.md](appstore-copy.md) — jedno źródło tekstu dla en-US i wszystkich wariantów.
Cennik w tym opisie jest bez waluty, więc pasuje do każdego kraju.

### Feature graphic (1024×500)
```
store-assets/feature-graphic-en-2026-09-v2.png
```

### Screenshots (7 sztuk, 1080×2160)
```
store-assets/screenshots-2026-09/en/01-today.png
store-assets/screenshots-2026-09/en/02-temperature.png
store-assets/screenshots-2026-09/en/03-meds.png
store-assets/screenshots-2026-09/en/04-reference-library.png
store-assets/screenshots-2026-09/en/05-when-to-seek-help.png
store-assets/screenshots-2026-09/en/06-feed.png
store-assets/screenshots-2026-09/en/07-shared-account.png   ← przeciągnij na 2. miejsce
```

---

## 🖱️ KROK PO KROKU w Play Console (per język)

**1.** Play Console → Store presence → **Main store listing**

**2.** Górny language selector → kliknij **„Zarządzaj tłumaczeniami"** / **„Add translation"**

**3.** Wybierz z listy `English (United Kingdom)` [pierwszy raz] → dodaj

**4.** Language selector → przełącz na **English (United Kingdom)**

**5.** Wklej po kolei:
   - **Nazwa aplikacji**: `Calm Parent: Baby Development`
   - **Krótki opis** i **Pełny opis**: sekcja 🇬🇧 EN w appstore-copy.md

**6.** Graphics → **Feature graphic** → wgraj `store-assets/feature-graphic-en-2026-09-v2.png`

**7.** Graphics → **Phone screenshots** → wgraj 7 plików z `store-assets/screenshots-2026-09/en/` (07-shared-account jako drugi)

**8.** (Opcjonalnie) Graphics → **7-inch tablet screenshots** → wgraj te same 6 plików EN

**9.** **Zapisz** wersję roboczą

**10.** Powtórz dla en-AU, en-CA, en-IN (i pozostałe jak chcesz)

**11.** Gdy wszystkie 4 gotowe → **Wyślij do sprawdzenia** (jedna zbiorcza recenzja Google)

---

## ⏱️ Realistyczne oczekiwania

- **Czas pracy:** 3-5 minut per język = 12-20 minut na 4 kraje
- **Google akceptacja:** 1-3 dni robocze
- **Efekt organic:**
  - en-GB: 50-200 instalacji/mc (za darmo!)
  - en-AU: 20-80/mc
  - en-CA: 30-100/mc
  - en-IN: 100-500/mc (duży volume, ale user'y głównie free)

**Suma:** 200-880 dodatkowych instalacji miesięcznie **bez wydawania grosza**.

---

## ⚠️ Uwagi

**Ceny per rynek:** Play Console w sekcji „In-app products" ma cenę per region. Sprawdź czy dla nowo dodanych rynków (UK £, AU A$, CA C$, IN ₹) są ustawione ceny — inaczej Google użyje auto-conversion (może wyjść dziwna cena jak 92,45 ZAR).

Sugerowane cenniki „psychological pricing":
- **UK**: £2.99 / £19.99
- **AU**: A$4.99 / A$34.99
- **CA**: C$4.99 / C$29.99
- **IN**: ₹99 / ₹599 (India rynek bardzo cenowo wrażliwy — obniż o 50% vs Zachód)
- **PH**: ₱149 / ₱899
- **SG**: S$4.99 / S$29.99
- **IE / NZ / ZA**: auto FX z EUR / USD

Ustawianie: Play Console → **Monetize → Products → Subscriptions** → wybierz SKU → **Region availability & pricing** → per country.

**British spelling vs American:** Wszystkie moje EN teksty są w American English („pediatrician", „color", „behavior"). Dla en-GB/en-AU/en-NZ/en-IE możesz podmienić na British („paediatrician", „colour", „behaviour") — ale to opcjonalne. British userzy rozumieją American bez problemu, plus Google indexuje pod obie spellings.

**Wideo YouTube:** Puste dla wszystkich — jak nagrasz kiedyś teaser 15-30s, wystarczy dodać 1 URL i będzie widoczne we wszystkich English variants.

---

## 📊 Priorytet inwestycji czasu (moja rekomendacja)

1. **NAJPIERW** — kończ Google Ads PL kampanię (dziś)
2. **JUTRO** — dodaj en-GB + en-AU + en-CA + en-IN do Play Store (12 min)
3. **ZA TYDZIEŃ** — jak PL Ads pokazuje results, stwórz osobną kampanię EN Ads (targetuje UK+AU+CA+US)
4. **ZA 2 TYGODNIE** — sprawdź metryki, iteruj

Nie próbuj wszystkiego naraz. Play Store organic to długoterminowy compound growth, Google Ads to szybki feedback loop.
