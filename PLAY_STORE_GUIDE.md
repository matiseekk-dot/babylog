# Instrukcje — co zrobić żeby wypuścić apkę na Play Store

Claude przygotował wszystko co mógł. Oto 4 rzeczy wymagające Twojego działania.

---

## 1. Production RevenueCat Key (5 min)

**Po co:** Z test keyem w produkcji żaden zakup nie zadziała. Google Play odrzuci apkę.

### Kroki

1. Wejdź na https://app.revenuecat.com → zaloguj się
2. Wybierz projekt **BabyLog** (lub jak go nazwałeś)
3. Lewe menu → **Project settings** → **API keys**
4. Zobaczysz dwa klucze:
   - `test_dlpwNXCBXNyWZnEUuRbMbIjAqbn` — obecny, zdeinstaluj
   - `goog_XXXXX...` — production key, skopiuj

5. W projekcie otwórz plik `src/hooks/useRevenueCat.js`
6. Znajdź linię z `test_dlpwNXCBXNyWZnEUuRbMbIjAqbn` — zastąp ją production keyem
7. Commit → push

**Uwaga:** Production key też jest publiczny (leci z frontendu), RevenueCat validuje transakcje po stronie serwera. To jest bezpieczne.

---

## 2. Screenshoty z aplikacji (2h)

**Po co:** Play Store wymaga minimum 2 screenshotów. Zrzuty sprzedają apkę — 80% konwersji zależy od tego co widać.

### Przygotowanie

1. Otwórz apkę na **prawdziwym telefonie Android** (Chrome) pod URL `https://matiseekk-dot.github.io/babylog/`
2. Dodaj ją do ekranu głównego: Chrome menu → **Add to Home screen**
3. Otwórz z ekranu głównego — będzie wyglądać jak native app (fullscreen)

### 8 screenshotów do zrobienia (w tej kolejności)

**Screen 1 — Ekran główny (najważniejszy, będzie pierwszy)**
- Dodaj pomiar temperatury 38.7°C (żeby pokazać Call Doctor Card)
- Dodaj 3 karmienia, 1 sen, 2 pieluchy — żeby stat cards nie były puste
- Zrzut głównego ekranu z aktywnym statusem + Call Doctor card

**Screen 2 — Call Doctor Mode**
- Ustaw temperaturę na 39.7°C
- Zrzut pełnego Call Doctor Card (orange) z przyciskiem "Zadzwoń do pediatry"
- Caption do PS: "Wiesz kiedy zadzwonić — apka doradza w kryzysie"

**Screen 3 — Karmienie z quick buttons**
- Otwórz tab Karmienie
- Zrzut z widocznymi 3 dużymi przyciskami (Lewa/Prawa/Butelka)
- Widoczny streak badge "🔥 5" w topbarze

**Screen 4 — Temperatura z wykresem**
- Dodaj 5-6 pomiarów w ciągu ostatnich godzin (różne wartości 36.5-38.8)
- Zrzut TempTab z wykresem 24h + trend badge
- Pokaż InlineInsight "Temperatura rośnie"

**Screen 5 — Kalkulator leków**
- Otwórz Leki
- Zrzut kalkulatora na górze (Paracetamol + Ibuprofen z dawkami)
- Widoczne pending reminders

**Screen 6 — Paywall**
- Kliknij badge "🔒 Free" w topbarze
- Zrzut ekranu paywallu z 3 planami (yearly jako popular)
- Widoczne testimoniale

**Screen 7 — Onboarding ekran 3**
- Wyloguj się i zacznij od nowa LUB zrzut z emulatora
- Slajd "Wiedz co zrobić" z żółtym accent

**Screen 8 — Ustawienia + PDF export**
- Otwórz gear icon → Settings
- Zrzut z widoczną kartą "Eksport danych" z przyciskiem PDF

### Wymagania techniczne Play Store

- Format: PNG lub JPEG
- Min wysokość: 320 pixeli
- Max wysokość: 3840 pixeli
- Phone screens: długie boki mogą być w zakresie 16:9 - 9:16

### Jak zrobić screenshot na Androidzie

- **Power + Volume Down** jednocześnie przez 0.5s
- Screenshoty lądują w Galerii → folder "Screenshots"
- Wyślij je do siebie przez Google Drive lub WhatsApp

### Opcjonalnie — ładniejsze screenshoty

Jeśli chcesz screenshoty z ramką telefonu (jak profesjonalne apki):

1. Wejdź na https://mockuphone.com
2. Upload goły screenshot
3. Wybierz Android device (Pixel)
4. Download z ramką

Zrób tylko dla **1-2 głównych screenshotów** (te co pokazują value prop). Reszta może być bez ramki — Play Store to akceptuje.

---

## 3. PWABuilder → .aab + assetlinks.json (30 min)

**Po co:** Zamienia PWA na natywną apkę Android (TWA) którą można wrzucić na Play Store.

### Kroki

1. Wejdź na https://www.pwabuilder.com
2. W pole URL wpisz: `https://matiseekk-dot.github.io/babylog/`
3. Kliknij **Start**
4. Poczekaj ~30s na skanowanie. Ocena powinna być żółta/zielona (manifest + SW + icons)
5. Kliknij **Package for Stores** w prawym górnym rogu
6. Wybierz **Android**
7. Kliknij **Generate Package**

### Opcje pakowania

| Pole | Wartość |
|---|---|
| Package ID | `pl.skudev.spokojnyrodzic` |
| App name | `Spokojny Rodzic` |
| Launcher name | `Spokojny Rodzic` |
| App version | `1.0.0` |
| App version code | `1` |
| Display mode | `Standalone` |
| Status bar color | `#1D9E75` |
| Navigation color | `#ffffff` |
| Signing key | **Use my own** (jeśli masz klucz PS5 Vault) LUB **Create new** |
| Fallback behavior | `Custom tabs` |

**Jeśli tworzysz nowy klucz** — PWABuilder wygeneruje ZIP z keystore. **Zachowaj go w bezpiecznym miejscu** (Drive + dysk lokalny). Bez niego nie zaktualizujesz apki w przyszłości.

### Co dostaniesz w ZIP

- `app-release-signed.aab` ← to wrzucasz do Play Store
- `assetlinks.json` ← to wrzucasz do repo
- `signing.keystore` + `signing-key-info.txt` ← zachowaj w tajemnicy!

---

## 4. Wgrać assetlinks.json do repo (5 min)

**Po co:** Bez tego Android pokaże pasek adresu Chrome zamiast fullscreen. PWA nie będzie wyglądać jak native app.

### Kroki

1. Otwórz `assetlinks.json` z ZIP od PWABuilder — powinno wyglądać tak:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "pl.skudev.spokojnyrodzic",
    "sha256_cert_fingerprints": [
      "AB:CD:EF:12:34:..."
    ]
  }
}]
```

2. W GitHub Desktop otwórz repo `babylog`
3. Przejdź do folderu `public/.well-known/`
4. Otwórz plik `assetlinks.json` (obecnie jest placeholder)
5. Wklej zawartość z PWABuilder, nadpisując
6. Commit: "Add real assetlinks.json for TWA"
7. Push

Poczekaj 2-3 min na deploy GitHub Pages. Sprawdź w przeglądarce:

```
https://matiseekk-dot.github.io/babylog/.well-known/assetlinks.json
```

Powinno pokazać JSON który wkleiłeś (nie 404).

---

## Po tych 4 krokach

Masz wszystko co potrzeba do Play Store Internal Testing:

- `.aab` do upload
- Ikonę 512×512
- Feature Graphic 1024×500 (PL + EN)
- Privacy Policy URL
- Konto RevenueCat z production keyem
- assetlinks.json wgrany

### Play Console — kolejność wypełniania

1. Main store listing (opis PL + EN, ikona, feature graphic, screenshoty)
2. Store settings — Category: `Medical`, Tags: `Health & Fitness`
3. App content:
   - Privacy Policy URL: `https://matiseekk-dot.github.io/babylog/privacy.html`
   - Data safety questionnaire — zaznacz: Email, User IDs, Health info
   - Ads: No
   - Target audience: 18+
4. Testing → Internal testing → Create release
5. Upload `.aab`
6. Release notes: `Pierwsza wersja — Spokojny Rodzic`
7. Review release → Start rollout to internal testing
8. Dodaj email testers (Ty + 3-5 znajomych)

Internal testing **nie wymaga review Google** — dostępne natychmiast dla zaproszonych.

---

## Timeline

| Etap | Czas |
|---|---|
| RevenueCat key swap | 5 min |
| Screenshoty | 2h |
| PWABuilder → .aab | 30 min |
| assetlinks.json commit | 5 min |
| Play Console setup | 1-2h |
| **Razem do Internal Testing** | **~4h** |
| Testing przez 14 dni | 2 tygodnie |
| Production release | 2-3 dni review Google |

**Realistyczny launch:** 3 tygodnie od teraz.

---

## Po launchu

1. Wgraj do Internal Testing — testuj sam 3 dni
2. Zaproś 3-5 testerów (znajomi z małymi dziećmi)
3. Zbieraj feedback 7-14 dni
4. Popraw największe bugi
5. **Closed testing** (20 testerów, 14 dni) — wymagane przed production
6. **Production release** — rollout 10% → 50% → 100%

Nie wypuszczaj od razu na 100%. Rollout stopniowy pozwala wykryć crashy zanim dotkną wszystkich.
