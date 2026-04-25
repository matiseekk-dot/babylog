# DEPLOY v2.8.0 — FCM (Firebase Cloud Messaging)

## Co się zmieniło

Apka v2.8.0 zawiera FCM — **niezawodne powiadomienia w tle** które działają **gdy apka jest zamknięta**. Wymaga deploy Cloud Function która co 5 min sprawdza wpisy leków i wysyła push.

## Twoja kolejność (po wgraniu kodu z GitHub)

### 1. Push do GitHub (15 min)

W GitHub Desktop zobaczysz wszystkie zmiany:
- `package.json` — version bump 2.7.5 → 2.8.0
- `src/firebase.js` — dodany `getMessaging` + VAPID
- `src/hooks/useFCM.js` — NOWY plik
- `src/components/SettingsScreen.jsx` — integracja FCM
- `public/firebase-messaging-sw.js` — NOWY plik (osobny SW dla Firebase)
- `functions/index.js` — NOWY (Cloud Function co 5 min)
- `functions/package.json` — NOWY
- `firebase.json` — NOWY
- `.firebaserc` — NOWY
- `firestore.rules` — NOWY (security rules dla tokenów)
- `firestore.indexes.json` — NOWY

Commit message:
```
v2.8.0: FCM — reliable background notifications via Firebase Cloud Functions
```

Push.

### 2. Firebase CLI install (5 min)

W terminalu (PowerShell na Windows / Terminal na Mac):

```bash
npm install -g firebase-tools
```

Sprawdź:
```bash
firebase --version
```
Powinno pokazać 13.x.x lub wyższe.

### 3. Login do Firebase (3 min)

```bash
firebase login
```

Otworzy się przeglądarka. Zaloguj na Google które ma dostęp do projektu **babylog-3c1cc**.

Po zalogowaniu wróć do terminala — powinieneś zobaczyć "✔ Success! Logged in as ..."

### 4. Deploy Cloud Functions (15-20 min, **najważniejszy krok**)

W terminalu wejdź do folderu repo:

```bash
cd ścieżka/do/babylog
```

Zainstaluj deps dla functions:

```bash
cd functions
npm install
cd ..
```

Wystartuj deploy:

```bash
firebase deploy --only functions
```

**Pierwszy deploy zajmie 5-10 minut.** Google buduje container, wszystko od zera.

#### Jeśli pojawi się błąd "API not enabled"

Firebase poprosi o włączenie API. Możliwości:

- **Cloud Build API**
- **Cloud Run API**
- **Cloud Scheduler API**
- **Cloud Functions API**
- **Eventarc API**

W błędzie będzie link typu `https://console.cloud.google.com/apis/library/...` — kliknij, kliknij **Enable**, wróć do terminala, ponownie wpisz `firebase deploy --only functions`.

Może wymagać 2-3 prób (każda inna API). To normalny pierwszy raz.

#### Sukces

Pod koniec zobaczysz:

```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/babylog-3c1cc/overview
```

### 5. Deploy Firestore rules (3 min)

```bash
firebase deploy --only firestore:rules
```

Krócej — kilkanaście sekund.

### 6. Weryfikacja deploy w konsoli (5 min)

Wejdź do Firebase Console → projekt **babylog** → lewy panel → **Functions**.

Powinieneś zobaczyć:

| Function | Type | Trigger |
|---|---|---|
| `scheduleNotifications` | 2nd gen | Scheduled (every 5 minutes) |

Jeśli widzisz tę pozycję — **Cloud Function jest aktywna**. Co 5 min uruchamia się i sprawdza wpisy leków.

### 7. Build nowego AAB w PWABuilder (15 min)

1. Po deploy GitHub Pages (~3 min od push) idź do [pwabuilder.com](https://www.pwabuilder.com/)
2. URL: `https://matiseekk-dot.github.io/babylog/`
3. **Package for stores** → **Android**
4. **versionCode**: poprzedni +1 (np. jeśli ostatnio było 6, teraz 7)
5. **versionName**: `2.8.0`
6. Pobierz nowy AAB

### 8. Upload do Play Console Internal Testing (5 min)

1. Play Console → Spokojny Rodzic → **Testowanie wewnętrzne**
2. **Utwórz nową wersję**
3. Drag-drop nowy AAB
4. Release notes:
   ```
   v2.8.0
   • Niezawodne powiadomienia w tle (Firebase Cloud Messaging)
   • Notyfikacje działają nawet gdy aplikacja jest zamknięta
   • Poprawione UI alertów
   ```
5. Save → Roll out to internal testing

### 9. Test na telefonie (15-30 min)

#### Setup
1. **Odinstaluj** Spokojny Rodzic z telefonu
2. Otwórz link Internal Testing w Play Store na telefonie
3. Zainstaluj nową wersję (2.8.0)

#### Sprawdzenie czy FCM token został zapisany
1. Otwórz apkę → Settings → Powiadomienia
2. Klik **"Włącz powiadomienia"**
3. Akceptuj systemowy popup
4. Toast zielony "Powiadomienia włączone"
5. **Sprawdź w Firebase Console**:
   - Firestore Database → wybierz `users/{Twoje_UID}/tokens/`
   - Powinien być **nowy dokument** z polem `token` (długi string)
   - To znaczy że FCM token został pomyślnie zapisany ✓

#### Test prawdziwego powiadomienia
1. W apce → Tab Leki
2. Dodaj wpis paracetamol z czasem **4h 1min wstecz** (czyli "wygasł 1 minutę temu")
   - np. teraz jest 14:30, dodaj wpis paracetamol z godziną 10:29
3. **Zamknij apkę** (Force stop w Settings telefonu)
4. **Czekaj 5-10 minut**
5. Notyfikacja powinna przyjść:
   - Title: "Lek przestaje działać: Paracetamol"
   - Body: "Podałeś/-aś o 10:29..."
6. Tap na notyfikację → otwiera apkę

## ⚠️ Rzeczy do wiedzenia

### Cold start

Pierwsze wywołanie Cloud Function po deploy może mieć opóźnienie 30-60s. Po pierwszym sukcesie funkcja jest "rozgrzana" i działa instant.

### Co 5 minut, nie real-time

Cron uruchamia się **co 5 min**, więc notyfikacja może przyjść z **opóźnieniem 0-5 min** od faktycznego "wygaśnięcia" leku. To akceptowalne.

### Wykryte ograniczenia

- Cloud Function patrzy **tylko na Firestore** — wpisy lokalne (offline) nie wywołają notyfikacji dopóki nie zsynchronizują się
- Userzy bez FCM tokenu (czyli bez nadanej zgody) są pomijani — to oszczędność kosztów

### Monitoring

Co tydzień sprawdź:
- **Firebase Console → Functions → Logs** — czy są errors
- **Firebase Console → Usage and billing** — czy nie zbliżamy się do limitu (20 zł)

Realny koszt dla 100-1000 userów: **~0 zł** (free tier z dużym zapasem)

## 🚨 Jeśli coś nie działa

### Cloud Function deployed, logi pokazują "Found 0 users with tokens"

→ Token nie został zapisany. Wgraj kod ponownie, otwórz apkę, kliknij "Włącz powiadomienia". Sprawdź Firestore manualnie czy pojawił się dokument w `users/{uid}/tokens/`.

### Token zapisany w Firestore, ale notyfikacje nie przychodzą

→ Sprawdź **Firebase Console → Functions → scheduleNotifications → Logs**. Tam zobaczysz co Cloud Function loguje za każdym wywołaniem.

### "Permission denied" w Firestore przy zapisie tokenu

→ Firestore rules nie zostały deploy'd. Wpisz `firebase deploy --only firestore:rules` jeszcze raz.

### Nadal URL bar w TWA (chociaż nie powinien — to się zmieniło)

→ assetlinks już mamy ustawione, więc raczej nie wystąpi. Jeśli wystąpi, force stop + reinstall apki.

## Wracaj po pomoc

Pierwsze wgrania Cloud Functions często coś się wypierdalają. **Każdy błąd** wrzuć tutaj — pomogę zdiagnozować.

Powodzenia.
