# 🚀 Production Setup — Spokojny Rodzic

Ten dokument zawiera wszystko czego potrzebujesz do uruchomienia produkcji:
- **Sentry** (error monitoring)
- **RevenueCat** (Premium billing)
- **Google Play Billing** (produkty subskrypcji)
- **PDF raport** (już zintegrowany, tylko testy)

---

## 📋 Checklist przed wdrożeniem Production

- [ ] Sentry — konto + DSN w `.env`
- [ ] RevenueCat — konto + public key w `.env`
- [ ] Google Play Console — 3 produkty subskrypcji
- [ ] RevenueCat — offerings + entitlement "Spokojny Rodzic Pro"
- [ ] `.env` uzupełnione (nie commitowane na GitHub!)
- [ ] `.env.example` jest na GitHubie (szablon bez kluczy)
- [ ] Build bez errorów: `npm run build`
- [ ] 44/44 testów zielone: `npm test`
- [ ] Nowy `.aab` z podbitą wersją
- [ ] Test payment flow z testerem Google Play (nie Twoje konto!)

---

## 🛡️ 1. Sentry Setup (15 min)

### Krok 1: Załóż konto

1. Wejdź na <https://sentry.io/signup/>
2. Zarejestruj się (free tier daje 5000 errorów/miesiąc — wystarczy na start)
3. Po zalogowaniu: **Create Project** → **React**
4. Project name: `spokojny-rodzic`
5. Organization: Twoje imię albo `skudev`

### Krok 2: Skopiuj DSN

Po stworzeniu projektu zobaczysz DSN w formacie:
```
https://abc123def456@o1234567.ingest.sentry.io/9876543
```

Jeśli go nie widzisz: **Settings → Projects → spokojny-rodzic → Client Keys (DSN)**

### Krok 3: Wstaw DSN do `.env`

W repozytorium projektu:

```bash
# Jeśli nie masz jeszcze pliku .env:
cp .env.example .env

# Otwórz .env i uzupełnij:
VITE_SENTRY_DSN=https://abc123def456@o1234567.ingest.sentry.io/9876543
```

⚠️ **NIGDY nie commituj `.env`** — jest w `.gitignore`, ale sprawdź.

### Krok 4: Zainstaluj pakiet

```bash
npm install @sentry/react
```

### Krok 5: Test w produkcji

Build + deploy:
```bash
npm run build
git add .
git commit -m "Enable Sentry monitoring"
git push
```

Po wdrożeniu, w apce wywołaj `throw new Error("Test sentry")` z konsoli — pojawi się w Sentry Issues w ciągu minuty.

### Co Sentry Cię ochroni

- White screen bugs (Component crashed)
- Network errors (Firestore połączenie padło)
- Unhandled promises
- Exceptions w render

**Nie łapie:** logika biznesowa (np. "kalkulator dawek daje złą liczbę") — to dalej trzeba testować ręcznie.

---

## 💰 2. RevenueCat Setup (2-3h)

RevenueCat to platforma do zarządzania subskrypcjami. Zero backendu — ogarnie weryfikację zakupów z Google Play i zwróci Ci "user ma premium? tak/nie".

### Krok 1: Załóż konto RevenueCat

1. <https://app.revenuecat.com/signup>
2. Free tier: pierwsze **$2,500 MTR** (monthly tracked revenue) za darmo. Przy 14.99 zł/mies subskrypcji dostaniesz ~150 userów za darmo.
3. Po utworzeniu konta: **Create Project** → "Spokojny Rodzic"
4. Platform: **Android** (na start, iOS dodaj później gdy będziesz robić iOS wersję)

### Krok 2: Konfiguracja Google Play Integration

1. RevenueCat → **Project settings → Platforms → Android**
2. Google Service Account Credentials — musisz wygenerować JSON:

#### Jak zrobić Service Account JSON:

1. Google Cloud Console → <https://console.cloud.google.com>
2. Wybierz projekt Google Play (lub utwórz nowy, użyj tego samego który używasz do Play Store)
3. **IAM & Admin → Service Accounts → CREATE SERVICE ACCOUNT**
4. Name: `revenuecat-play-billing`
5. Role: **Service Account User**
6. Create → potem kliknij w stworzony konto → **Keys → ADD KEY → JSON** → zapisz plik

#### Google Play Console setup:

1. Play Console → **API access** (pod Settings w lewym sidebar)
2. Link your Google Cloud project
3. Znajdź Service Account który właśnie utworzyłeś → **Grant access**
4. Permissions: **Admin (all permissions)** dla tego konkretnego app
5. **Save**

#### Z powrotem w RevenueCat:

1. **Platforms → Android → Credentials**
2. Upload JSON z Service Account
3. Package name: `pl.skudev.spokojnyrodzic`
4. Save

### Krok 3: Stwórz produkty w Google Play Console

Play Console → **Spokojny Rodzic → Monetize → Products**

#### Subskrypcja miesięczna

1. **Subscriptions → Create subscription**
2. Product ID: `spokojny_rodzic_premium_monthly`
3. Name: "Premium miesięczny"
4. Description: "Pełny dostęp do funkcji Premium — Spokojny Rodzic"
5. Base plan ID: `monthly`
6. Billing period: **1 month**
7. Renewal type: **Auto-renewing**
8. Price: **14,99 zł** (Poland)
9. → Activate

#### Subskrypcja roczna

1. Product ID: `spokojny_rodzic_premium_yearly`
2. Name: "Premium roczny"
3. Description: "Pełny dostęp Premium — roczna subskrypcja ze zniżką"
4. Base plan ID: `yearly`
5. Billing period: **1 year**
6. Renewal type: **Auto-renewing**
7. Price: **99,99 zł** (Poland)
8. → Activate

#### Lifetime (non-consumable)

1. **In-app products → Create in-app product**
2. Product ID: `spokojny_rodzic_premium_lifetime`
3. Name: "Premium dożywotnie"
4. Description: "Jednorazowy zakup — Premium na zawsze"
5. Price: **199,99 zł** (Poland)
6. → Activate

### Krok 4: Połącz produkty z RevenueCat

1. RevenueCat → **Products** (z sidebaru)
2. **+ New** dla każdego z 3 produktów:
   - Identifier: ten sam jak w Play Console (`spokojny_rodzic_premium_monthly` etc.)
   - Store: Google Play
   - RC automatycznie pobierze cenę i nazwę
3. Save

### Krok 5: Stwórz Entitlement

Entitlement to **uprawnienie** które user dostaje po zakupie (3 produkty → 1 entitlement).

1. **Entitlements → + New**
2. Identifier: `Spokojny Rodzic Pro` (**to samo co w .env!**)
3. Description: "Pełne funkcje Premium"
4. **Attached products:** zaznacz wszystkie 3 produkty → Save

### Krok 6: Stwórz Offering

Offering to "zestaw oferowanych planów" — tzn. Monthly/Yearly/Lifetime razem.

1. **Offerings → + New**
2. Identifier: `default`
3. Dodaj wszystkie 3 produkty jako "packages":
   - Package: `$rc_monthly` → product `spokojny_rodzic_premium_monthly`
   - Package: `$rc_annual` → product `spokojny_rodzic_premium_yearly`
   - Package: `$rc_lifetime` → product `spokojny_rodzic_premium_lifetime`
4. → Mark as current

### Krok 7: Skopiuj API Key

1. **Project settings → API keys**
2. Znajdź **"Public Google API key"** (NIE "secret"!, to klucz do użycia w kliencie)
3. Format: `goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Krok 8: Uzupełnij `.env`

```bash
VITE_RC_PUBLIC_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_RC_ENTITLEMENT=Spokojny Rodzic Pro
```

### Krok 9: Testowanie przed release

**NIE możesz testować zakupami swoim kontem** — Google Play nie pozwala.

Opcje:
1. **License testing:** Play Console → Settings → License testing → dodaj emaile (nie swój!) jako testerzy
2. Zaloguj się na testowym telefonie Google kontem testera
3. Zainstaluj apkę z Internal Testing (nie z Play Store)
4. Kup Premium → zobaczysz "Test card" zamiast prawdziwej płatności
5. Po zakupie: **RevenueCat dashboard → Customers** → zobaczysz zdarzenie
6. W apce: Premium powinno zostać aktywowane automatycznie

---

## 🔌 3. TWA Bridge dla Google Play Billing

TWA (Trusted Web Activity) nie ma natywnego wsparcia dla Play Billing — trzeba zrobić bridge.

### Opcja A: PaymentRequest API (zalecana, działa w TWA)

W TWA, Google Play Billing exponuje się jako **PaymentRequest** (Web API). Musisz zaktualizować `useRevenueCat.js` albo dodać specjalny handler:

### Opcja B: Custom JavaScript interface (wymaga modyfikacji wrappera)

Jeśli używasz Bubblewrap/PWABuilder do wrappera TWA — potrzebujesz dodać custom JavaScript interface który exponuje `window.Android.launchBilling(productId)`.

**Na start polecam Opcja A** — bez modyfikacji wrappera. Będzie działać natywnie.

### Kod PaymentRequest (do dodania w `useRevenueCat.js`)

```js
export async function purchaseWithPaymentRequest(productId) {
  if (!window.PaymentRequest) {
    throw new Error('PaymentRequest API not available')
  }
  const supportedInstruments = [{
    supportedMethods: 'https://play.google.com/billing',
    data: { sku: productId },
  }]
  const details = { total: { label: 'Total', amount: { currency: 'PLN', value: '0' }}}
  const request = new PaymentRequest(supportedInstruments, details)
  const response = await request.show()
  const purchaseToken = response.details.purchaseToken
  await response.complete('success')
  return { purchaseToken, productId }
}
```

Potem w `handleActivate` w App.jsx:

```js
const handleActivate = async (planId) => {
  const offering = offerings.find(o => o.id === planId)
  if (!offering) return

  try {
    const { purchaseToken, productId } = await purchaseWithPaymentRequest(offering.productId)
    await activateWithToken(productId, purchaseToken)
    setShowPaywall(false)
    toast(t('paywall.thank_you'))
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error(e)
      toast(t('paywall.error'))
    }
  }
}
```

Ten kod **nie jest jeszcze w apce** — dodasz go gdy będziesz gotowy na billing flow. Na razie apka używa `checkPremium()` który tylko weryfikuje stan.

---

## 📄 4. PDF Raport — już zintegrowany ✅

PDF działa automatycznie gdy user ma Premium. Generuje się client-side przez jsPDF.

### Jak user wywołuje

1. Premium user: Settings → sekcja "Export" → "📄 Raport PDF dla pediatry" (przycisk PDF)
2. Modal pyta o zakres: 7/14/30 dni albo custom
3. Klik "Generuj" → pobranie pliku `raport-[imię]-[daty].pdf`

### Co jest w PDF

- Header: imię dziecka, wiek, waga, płeć, okres raportu
- Summary: liczby zagregowane (karmienia, sen, diapers, max temp, dni z gorączką)
- Tabele: temperatura, karmienia, sen, pieluchy, leki, objawy, kaszel, wzrost
- Pytania do pediatry (to_ask + z zakresu)
- Notatki z poprzednich wizyt
- Footer: "Raport wygenerowany: data godzina"

### Testowanie

Nie wymaga internetu po pierwszym załadowaniu (jsPDF jest chunkiem lazy). Zużywa ~400KB pamięci przy generacji, bezpieczne dla telefonu.

### Znane ograniczenia

- **Polskie znaki:** jsPDF używa standardowych fontów (Helvetica). Polskie znaki są wspierane ale nie są piękne. Jeśli ważne, można załadować font Roboto (dodaje ~400KB).
- **Bardzo długie notatki:** zostaną przycięte do szerokości komórki (autoTable). Użytkownik widzi warning.
- **Emoji:** NIE są renderowane w PDF (jsPDF nie wspiera). W notatkach pojawi się `[?]`.

---

## 🔐 5. Bezpieczeństwo `.env`

### Co NIE commitować

- `.env`
- `.env.local`
- `.env.production`
- `google-service-account.json` (jeśli kiedykolwiek pobierzesz lokalnie)

### Co commitować

- `.env.example` — szablon dla innych devów
- Kod aplikacji

### Jeśli przypadkiem commitnąłeś klucz

1. Odwołaj klucz w RC/Sentry natychmiast
2. Wygeneruj nowy
3. Uzupełnij `.env` nowym
4. `git filter-branch` albo **BFG Repo-Cleaner** żeby usunąć z historii git

---

## 📊 6. GitHub Actions deploy

Jeśli używasz GitHub Pages, musisz dodać secrety do workflow:

1. GitHub repo → **Settings → Secrets and variables → Actions**
2. **New repository secret:**
   - Name: `VITE_SENTRY_DSN`
   - Value: Twój DSN
3. Powtórz dla: `VITE_RC_PUBLIC_KEY`, `VITE_RC_ENTITLEMENT`

W `.github/workflows/deploy.yml` dodaj przed `npm run build`:

```yaml
- name: Build
  env:
    VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
    VITE_RC_PUBLIC_KEY: ${{ secrets.VITE_RC_PUBLIC_KEY }}
    VITE_RC_ENTITLEMENT: ${{ secrets.VITE_RC_ENTITLEMENT }}
  run: npm run build
```

---

## ✅ Final checklist

### Przed pierwszym uruchomieniem Production

- [ ] `.env` zawiera WSZYSTKIE 3 klucze (Sentry, RC key, RC entitlement)
- [ ] `.env.example` commitowany (bez kluczy!)
- [ ] `@sentry/react` zainstalowany (`npm install @sentry/react`)
- [ ] GitHub Actions ma skonfigurowane secrety
- [ ] Play Console: 3 produkty aktywne
- [ ] RevenueCat: entitlement + offering `default` utworzone
- [ ] License testers dodani w Play Console
- [ ] Testowy zakup zadziała (z innym kontem Google)
- [ ] Nowy `.aab` z `versionCode` podbitym o 1

### Po Production launch

- [ ] Sprawdź Sentry Issues po 1 dniu (spodziewaj się 5-20 errorów w pierwszym tygodniu)
- [ ] Sprawdź RC Dashboard — ile userów aktywowało Premium?
- [ ] Sprawdź Play Console → Statistics → Installs vs Uninstalls
- [ ] Zbieraj feedback: jaki feature jest najczęściej używany?

---

## 💡 Troubleshooting

### "RC 401" w konsoli

- API key nieprawidłowy albo brak
- Sprawdź czy `VITE_RC_PUBLIC_KEY` w `.env`
- Zrestartuj dev server: `npm run dev`

### "Sentry events nie pojawiają się"

- Sentry jest wyłączony w DEV (to celowo!)
- Testuj na prod build: `npm run build && npm run preview`
- Sprawdź czy `@sentry/react` jest zainstalowany

### "PaymentRequest failed"

- Apka nie jest uruchomiona w TWA (tylko na Android Chrome, nie desktop)
- Produkt nie jest aktywny w Play Console
- Licencja testera nie dodana

### "PDF ma krzaczki zamiast polskich znaków"

- Obecnie używamy domyślnych fontów jsPDF
- Workaround: dodać pakiet `jspdf-font` z Robotem

---

*Dokument utrzymany przez SkuDev — ostatnia aktualizacja kwiecień 2026*
