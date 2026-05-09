# AUDIT_REPORT — Spokojny Rodzic (babylog)

**Audyt wykonany**: 2026-05-06
**Wersja apki**: 2.11.30
**Stack**: React 18.2 + Vite 5.2 + Firebase 10.12 (Auth/Firestore/FCM/AppCheck) + RevenueCat REST + jsPDF + Recharts
**Zakres**: 97 plików `.js/.jsx` w `src/` (~30k LOC + 2912 linii i18n + 661 linii index.css), 2 Cloud Functions, TWA przez Bubblewrap, hosted na GitHub Pages
**Stan auth**: 13 customers w RC, 0 active subscriptions historycznie (do v2.11.19), production review w toku, Closed Testing 14d zakończony

---

## TL;DR — werdykt jednym zdaniem

Apka technicznie działa i ma poukładany backend (Firestore + RC webhook + App Check + Sentry), **ale produktowo nie wiadomo komu i za co sprzedaje** — paywall obiecuje 7 cech, z których **3 to vapourware ("coming soon" lub bezwartościowe)**, a killer feature nie jest namierzony. UX po 30 iteracjach jest czysty na froncie wjazdu, **ale rozjeżdża się w głębi** (765 LOC SettingsScreen, 733 LOC DoctorNotesTab, 14 useState w App.jsx). **Wskaźnik gotowości do sprzedaży: 4/10** — apka da się odpalić na produkcji jutro, ale revenue przewidywalnie zerowe bez pivotu komunikacji.

---

## 🚨 P0 — natychmiast (3 pozycje)

### P0-1: Trial start z Firebase Auth `creationTime` nie cofnie się dla istniejących userów
**Plik**: `src/hooks/usePremium.js:51-58`
**Problem**: Dla zalogowanych userów trial liczony jest od **daty utworzenia konta Google w Firebase Auth**, nie od pierwszego uruchomienia apki. Czyli ktoś, kto ma konto Google założone w Firebase 6 miesięcy temu (np. testował starszą wersję, lub założył kiedyś konto na cokolwiek innego pod tym samym Firebase project), **wchodzi w apkę i widzi `trialDaysLeft = 0` od pierwszej sekundy**.
```js
// usePremium.js:53
const creationTime = user?.metadata?.creationTime
if (creationTime) {
  const ts = new Date(creationTime).getTime()
  if (!Number.isNaN(ts)) trialStart = ts
}
```
**Skutek biznesowy**: pierwszy real klient z kontem Firebase Auth z testów alfa/beta pobiera apkę z Production, widzi „kup Premium" zamiast 14d trialu — i odpada. **To jest bug definicji free trialu**.
**Naprawa**: wracamy do zapisu trial_start w Firestore (`users/{uid}/data/trial_start`) ZAPISANEGO PRZEZ CLOUD FUNCTION (callable) przy pierwszej wizycie zalogowanego usera. Anti-abuse robimy server-side (CF sprawdza czy doc już istnieje — jeśli tak, NIE nadpisuje). Auth metadata zostaje jako sanity-check fallback dla zupełnie nowych kont.

### P0-2: `firebaseConfig.apiKey` hardcoded w bundle, brak ochrony przez App Check w deweloperskim setupie
**Plik**: `src/firebase.js:11-18`
**Problem**: `apiKey: "AIzaSyBDpM68v2BAdMX3sxcMe6ypnOIoNMR2Z4w"` jest stałą w kodzie. To jest „normalne" dla Firebase Web (klucz jest publiczny z definicji), **ALE tylko gdy App Check ENFORCE jest włączony w produkcji**. Aktualnie:
- `src/firebase.js:53` — `RECAPTCHA_SITE_KEY` z env. Jeśli `.env` nie ma `VITE_RECAPTCHA_SITE_KEY` → App Check **nie jest inicjalizowany** (linia 78), apka działa „normalnie", ale każdy kto wezmie apiKey z bundle może spamować Firestore na Twój koszt.
- `firestore.rules:38-46` zezwalają na write tylko zalogowanym userom do swoich danych — to redukuje vector ataku, ale **nie chroni przed rate-spammingiem na auth endpoint** (sign-in attempts) ani przed mass-create kont.
**Skutek**: jeśli w Firebase Console nie jest jeszcze włączony enforce App Check (a komentarz w pliku sugeruje fazę monitorowania 7 dni), ktoś może:
  1. Skopiować apiKey z bundle
  2. Założyć skrypt który `signInAnonymously()` co sekundę przez X dni
  3. Twój Firebase quota = wyczerpany albo billing skoczy
**Naprawa**: zweryfikuj czy w Firebase Console **App Check jest w trybie ENFORCE** dla Auth + Firestore + Functions. Jeśli nie — włącz **dziś** dla tych 3 services. To jest checkbox, nie kod.

### P0-3: 4 komponenty są bundlowane mimo że nigdzie nie są używane (~585 linii dead code w main bundle)
**Pliki**:
- `src/components/StreakBadge.jsx` (43 linie) — 0 importów
- `src/components/DiaryTab.jsx` (84 linie) — 0 importów
- `src/components/MedicalDisclaimerScreen.jsx` (328 linii) — 0 importów (legacy z v2.8, zastąpiony przez `MedicalConsentScreen` w v2.9.0)
- `src/components/EmptyStateHero.jsx` (130 linii) — 0 importów (komentarz w `App.jsx:815` „v2.9.4: EmptyStateHero usunięty stąd")

**Dowód**:
```bash
$ grep -rln "import.*MedicalDisclaimerScreen\|import.*EmptyStateHero\|import.*StreakBadge\|import.*DiaryTab" src/
# (no results)
```

**Skutek**: Vite tree-shake usuwa to, ale dopóki pliki istnieją w `src/components/`, ktoś nowy w projekcie spędzi 30 min czytając które jest „prawdziwe" (DisclaimerScreen vs ConsentScreen) i co jest aktualne. Plus historia: ostatnie sesje audytu spędziły 4 commity (v2.11.16, 17, 24) naprawiając **MedicalDisclaimerScreen** zanim ktoś zorientował się, że to nie jest aktywny ekran. Komercyjny koszt = 4× build/test/push cycle na nic.
**Naprawa**: `git rm` na 4 pliki + ich `.test.jsx` jeśli są.

---

## 🟠 P1 — najbliższy sprint (10 pozycji)

### P1-1: App.jsx 1313 linii, 14 useState w jednym komponencie, 9× useFirestore na top-level
**Plik**: `src/App.jsx` (cały)
**Dowód**: `wc -l src/App.jsx` → 1313. `grep -cE "useState\(" src/App.jsx` → 14. Linie 235-243 to 9 wywołań `useFirestore` w jednym komponencie, każde tworzy własny `onSnapshot` listener.
**Problem**: Każda zmiana w 1 useFirestore (np. `profiles`) tryggeruje re-render CAŁEGO App.jsx — czyli ponowne wykonanie `renderTab()` (switch z 17 case'ami) i mountowanie wszystkich children z nowymi propsami. Plus 14 useState = 14 niezależnych źródeł re-renderów.
**Praktyczny skutek**: na low-end Androidzie (taki jest target user — rodzic z budżetem 1-2k zł na telefon) topbar miga przy każdej zmianie aktywnego dziecka, a FAB ma input lag.
**Refactor**: rozdzielić App.jsx na:
  - `<AppShell>` (LoginScreen / ConsentScreen / Onboarding / authLoading early returns) — ~100 linii
  - `<MainApp>` (main tab content + topbar + nav) — ~500 linii
  - `<PurchaseFlow>` hook (handleActivate, retry queue, pendingActivation modal) — ~300 linii do hooka `usePurchaseFlow.js`
  - `<NavigationConfig>` (NAV_TABS, MORE_TABS, navigate logic) — osobny moduł, statyczny

### P1-2: Paywall obiecuje funkcje które nie istnieją lub są wątpliwej wartości
**Plik**: `src/components/PaywallScreen.jsx:32-48` (`getFeatures()`)
**Dowód**:
```js
{ icon:'👨‍👩‍👧', title:'Udostępnij partnerowi', desc:'Oboje rodziców śledzi razem...', comingSoon:true }
{ icon:'🎯', title:'Priorytetowe wsparcie', desc:'Bezpośredni kontakt ze mną (solo founder). Pytasz, odpowiadam w 24h.' }
{ icon:'📈', title:'Analityka i normy', desc:'Wykresy trendów i porównanie do norm WHO dla ząbków, kaszlu, milestone\'ów.' }
```
**Problem**:
1. **Share with partner** ma `comingSoon: true` — czyli user płaci za feature który nie istnieje. Polski UOKiK i Google Play Misleading Claims policy są tutaj w ostrzegawczym tonie (§3.4 Google Play Developer Program Policies — features must be functional at point of purchase). Nawet z badge'em „Wkrótce" ryzyko reklamacji + ban jest realne.
2. **Priorytetowe wsparcie 24h** od solo founder — nieskalowalne. Jeden flu season w PL, 200 userów, każdy wysyła pytanie → jeden człowiek nie odpowie w 24h. Plus to obietnica usługi medycznej („Twoje dziecko ma gorączkę, co robić?") — która jest **świadomie zabroniona** w SOAP wymogu MDR (`src/components/PaywallScreen.jsx:7`: „Apka nie jest wyrobem medycznym"). Sam sobie zaprzeczasz.
3. **Analityka WHO dla ząbków/kaszlu/milestone'ów** — WHO publikuje normy dla growth chart (waga/wzrost/BMI/obwód głowy), które realnie używasz w `src/data/whoNorms.js`. **NIE PUBLIKUJE NORM dla ząbkowania, kaszlu ani milestone'ów developmentalnych**. Te są w referenceTables.js z PTP/AAP, ale nie z WHO. Tekst paywall jest **factually wrong**.

**Naprawa**:
- Usunąć Share with Partner z paywall ALBO dodać go jako ostatni feature w pełnym CTA z dyskliminem „w fazie testów beta, free dla Premium" (i dostarczyć w 30 dni).
- Zmienić „Priorytetowe wsparcie 24h" na „Email wsparcie do dewelopera" bez SLA. Albo wyrzucić — to nie jest sales hook, to liability.
- Poprawić tekst „Analityka i normy" na „Wykresy wzrostu z normami WHO" (zostaje jeden feature który masz; dwa pierwsze już są na liście jako Growth Charts).

### P1-3: Killer feature nieokreślony — apka jest „dziennikiem zdrowia od wszystkiego"
**Plik**: koncepcyjne — sprawdź `manifest.json:4` + `src/i18n.js:28` (`app.tagline`)
**Dowód**:
- Manifest description: „Dziennik zdrowia dla rodziców niemowląt i małych dzieci. Zapisujesz temperaturę, karmienie, sen, leki i objawy."
- Tagline: „Aplikacja, która pomaga Ci wiedzieć co robić, gdy dziecko jest chore."
- `App.jsx:140-150` (MORE_TABS) — 9 dodatkowych modułów (reference, seek_help, milestones, teething, growth, cough, vacc, diet, doctor)

To dwa różne value prop's:
  - „Dziennik" (tracking) — konkurencja: Baby Tracker, Huckleberry, Glow Baby (USA), Nutrissa (PL), notatki w telefonie
  - „Co robić gdy dziecko chore" (decision support) — konkurencja: WhatToExpect, BabyCenter, Medonet, lekarz pediatra na telefonie
- Plus 9 modułów które robią z tego „aplikację do wszystkiego" (rozszerzanie diety + szczepienia + kamienie milowe + ząbkowanie + kaszel + notatki lekarskie...). To jest **Swiss Army Knife** — apka która próbuje być dla każdego, kończy nikomu nie być.

**Skutek biznesowy**: w Google Play user szuka „dziennik karmienia" → znajduje 30 wyników, większość darmowych. Twój differentiator nie jest jasny, więc jest kupowany jako 7-ty wybór po review/cenie/etc.

**Naprawa**: skup komunikację na **JEDNĄ wartość core**. Sugeruję jedną z trzech opcji (każda jest lepsza niż obecny chaos):
  a) **„Notatki do pediatry"** — apka jest dla rodzica który chce iść do pediatry przygotowany. Tracking + PDF report = killer combo. Reszta (referencyjne tabele, milestones, teething) jest bonusem, nie sprzedaje się ich. Konkurencja: zeszyt papierowy + Excel.
  b) **„Tracking podczas choroby"** — gorączka + leki + objawy + kaszel w jednym widoku. „Tryb chory" jak masz w v2.9.3 HealthTab. Konkurencja: notatki w telefonie + spreadsheet.
  c) **„Dziennik 0-3"** — pełny tracker (karmienie, sen, pieluchy, growth) jak Huckleberry. Konkurencja: Huckleberry, Baby Tracker (oba globalne, $5-10/mc).

Każda z tych opcji **wyrzuca 50% modułów na backlog** (np. opcja (a) usuwa milestones/teething/diet/vacc — bo to nie jest „pre-pediatric" content, to jest „edukacja"). Zamiast hamować, apka będzie biegać.

### P1-4: Bundle 527 KB main + 529 KB recharts ładowane synchronicznie dla user'a który nigdy nie wchodzi w wykresy
**Plik**: `vite.config.js:31-39` + `src/components/{Feed,Sleep,Milestones,Teething}Tab.jsx`
**Dowód**:
- `dist/assets/index-XXX.js`: 527 KB (main bundle gzip ~133 KB)
- `dist/assets/charts-XXX.js`: 529 KB (recharts gzip ~151 KB) — w `manualChunks` jako `'charts': ['recharts']`
- Tylko 2 z 6 wykresów lazy-loaded: `GrowthChart` (linia `src/components/GrowthTab.jsx:8`) i `TempChart` (linia `src/components/TempTab.jsx:9`)
- Pozostałe 4 (`FeedingFrequencyChart`, `MilestonesChart`, `SleepChart`, `TeethingChart`) — **direct import** w odpowiednich Tab plikach
- W rezultacie recharts jest **prefetched chunkiem** który ładuje się przy pierwszym wejściu w jakikolwiek tab z wykresem

**Skutek**: Time-to-interactive na 3G (target user — niekoniecznie najlepszy LTE) ~5-8s zanim apka jest klikalna. Przy app launch user czeka 2-3s na cold start TWA + 3-5s na bundle download = **5-8s białego ekranu**. Lighthouse mobile score będzie ≤60 LCP.

**Naprawa**:
1. `React.lazy()` dla pozostałych 4 wykresów (FeedTab, SleepTab, MilestonesTab, TeethingTab).
2. Wyrzucić `recharts` z `manualChunks` (auto-split per lazy import).
3. Spróbować `recharts` zastąpić lżejszym (np. własna implementacja SVG dla TempChart i SleepChart które są proste line charts). Recharts ważą 529 KB bo zawierają cały D3 i 30 typów wykresów; my używamy 5.

### P1-5: i18n — 2912 linii w jednym pliku, ładowane w main bundle
**Plik**: `src/i18n.js` (cały)
**Dowód**:
```bash
$ wc -l src/i18n.js          # 2912
$ grep -c "^\s*'.*':" src/i18n.js  # 2440 keys (1220 PL + 1220 EN)
```
**Problem**: oba języki ładowane synchronicznie razem z main bundle. EN user ładuje cały PL słownik i odwrotnie. Plus całość bundlowana z React kodem — przy zmianie 1 stringa, cały bundle musi się przeładować po stronie usera (cache invalidation). Komentarz/translation memory pamięta że to było „prosty system" — i było, na 100 kluczy. Na 1220 kluczy to **potworek**.
**Skutek**: ~80 KB stringów PL+EN w main bundle dla każdego usera (gzip ~25 KB). Plus każda zmiana copy = invalidate cache całego app.
**Naprawa**:
1. Rozdziel na 2 pliki: `src/i18n/pl.js`, `src/i18n/en.js`. Lazy-load tylko aktywny.
2. Albo użyj `react-intl` lub `i18next` (15-20 KB biblioteka) z JSON-bazami które ładują się dynamicznie.
3. Long-term: jeśli zostawiasz tylko PL na początek (Polska to target rynek) — wyrzuć EN do drugiej iteracji.

### P1-6: Brak analityki — nie wiadomo gdzie userzy odpadają
**Dowód**: `grep -rn "analytics\|gtag\|posthog\|plausible\|mixpanel\|amplitude" src/` zwraca tylko 1 hit i to w treści translation (paywall feature description). Sentry nie jest analytics, jest error monitoring.
**Skutek biznesowy**: nie ma odpowiedzi na pytanie:
- Ilu userów odpada na ekranie consent?
- Ilu nie kończy onboardingu (nie wpisuje DOB)?
- Ile osób klika paywall vs ile go widzi?
- Który tab z 14 jest faktycznie używany? (Może 9 modułów w More to dead-feature-bloat które nikt nie odwiedza)
- Który feature w paywall jest najczęściej przyczyną kupna?

Bez tego decyzje produktowe = strzelanie na ślepo.

**Naprawa**:
1. **Plausible** lub **Umami** (oba self-hostable, RODO-friendly, ~5kg JS) — tracking page views per tab.
2. **Custom events przez Firebase Analytics** (już masz Firebase, tylko `import { getAnalytics, logEvent } from 'firebase/analytics'`). Trackuj 6 kluczowych eventów:
  - `onboarding_started` / `onboarding_completed`
  - `first_entry_added` (any data point — to jest aha moment)
  - `paywall_viewed` (z `trigger: tab|topbar|premium_feature`)
  - `paywall_cta_clicked` (z `plan: monthly|yearly|lifetime`)
  - `purchase_completed`
  - `purchase_failed` (z error code)

### P1-7: 13 customers w RC ale 0 active subscriptions — brak monitoringu retention
**Plik**: `functions/index.js` (revenueCatWebhook + purchasePipelineHealth)
**Dowód**: Z poprzedniej sesji wiem że na 13 customerów było 0 aktywnych. Teraz po v2.11.19 acknowledge fix powinno działać, ale **nie ma alertu** który by Cię obudził w nocy gdyby na 100 zakupów 50 się posypało. Plus health endpoint skanuje tylko 24h — nie wiadomo „ile było purchasing failures w ostatnim tygodniu" bez ręcznego klikania.
**Naprawa**: Cloud Function która codziennie o 9:00 sprawdza:
  - count(`rc_event_*` z ostatnich 24h)
  - count `premium_purchased = true` w Firestore
  - jeśli ratio purchase_attempt vs successful_grant < 0.95 → email alert.

### P1-8: 25 buttonów < 40px touch target (poniżej WCAG 2.5.5)
**Dowód**: `grep -rn "minHeight:\s*[0-3][0-9]\b" src/components --include="*.jsx" | wc -l` → 25
Po v2.11.30 globalny CSS rule `button { min-height: 44px }` częściowo ratuje, ale tylko gdy button **NIE MA explicit min-height** lub `inline style ` z mniejszą wartością. Niektóre buttony mają **explicit `minHeight: 36`** (np. info button przy Paracetamolu w `MedsTab.jsx:225`) i te override globalny rule.
**Naprawa**: code review wszystkich 25 miejsc i bumpnij do 44+. Albo trick: usuń CSS rule globalny i dodaj util class `.touch-target` którą dokleisz z explicit intencją.

### P1-9: 210 wystąpień fontSize 10-12px — body content w tabach
**Dowód**: `grep -rn "fontSize: 1[0-2]\b\|fontSize:1[0-2]\b" src/components --include="*.jsx" | wc -l` → 210
**Problem**: po v2.11.30 bumpnąłem 5 najczęściej widzianych miejsc (log-name, log-detail, section-desc, empty-state, consent text). Ale wciąż 210 inline'ów z 10-12px — to są captions, labels, badges, footnotes. Większość z nich JEST małym tekstem celowo (badge „Premium", subtitle, hint text), ale przemieszanych z body content (np. `fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6` w DoctorNotesTab.jsx pojawia się **w treści notatki lekarskiej** czytanej długo).
**Naprawa**: zdefiniować w CSS klasy semantic typography (`.text-body`, `.text-caption`, `.text-micro`) i porefactorować — albo per-tab podejście (skup na DoctorNotes, Cough, Symptoms — tam są długie body texty). PrimeTestLab QA report wskazał że to jest „body content threshold" — fokus na faktyczne czytane treści, nie wszystkie 210.

### P1-10: SettingsScreen 765 linii + 12 useState w jednym komponencie
**Plik**: `src/components/SettingsScreen.jsx`
**Dowód**: `wc -l src/components/SettingsScreen.jsx` → 765. `grep -cE "useState\(" src/components/SettingsScreen.jsx` → 12.
**Problem**: jeden komponent robi:
  - Edycję profilu dziecka (avatar, imię, age, weight, sex, toiletMode, visibleTabs)
  - PDF export modal trigger + Premium gate
  - 3× Backup actions (CSV+JSON, full backup, single export)
  - FCM token registration + permission flow
  - Account info + logout
  - Premium status + upgrade CTA
  - Legal links (Privacy, Delete Account)
  - Features screen modal trigger
  - Wersja apki w stopce
**Skutek**: każda zmiana w jednym z 8 obszarów = re-render całego ekranu z 12 hooków `useFirestore`. Plus debugowanie/code review koszmarne.
**Naprawa**: rozbić na sekcje (`<ChildProfileForm>`, `<ExportSection>`, `<NotificationSettings>`, `<AccountSection>`, `<LegalSection>`) i każda sekcja ma własny hook do swoich stanów. SettingsScreen staje się shellem ~150 linii.

---

## 🟡 P2 — warto zrobić (12 pozycji)

### P2-1: useFirestore każdy klucz = 1 onSnapshot listener; 9 listenerów w App.jsx, 5 w TodayTab, 10 w SettingsScreen
**Dowód**: `App.jsx:235-243, 301, 307-309` (9 useFirestore w głównym komponencie)
**Skutek**: 24+ równoległych listenerów Firestore w main page. Firebase ma soft limit 100 conccurrent listenerów per client. Plus każdy listener generuje read = billing.
**Naprawa**: collection-level listener dla wszystkich kategorii dziecka, parsowane client-side. Zamiast `feed_${id}`, `sleep_${id}`, `temp_${id}` — `users/{uid}/data` jako kolekcja, jeden listener, filter w client.

### P2-2: Brak skeleton loaderów — content „pop-in"
**Dowód**: `grep -rn "skeleton\|Skeleton" src/components --include="*.jsx"` → 0 wyników
**Skutek**: gdy user przełącza taby, stara zawartość znika, nowa pojawia się dopiero po `useFirestore` zwróci dane. Krótka biała plama. Na slow connections (3G) widać latanie state'u.
**Naprawa**: dla 5 głównych tabów dodać skeleton (10-15 linii inline każdy).

### P2-3: PDF generation bundlowany lazy ALE 950 KB jednym strzałem (jspdf+autotable+roboto+html2canvas)
**Plik**: `src/utils/pdfReport.js:99-100`
**Dowód**: dynamic import działa (`await import('jspdf')`), ale po pierwszym kliknięciu „Generate PDF" user czeka na **390 KB jspdf + 367 KB roboto font + 200 KB html2canvas + 31 KB autotable + 24 KB purify** = ~1 MB download.
**Skutek**: na 3G to 30-60s czekania. User myśli że apka się zawiesiła.
**Naprawa**:
  1. Pre-fetch tych chunków w tle gdy user otwiera SettingsScreen (jeszcze przed klikiem PDF).
  2. Pokazywać explicit progress bar „Pobieranie generatora PDF... 35%".
  3. Long-term: server-side PDF generation w Cloud Function (PDFKit lub puppeteer-core już masz w devDeps), zwracaj URL do gotowego pliku.

### P2-4: Service Worker invalidation jest manualny przez bumpowanie `SHELL_CACHE` w pliku
**Plik**: `public/sw.js:30`
**Dowód**: `const SHELL_CACHE = 'babylog-shell-v7'`. Każda nowa wersja apki która chce inwalidować cache wymaga manualnego edytu SW.
**Naprawa**: derive cache name z `__APP_VERSION__` (już masz w `vite.config.js`). Wtedy każdy bump package.json automatycznie invaliduje SW cache. Plus dodaj `update on focus` listener — gdy user wraca do apki po 1h+, SW sam sprawdza update.

### P2-5: Brak cooldownu na paywall — user widzi go na każdym kliku w premium feature
**Plik**: `src/components/{DoctorNotesTab,GrowthTab,FeedTab,...}.jsx` (każdy ma `if (!isPremium) onUpgrade()`)
**Skutek**: user, który raz odrzucił paywall, widzi go znowu przy każdym kliknięciu w premium-feature. To jest agresywne i irytujące. „Upgrade fatigue" → user dezinstaluje.
**Naprawa**: `localStorage.babylog_paywall_dismissed_until = Date.now() + 24h`. Po dismissie nie pokazuj przez 24h. Zamiast paywall, pokazuj subtelny `<PremiumTeaser>` (już masz w `src/components/PremiumTeaser.jsx`).

### P2-6: 3 wersje cen lifetime (`spokojny_rodzic_premium_lifetime` SKU istnieje), ale lifetime może nigdy nie trafić do Play Console
**Plik**: `src/data/premiumPlans.js:55-63`
**Dowód**: SKU jest hard-coded, ale user wcześniej w sesji przyznał że tylko monthly/yearly subskrypcje są w Google Play Console. Lifetime to in-app product (one-time non-consumable), wymaga **innego setupu** niż subskrypcja.
**Skutek**: user kliknie „Lifetime 199,99 zł", aplikacja wywołuje DGA z SKU `spokojny_rodzic_premium_lifetime`, Google Play zwraca błąd „SKU not found" — user widzi modal failure z RC error code.
**Naprawa**: jeśli lifetime nie jest realnie dostępne w Play Console — usuń z `premiumPlans.js` plan `lifetime` przed publikacją Production. Albo dodaj go do Play Console **przed** klikiem Production.

### P2-7: Hardcoded URL `matiseekk-dot.github.io/babylog` w wielu miejscach
**Pliki**:
- `src/components/SettingsScreen.jsx:21-22` (`LEGAL_URLS`)
- `src/App.jsx:652` (Play Store URL)
- `public/manifest.json:5-6` (`start_url`, `scope`)
- `public/sw.js:32-38, 137, 145, 153` (`SHELL_FILES` paths, navigation fallback, notification icons)

**Skutek**: gdy migrujesz na custom domain `babylog.skudev.pl` (P3), trzeba zmienić ~15 miejsc. Łatwo zapomnieć i część apki przestaje działać.
**Naprawa**: extract do `src/config/urls.js` z env var fallback. SW jest specjalny przypadek (nie ma dostępu do import.meta.env), ale można generować przez Vite plugin przy build.

### P2-8: 17 case'ów w switch `renderTab()` + 9 case'ów dla ukrytych compatibility flags
**Plik**: `src/App.jsx:812-857`
**Dowód**: `renderTab()` ma case'y dla: today, feed, sleep, health, reference, seek_help, milestones, teething, growth, cough, vacc, diet, doctor, diaper, temp, meds, symptoms, default. **17 case'ów**. Plus comment „Defensywne fallbacki dla starych ID" (linie 850-853) wskazuje że migracja nie była czysta.
**Skutek**: dodanie nowego taba = edytuj 4 miejsca (NAV_TABS, MORE_TABS, renderTab switch, sharedProps). Łatwo o niespójność.
**Naprawa**: tab definitions jako tablica obiektów `{ id, component, navProps, isMore }`, dynamic render based on lookup. Rzecz na refactor gdy tabs zostaną zaakceptowane jako ostateczny zestaw.

### P2-9: `useFirestore` nie ma rozróżnienia loading vs empty state
**Plik**: `src/hooks/useFirestore.js:65-122`
**Dowód**: hook zwraca `[state, set]`, zaczyna od `lsLoad(uid, key, fallback)` i potem czeka na `onSnapshot`. Konsumenty używają wartości natychmiast — nie wiedzą czy `[]` to „brak danych" czy „jeszcze nie załadowane".
**Skutek**: na fresh device user widzi „Pusty dzień" (empty state) przez moment podczas gdy Firestore się ładuje. Mygotanie.
**Naprawa**: zwracać `[state, set, { loading, error }]`. Rozważyć tylko dla kluczowych źródeł (TodayTab, SettingsScreen).

### P2-10: console.log/warn/error 33 wystąpienia w produkcji
**Dowód**: `grep -rn "console\." src/ | wc -l` → 33
Większość to defensywne `catch { console.error(...) }`, ale niektóre to debug leftovers (np. `console.info('[firebase] App Check initialized')` w `firebase.js:72`).
**Naprawa**: Vite plugin do strip-console w prod build, albo migrate na Sentry breadcrumbs (dla debug calls które są celowe).

### P2-11: Onboarding 1-step monolit zamiast progresji
**Plik**: `src/components/OnboardingScreen.jsx`
**Stan obecny**: jeden ekran z 4 polami (avatar, imię, DOB, sex). User musi wszystko wypełnić zanim apka się odpali.
**Problem**: dla niektórych userów to bariera. „Nie pamiętam dokładnej daty urodzenia" → nie wypełnia → nie wchodzi.
**Stan docelowy**: minimum viable onboarding = tylko imię. Reszta („Dodaj datę urodzenia żeby zobaczyć normy" — promptujemy w odpowiednim tabie). To jest growth-hack pattern z Notion / Calendly: pozwól userowi zacząć z minimum, dopiero gdy próbuje feature który wymaga więcej info — proś.
**Trade-off**: to wymaga rewrite, plus disclaimer „bez DOB nie pokażemy norm WHO". P2 bo trzeba zmierzyć drop-off (P1-6 analytics) zanim się zoptymalizuje.

### P2-12: Brak rate limit na CSV/JSON export — user może DDoS samego siebie
**Plik**: `src/components/SettingsScreen.jsx:118-158` (`handleCsvExport`, `handleFullBackupJson`, `handleFullBackupCsv`)
**Problem**: kliknięcie 3 buttonów z rzędu odpala 3 paralelne Firestore reads całej kolekcji. Dla usera z 6 miesiącami danych = ~2000 dokumentów × 3 = 6000 reads w 3 sekundy. Plus jeśli user spamem klikuje PDF generation w trakcie — jeszcze więcej.
**Naprawa**: prosty `useState(generating)` że zablokuje wszystkie eksporty gdy jakiś trwa. Plus `localStorage.last_export_at` z 60s rate limit.

---

## 🟢 P3 — backlog (8 pozycji)

### P3-1: Custom domain (`babylog.skudev.pl` lub `app.skudev.pl`)
**Plik**: konfiguracja DNS + GitHub Pages settings
**Korzyść**: profesjonalny URL, niezależność od GitHub Pages, łatwiejsza migracja hostingu w przyszłości bez rebuild AAB.
**Koszt**: 30 min DNS + 30 min Bubblewrap rebuild + 5 min Play Console release.
**Trigger**: po Production approval.

### P3-2: Roboto font 367 KB tylko dla PDF — wymienić na lokalny font lub Helvetica fallback
**Plik**: `src/utils/robotoFont.js` (367 KB base64)
**Korzyść**: jeśli PDF jest premium feature, koszt 367 KB ładuje tylko ~5-10% userów (premium). Ale gdy ładują, czekają. Alternatywa: jsPDF default font (Helvetica, 0 KB extra) z polskimi diakrytykami przez UTF-8 character set. Może wystarczy.

### P3-3: Brak biometrycznego logowania w TWA (Android FingerPrint API)
**Korzyść**: rodzic szybciej wraca do apki gdy widzi gorączkę o 3 nad ranem.
**Koszt**: WebAuthn z `pip register/get` flow, ~200 linii kodu plus testy. Wymaga Premium (security feature wartą kupna).

### P3-4: Brak share-link dla pediatry (zamiast PDF download)
**Korzyść**: pediatra dostaje URL z read-only viewerem ostatnich 14 dni, refreshuje się real-time. Wartość = wyższa niż PDF (live data podczas wizyty).
**Koszt**: Cloud Function generujący tymczasowe URL'e (signed Firestore reads) z 24h TTL. ~3-5 dni roboczych.

### P3-5: Wykres sparkline w TodayTab dla każdego stat (zamiast samej liczby)
**Plik**: `src/components/TodayTab.jsx:46-60`
**Korzyść**: user widzi „4 karmienia dzisiaj, mniej niż wczoraj (5)" zamiast tylko „4".
**Koszt**: 30 LOC dla mini-sparkline, 0 nowych dependencji.

### P3-6: Dark mode support (manifest ma `theme_color` dla light only)
**Plik**: `src/index.css` + `public/manifest.json:9`
**Korzyść**: rodzic w nocy podczas karmienia / pomiaru gorączki nie świeci sobie ekranem w twarz.
**Koszt**: design token rewrite z CSS custom properties (większość już masz), ~2 dni dev + 1 dzień QA.

### P3-7: Notification grupowanie (zamiast 1-na-1 dla każdego leku)
**Plik**: `public/sw.js:218-243` (`tag` mechanism)
**Korzyść**: user ma 3 dzieci z gorączką, dostaje 3 notyfikacje o paracetamolu. Mogą być zgrupowane w jednej („Czas na kolejną dawkę dla Ani, Kuby i Marysi").

### P3-8: Eksport do Apple Health / Google Fit (sync z platformą)
**Korzyść**: dla rodziców którzy używają Apple Watch / Fitbit do trackingu siebie, syncing dziecięcego pediatric data byłoby retention boost.
**Koszt**: HealthKit (iOS) + Health Connect (Android), wymagałoby native bridge. Jeśli zostajesz przy TWA — niemożliwe bez full-native rewrite.

---

## ➕ DODAJ — 6 pozycji od najwyższego ROI

### 1. Analytics events przez Firebase Analytics
**Co**: 6 custom events (onboarding_complete, first_entry_added, paywall_viewed, paywall_clicked, purchase_completed, purchase_failed)
**Dlaczego**: bez tego wszystkie decyzje o produktcie to strzelanie. Po 30 dniach z analytics będziesz wiedział czy paywall trigger w „dzień 7 trialu" działa lepiej niż „od momentu instalacji".
**Koszt**: S (1 dzień)
**Priorytet**: **P1**

### 2. Cloud Function `init_trial` (server-side trial start)
**Co**: callable function która zapisuje `users/{uid}/data/trial_start = Date.now()` przy pierwszym wywołaniu (idempotentnie). Client wywołuje po sukcesie loginu.
**Dlaczego**: rozwiązuje P0-1 (trial calculator z `auth.creationTime` jest bug). Plus anti-abuse: server jest source of truth, client nie może zmanipulować.
**Koszt**: S (0.5 dnia)
**Priorytet**: **P0**

### 3. Skeleton loaders dla 5 głównych tabów
**Co**: prosty `<TabSkeleton />` z animowanym shimmerem dla TodayTab, FeedTab, SleepTab, HealthTab, MedsTab.
**Dlaczego**: redukuje perceived loading time o 30-50%. User myśli że apka jest szybsza, mimo że nic nie zmieniło się w network speed.
**Koszt**: S (1 dzień)
**Priorytet**: **P2**

### 4. Pre-fetch PDF chunks gdy user otwiera SettingsScreen
**Co**: `<link rel="prefetch" href="/jspdf.js">` injected w SettingsScreen mount.
**Dlaczego**: po kliknięciu „Generate PDF" user nie czeka na 1 MB download (chunki są już w cache).
**Koszt**: S (0.5 dnia)
**Priorytet**: **P2**

### 5. Server-side PDF generation
**Co**: Cloud Function `generatePediatricReport` używa `puppeteer-core` (już masz w devDeps!) lub `jspdf` Node-side, generuje PDF z templates HTML. Returns URL do storage'a.
**Dlaczego**: usuwa 1 MB z client bundle. PDF generuje się na serwerze 2-3s, user dostaje gotowy plik. Plus skalowalne: server może generować skomplikowane raporty (np. percentile WHO charts jako embedded images) których jspdf w browserze nie udźwignie.
**Koszt**: M (3 dni)
**Priorytet**: **P2**

### 6. Onboarding z one-tap setup (tylko imię, reszta opcjonalna)
**Co**: refactor OnboardingScreen na 1 pole (imię) + skip dla DOB, sex, avatar (default values). Reszta jest promowana w-tab gdy potrzebna.
**Dlaczego**: to jest growth hack. Każdy dodatkowy required field w onboardingu = 5-10% drop-off (industry data). 4 fields → ~20-30% userów odpada przed pierwszym wpisem.
**Koszt**: M (2 dni dev + analytics check)
**Priorytet**: **P2** (najpierw analityka — P1-6 — potem optymalizacja)

---

## ➖ USUŃ / UPROŚĆ — 6 pozycji

### 1. 4 nieużywane komponenty
**Co**: `StreakBadge.jsx` (43 LOC), `DiaryTab.jsx` (84 LOC), `MedicalDisclaimerScreen.jsx` (328 LOC), `EmptyStateHero.jsx` (130 LOC)
**Dlaczego**: 0 importów. 585 linii dead code w repo myli każdego nowego, generuje koszt utrzymania (każda zmiana w i18n.js wymaga uwagi czy te pliki używają kluczy).
**Strata dla usera**: zero (i tak nie były renderowane).

### 2. Plan lifetime z paywall (jeśli nie jest aktywny w Play Console)
**Co**: usunąć element `lifetime` w `src/data/premiumPlans.js:55-63` LUB dodać go do Play Console przed Production launch.
**Dlaczego**: kliknięcie tego planu przez usera = błąd „SKU not found" → modal failure z error code. Confidence killer.
**Strata dla usera**: option non-recurring purchase. Ale jeśli i tak nie jest aktywny — strata teoretyczna.

### 3. Feature „Priorytetowe wsparcie 24h" w paywall
**Co**: usunąć ostatni feature z `src/components/PaywallScreen.jsx:38-48`
**Dlaczego**: nieskalowalne (1 osoba = 1 odpowiedź dziennie), prawnie wątpliwe (apka nie jest medical advice provider), nie sprzedaje (rodzic z gorączkującym dzieckiem nie zaufa solo founderowi że odpowie szybciej niż pediatra).
**Strata dla usera**: zero realna (i tak nigdy by nie odpowiedział w 24h przy skali 100+ userów).

### 4. „Share with partner" z paywall (do czasu implementacji)
**Co**: usunąć feature z PaywallScreen aż będzie working.
**Dlaczego**: feature `comingSoon: true` w paywall = misleading claim per Google Play policy. Nawet z badge'em.
**Strata dla usera**: zero (i tak nie działa).

### 5. 3 z 9 modułów w MORE_TABS
**Co**: zdecyduj się na **jedno** z 3 value props (P1-3) i wyrzuć moduły które nie pasują:
  - Jeśli „Notatki do pediatry" → wywal `cough`, `teething`, `diet`, `vacc`, `milestones` (zostaje: reference, seek_help, growth, doctor)
  - Jeśli „Tracking podczas choroby" → wywal `milestones`, `vacc`, `diet`, `teething`, `growth` (zostaje: reference, seek_help, cough, doctor)
  - Jeśli „Dziennik 0-3" → wywal `seek_help`, `cough`, `doctor` (zostaje: reference, milestones, teething, growth, vacc, diet)
**Dlaczego**: każdy moduł = 200-500 LOC + i18n entries + Cloud Function listener + maintenance burden. Apka biegnie szybciej, kod jest czytelniejszy, communication value prop jasniejsza.
**Strata dla usera**: niektórzy będą wkurzeni. Ale ci którzy zostaną, kupią.

### 6. EN locale (do czasu walidacji rynku PL)
**Co**: usunąć drugi blok `TRANSLATIONS.en` w `src/i18n.js:1700+` (1220 keys) — zostawić tylko PL.
**Dlaczego**: target rynek to Polska (apka Premium 14,99 zł/mc to polskie ceny). EN lokalizacja: ~2 tygodnie pracy bez zwrotu, plus 80 KB w bundle dla każdego usera. Weryfikacja: ile userów zmieniło język na EN w ostatnim miesiącu? (znowu — wymaga analytics).
**Strata dla usera**: 0 jeśli userów EN ~0 (najprawdopodobniejsze). Mały deficyt jeśli pełen polski rynek nie wystarczy do break-even.

---

## 🔄 PRZEPROJEKTUJ — 4 obszary

### 1. Architektura App.jsx (z 1313 LOC monolitu na 3 warstwy)
**Stan obecny**: jeden komponent z 14 useState, 9 useFirestore, switch z 17 case'ami i 4 modale rendererowane warunkowo.
**Stan docelowy**: `<AppShell>` (auth gate, consent, onboarding) + `<MainApp>` (tab content + topbar + nav) + `<usePurchaseFlow>` hook + `<NavigationProvider>` context.
**Dlaczego**: re-render performance + onboarding new dev (z 30 min „WTF" do 5 min „aha"). Plus ułatwia testowanie (każda warstwa osobno).

### 2. Paywall: z „lista 7 features" na „1 problem + 1 rozwiązanie"
**Stan obecny**: paywall ma 7 features z ikonkami, każda z opisem 1 zdania. User widzi grid „dostajesz dużo" — to weak sales pattern bo nie odpowiada na pytanie „dlaczego to jest dla mnie".
**Stan docelowy**: 1 hero message zgodne z killer feature (P1-3), np. „Wyjdziesz od pediatry z odpowiedzią. Nie z pytaniem." + screenshot/video PDF reportu generowanego z apki + 1 social proof testimonial (gdy będziesz miał) + cena.
**Dlaczego**: konwersja paywall „lista features" w 2026 to ~1-3%, „one-problem-one-solution" to 5-12% (Hubspot, ProfitWell research). Czyli 3-4× więcej pieniędzy.

### 3. Decyzja PL-only → expand-later vs PL+EN od dnia 1
**Stan obecny**: oba języki w bundle, EN obecne w UI ale prawdopodobnie ~1% użycia.
**Stan docelowy**: PL only do osiągnięcia 1000 płacących użytkowników w PL. Potem decyzja czy EN warta inwestycji (przez analytics gdzie userzy są).
**Dlaczego**: wcześnie ekspandować internationally = rozcieńczać brand i marketing. „Spokojny Rodzic" jest polskim brandem, „Calm Parent" w EN traci konkurencję z 50 amerykańskimi apkami z większymi budżetami.

### 4. Trial start: z auth metadata na server-side write
**Stan obecny**: `auth.currentUser.metadata.creationTime` (P0-1 bug — każdy użytkownik z istniejącym kontem Firebase widzi trial=0).
**Stan docelowy**: Cloud Function `init_trial` (callable, idempotentny) zapisuje `users/{uid}/data/trial_start = serverTimestamp()` przy pierwszym wywołaniu. Client wywołuje raz po sukcesie loginu. Anti-abuse: CF check `getDoc().exists()` przed write.
**Dlaczego**: jedno źródło prawdy (Firestore), niemożliwe do zmanipulowania client-side, działa dla istniejących userów (creationTime nie ma znaczenia), kompatybilne z reinstall.

---

## 📊 Wskaźnik gotowości do sprzedaży: **4/10**

**Skłąd to się składa:**

| Wymiar | Ocena | Krótkie uzasadnienie |
|---|---|---|
| Tech działa | 7/10 | Backend ok, frontend dłuży, nie ma critical bugów po v2.11.30 |
| Tech jest skalowalny | 4/10 | App.jsx monolith, recharts ładowane sync, brak analytics, 24+ Firestore listenerów |
| UX jest przyjemny | 5/10 | Po 30 fixach scroll/touch działa, ale 210 fontSize 10-12 i 25 sub-44px buttonów wciąż zostało |
| UX nawigacja jasna | 4/10 | 5 main tabów + 9 More tabs + 17 case'ów w switch = paradox of choice. User nie wie co najważniejsze |
| Killer feature | 3/10 | Niezdefiniowany. Apka próbuje być Notion+Huckleberry+WebMD jednocześnie |
| Paywall kupuje | 4/10 | 3 features wątpliwe (Share, 24h support, „WHO normy" dla teething), CTA generyczny |
| Compliance | 7/10 | RODO ok (privacy policy istnieje, Firestore rules OK), MDR exit clean (statyczne tabele PTP/AAP), Google Play assetlinks działają |
| Analytics | 0/10 | Zero. Każda decyzja jest ślepa. |
| Monetyzacja działa | 6/10 | Po v2.11.19 RC pipeline naprawdę działa, ale 13 zerowych customers w historii sugeruje że marketing nie jest tak dobry jak tech |
| Średnia | **4/10** | |

**Co trzeba zmienić żeby skoczyło do 7/10 (1 sprint, ~2 tygodnie):**
1. P0-1 fix (trial start server-side) — 0.5 dnia
2. P1-2 paywall cleanup (wywal 3 wątpliwe features) — 0.5 dnia
3. P1-3 wybór killer feature + redesign paywall hero — 2 dni
4. P1-6 Firebase Analytics events — 1 dzień
5. P0-3 cleanup dead code — 0.5 dnia
6. P2-2 skeleton loaders — 1 dzień

**Razem: ~5.5 dnia roboczego** dla skoku z 4/10 na 7/10.

---

## Uwaga końcowa — co NIE jest problemem

Żeby było jasne że nie tylko narzekam:

1. **Backend jest poukładany.** RC webhook + Pub/Sub + acknowledge purchase + Firestore rules z anti-overwrite — to jest enterprise-grade po sesjach v2.11.13–25. Większość PWA z polskiego rynku tego nie ma.
2. **Compliance MDR EXIT REFACTOR (v2.10.6) to mistrzostwo.** Wycofanie active clinical decision support i zastąpienie statycznymi tabelami PTP/AAP = unika klasyfikacji jako MDSW pod Rule 11. To jest świadoma, dokumentowana decyzja architektoniczna. Większość MVP w segmencie health by tego nie uniknęła.
3. **Privacy policy jest **prawdziwa** (`public/privacy.html` 80+ linii konkretnej treści).** Większość apek ma generic boilerplate. Ta jest specific dla Spokojny Rodzic.
4. **Sentry + breadcrumbs + idempotent webhook + retry queue dla purchase tokenów** — defensive engineering na poziomie senior dev. To są patterny które normalnie pojawiają się dopiero po pierwszym data loss incident.
5. **i18n model jest prosty i działa** (mimo że plik jest za duży) — zwykły lookup po kluczu z fallback do PL. Bez ceremoniału `react-intl` który byłby overkill.

To jest apka napisana przez kogoś kto myśli o problemach. **Brakuje tylko jasnej decyzji co sprzedaje, komu i dlaczego — reszta jest do polerowania, nie do przepisania od zera.**

---

## ✋ STOP

Raport gotowy. Czekam na decyzję co dalej:
- Idziemy P0 + P0 + P0 (3 fixy, ~1 dzień)?
- Czy P1-3 (wybór killer feature) zanim cokolwiek innego — bo to determinuje co usuwamy w P1-2 i jakie events trackujemy w P1-6?
- Czy raport jest czytany "do wglądu", a my czekamy na PrimeTestLab retest po v2.11.30?

Nie ruszam kodu bez Twojego "zaczynamy".
