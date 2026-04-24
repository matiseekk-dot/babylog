# 🧪 Manual QA Checklist — Spokojny Rodzic

**Wersja:** v2.5.6
**Target Production:** 4-5 maja 2026
**Dla:** Mateusz Skura / testerzy Closed Testing

---

## Jak używać

Przed każdym release do Closed Testing → **przejdź wszystko poniżej**.
Każdy ✓ to kontrolka: zaznacz gdy przeszła, wpisz notatkę gdy coś nie gra.

Wszystkie testy zajmą ok. **45-60 min**. Lepiej dzisiaj 1h QA niż jutro 3 dni fixowania produkcji.

---

## 🟢 SMOKE TEST (10 min) — pierwsza rzecz po deploy

**Cel:** apka nie jest zbuildowana, nie crashuje, loguje się.

- [ ] Otwórz `https://matiseekk-dot.github.io/babylog/` w Chrome na telefonie
- [ ] Strona się ładuje (biały ekran → zawartość w < 3s)
- [ ] DevTools / Console → **ZERO błędów JavaScript** (czerwone)
- [ ] Onboarding (jeśli fresh install) pokazuje 3 kroki, potem kończy się
- [ ] Widzę dashboard z pustymi statsami (0 karmień, 0 snu)
- [ ] Klikam "Dodaj karmienie" → modal się otwiera
- [ ] Zapisuję → widzę wpis na liście
- [ ] Klikam przełącznik `PL/EN` w topbarze → interfejs zmienia język
- [ ] Przełączam z powrotem na PL

---

## 🔴 KRYTYCZNE — Test scenariuszy produkcyjnych

### 1. Bug 3 regression — guest → login (nie można tego pominąć!)

**Cel:** Sprawdzamy czy dane się nie gubią przy zmianie kont (priorytet #1).

- [ ] Otwórz apkę w **trybie Incognito** (żeby nie mieć cache)
- [ ] Wybierz **"Kontynuuj bez konta"** (guest)
- [ ] Dodaj profil dziecka: "TestGuestKid"
- [ ] Dodaj 2 karmienia, 1 temperaturę, 1 lek
- [ ] Sprawdź że wpisy są widoczne
- [ ] Klikaj dalej w apce → wpisy nadal widoczne
- [ ] **Zaloguj się przez Google** (nowe konto testowe ALBO Twoje)
- [ ] **Powinieneś zobaczyć dialog: "Wykryto dane z trybu gościa"**
- [ ] Kliknij **"Dodaj dane gościa do konta"**
- [ ] Sprawdź że dane TestGuestKid są w koncie (widoczne w dashboard)
- [ ] **Wyloguj się** (Settings → Konto → Wyloguj)
- [ ] **Zaloguj ponownie** to samo konto Google
- [ ] **Dialog NIE powinien się pojawić ponownie** (flag skipped zapisany)
- [ ] Dane dalej widoczne ✓

### 2. Bug 3 regression — scenariusz "Laury"

**Cel:** Upewniamy się że dane konta nie są nadpisywane danymi guesta.

- [ ] Zaloguj się na konto Google z danymi (np. Twoje istniejące)
- [ ] Sprawdź że widzisz swoje dziecko (np. Laura)
- [ ] **Wyloguj**
- [ ] **Guest mode** → dodaj inne dziecko "GuestBaby"
- [ ] **Zaloguj ponownie** na to samo konto
- [ ] Pojawia się dialog migracji → kliknij **"Dodaj dane gościa"**
- [ ] **KLUCZOWY TEST:** Laura **NADAL ISTNIEJE** (nie zniknęła!)
- [ ] GuestBaby też został dodany do listy profili

### 3. Zakup Premium (bez płacenia!)

**Cel:** Paywall i Play Store modal działają.

**Na komputerze (web version):**
- [ ] Kliknij przycisk 🔒 Premium w dashboardzie
- [ ] Pokazuje się paywall z 3 planami (14.99 / 99.99 / 199.99 zł)
- [ ] Klikam "Kup Premium"
- [ ] **Pokazuje się modal** "Pobierz aplikację z Google Play" (NIE brzydki alert)
- [ ] Klikam "🎯 Otwórz Google Play" → otwiera play.google.com w nowej karcie
- [ ] Klikam "Anuluj" → modal się zamyka

**W TWA na Androidzie (po zainstalowaniu z Closed Testing):**
- [ ] Paywall się otwiera
- [ ] Kliknięcie "Kup" → **otwiera się Google Play Billing**
- [ ] Jako licensed tester → mogę dokończyć zakup (bezpłatny)
- [ ] Po zakupie → ekran sukcesu → Premium aktywne
- [ ] Ikonki 🔒 znikają, wszystkie funkcje odblokowane

### 4. PDF raport dla pediatry

**Cel:** PDF generuje się, polskie znaki OK, pytania są.

- [ ] Dodaj dane testowe (feed, temp, med, question)
- [ ] Settings → "Generuj raport PDF"
- [ ] Wybierz zakres "Ostatnie 30 dni"
- [ ] PDF pobiera się
- [ ] **Otwórz PDF** — sprawdź wizualnie:
  - [ ] Tytuł "Raport dla pediatry" ma polskie ogonki OK (nie "Raport dia pediatry")
  - [ ] Sekcja Podsumowanie: "Karmień łącznie", "Najwyższa temperatura" — ogonki OK
  - [ ] Tabela Temperatura — wartości w °C, kolumny ok
  - [ ] Tabela Leki — widzę kolumnę "Postać" z emoji (💊 Tabletka)
  - [ ] Sekcja "Pytania do pediatry" — pokazują się pytania z listy
  - [ ] Footer: "Raport nie zastępuje badania lekarskiego" — z ogonkami OK
  - [ ] Numeracja stron działa

### 5. Data Export (JSON + CSV) — NOWE v2.5.6

- [ ] Settings → sekcja "Pełna kopia zapasowa"
- [ ] Kliknij **"📦 Pobierz pełny backup (JSON)"**
- [ ] Pobiera się plik `spokojny-rodzic-backup-YYYY-MM-DD.json`
- [ ] Otwórz plik w Notepad+ / VSCode
- [ ] Widzę strukturę:
  - `exportVersion: "1.0"`
  - `exportDate: "2026-04-..."`
  - `uid: "xyz..."` (albo null jeśli guest)
  - `data: { profiles: [...], feed_xxx: [...], ... }`
- [ ] Kliknij **"📊 Pobierz dane do Excel (CSV)"**
- [ ] Pobiera się `spokojny-rodzic-dane-YYYY-MM-DD.csv`
- [ ] Otwórz w Excel / LibreOffice
- [ ] Polskie znaki są OK (dzięki BOM UTF-8)
- [ ] Widzę sekcje: "# PROFILE DZIECI", "# FEED — ImięDziecka", itd.

---

## 🟠 WAŻNE — funkcjonalność

### 6. Karmienia (FeedTab)

- [ ] Dodaj karmienie piersią (L/R, czas)
- [ ] Dodaj karmienie butelką (ml)
- [ ] Zobacz wpis w liście dzisiejszych
- [ ] Edytuj wpis → zmiany zapisują się
- [ ] Usuń wpis → toast "undo" pozwala przywrócić
- [ ] Historia pokazuje wpisy z wczoraj i starsze
- [ ] Timer piersi start → pauza → stop → zapisuje czas

### 7. Sen (SleepTab)

- [ ] Uruchom timer snu
- [ ] Timer liczy czas w apce (widzę odliczanie)
- [ ] **Zamknij apkę**, otwórz za kilka min
- [ ] Timer nadal działa (persisted state)
- [ ] Zatrzymaj → wpis zapisany z poprawnym czasem

### 8. Temperatura (TempTab) — Bug 6 regression

- [ ] Dodaj temperaturę 38.5°C, metoda "odbytniczo"
- [ ] **Wejdź w inną zakładkę i wróć** do Temperatura
- [ ] **NIE ma flickera!** Wpisy są od razu widoczne (bez znikania i powrotu)
- [ ] Alert pojawia się (>38°C)
- [ ] Wykres trendu działa (dla Premium)

### 9. Leki (MedsTab) — Bug 4 regression

- [ ] Dodaj lek → widzę dropdown "Postać leku"
- [ ] Wybieram 🌡️ Czopek → zapisuje się
- [ ] W liście widzę: "Nazwa · 12:30 · 🌡️ Czopek · 5ml"
- [ ] Kalkulator paracetamolu/ibuprofenu działa

### 10. Pieluchy / Toaleta (DiaperTab + Settings) — Bug 5 regression

- [ ] Settings → "Tryb pielęgnacji" (Bug 5 fix)
- [ ] Wybierz **👶 Pieluchy** → zakładka pokazuje "mokra/brudna/obydwie"
- [ ] Wybierz **🚽 Nocnik** → zakładka zmienia się na nocnik-siku/nocnik-kupa
- [ ] Wybierz **🚻 Toaleta** → zakładka się ukrywa (visibleTabs.diaper=false)
- [ ] Przywróć **Pieluchy** → zakładka wraca

### 11. Wzrost / waga (GrowthTab)

- [ ] Dodaj pomiar wzrost+waga
- [ ] Wykres pokazuje punkt
- [ ] Premium: widzę normy WHO na wykresie

### 12. Szczepienia (VaccineTab)

- [ ] Widzę polski kalendarz PSO (urodzenia, 6 tyg, itd.)
- [ ] Mogę zaznaczyć szczepienie jako "zrobione"
- [ ] Data zapisuje się

### 13. Dieta BLW (DietTab)

- [ ] Widzę listę produktów dla wieku dziecka
- [ ] Mogę dodać własny produkt
- [ ] Checkbox "spróbowane" zapisuje się

### 14. Kamienie milowe (MilestonesTab)

- [ ] Widzę listę 16 milestones dla wieku
- [ ] Mogę dodać własny
- [ ] Zaznaczenie "osiągnięty" + data

### 15. Objawy (SymptomsTab)

- [ ] Dodaj objaw z nasileniem
- [ ] Crisis alert się pojawia jeśli temp + 3+ objawów

### 16. Dziennik (DoctorNotesTab)

- [ ] Dodaj pytanie do lekarza → `status=pending`
- [ ] Dodaj notatkę z wizyty
- [ ] Historia wszystkich notatek widoczna

---

## 🟡 UX / performance

### 17. Language switcher

- [ ] Topbar → przycisk PL/EN
- [ ] Klik → interfejs zmienia język NATYCHMIAST (bez reload)
- [ ] Wszystkie teksty po zmianie są tłumaczone (nie mieszanka PL+EN)
- [ ] Onboarding w obu językach
- [ ] PDF w wybranym języku

### 18. Offline

- [ ] DevTools → Network → Offline
- [ ] Apka nadal się otwiera (z cache)
- [ ] Dodaję karmienie offline → zapisuje się lokalnie
- [ ] Wracam online → sync z Firestore automatyczny

### 19. Multi-profile

- [ ] Dodaj drugiego dziecka (Baby 2)
- [ ] Przełączam między profilami (avatar w topbarze)
- [ ] Dane każdego dziecka są osobne
- [ ] Mogę usunąć profil

### 20. Premium gating (free user)

- [ ] Jako **free user** widzę:
  - 🔒 przy premium features
  - PremiumTeaser cards zamiast Charts/Statistics
  - Paywall przy kliknięciu 🔒
- [ ] Jako **Premium user**:
  - ZERO 🔒 ikon
  - Wykresy i pełne statystyki widoczne
  - PDF export działa

---

## 🔵 Edge cases

### 21. Pusty stan

- [ ] Nowy profil bez wpisów → każda zakładka ma ładny "empty state" (nie błąd)
- [ ] PDF z pustym okresem → komunikat "Brak danych w tym zakresie"

### 22. Duża ilość danych

- [ ] Dodaj 50 karmień jednego dnia
- [ ] Lista renderuje się smoothly
- [ ] PDF dla 30 dni z dużo danymi działa

### 23. Błędy sieci

- [ ] Firebase offline → apka pokazuje banner "offline"?
- [ ] RevenueCat niedostępne → paywall pokazuje sensowny komunikat

### 24. Granice wieku

- [ ] Dziecko 0 miesięcy → nie crash (np. kalendarz szczepień)
- [ ] Dziecko 60 miesięcy (5 lat) → auto-hide banner pyta o ukrycie karmień/pieluch

---

## 📋 Status przed release

Wypełnij jeśli wszystko OK:

**Data testu:** __________
**Wersja:** v2.5.__
**Tester:** Mateusz
**Wynik:**
- [ ] Smoke test OK (10 min)
- [ ] Scenariusze krytyczne (1-5) OK
- [ ] Ważne (6-20) OK
- [ ] Edge cases (21-24) OK
- [ ] Regression: Bug 1, 2, 3, 4, 5, 6, 7 wszystkie naprawione ✓

**Blockery przed release:** _____________________

**Odkryte nowe bugi:** _____________________

---

## Priorytety gdy nie masz czasu

**Mam 10 min:** tylko Smoke test (sekcja 🟢)
**Mam 30 min:** Smoke + scenariusze krytyczne 1-4
**Mam 1h:** wszystko powyżej + sekcja 🟠 (funkcjonalność)
**Mam 2h:** cała lista

Powodzenia 💚
