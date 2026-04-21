# Security Audit — Firestore Rules

**Data:** 2026-04-21
**Audytor:** Claude (Anthropic)

## Obecne rules

Plik `firestore.rules`:

```
match /users/{userId}/data/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
match /{document=**} { allow read, write: if false; }
```

## Co jest OK ✅

- **User A NIE widzi danych User B** — `request.auth.uid == userId` wymusza zgodność
- **Guest (niezalogowany) NIE ma dostępu do niczego** — `request.auth != null`
- **Wszystko poza /users/ jest zablokowane** — catch-all `match /{document=**}`
- **Pojedynczy punkt wejścia** — nie ma "public/*" ani "shared/*"

## Test manualny — rób to PRZED wdrożeniem zmian

### Test 1: User A próbuje czytać User B

```javascript
// Zaloguj się jako User A
// Otwórz DevTools Console
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

// User A próbuje czytać dane User B (UID podmień na istniejący)
const ref = doc(db, 'users', 'UID_USERA_B', 'data', 'feed_default')
try {
  const snap = await getDoc(ref)
  console.error('❌ SECURITY HOLE — user A może czytać dane B!')
} catch (e) {
  console.log('✅ OK — permission denied:', e.code)
  // Oczekiwane: permission-denied
}
```

**Oczekiwany wynik:** `permission-denied`. Jeśli dostajesz dane User B — **KRYTYCZNY BŁĄD**.

### Test 2: Guest próbuje czytać

```javascript
// Wyloguj się (guest mode)
const ref = doc(db, 'users', 'ANY_UID', 'data', 'feed_default')
try {
  await getDoc(ref)
  console.error('❌ SECURITY HOLE — guest może czytać dane!')
} catch (e) {
  console.log('✅ OK — permission denied:', e.code)
}
```

### Test 3: Pisanie pod cudzy UID

```javascript
// Zaloguj się jako User A
const ref = doc(db, 'users', 'UID_USERB', 'data', 'feed_default')
try {
  await setDoc(ref, { value: [{ malicious: true }] })
  console.error('❌ SECURITY HOLE — user A nadpisał dane B!')
} catch (e) {
  console.log('✅ OK — permission denied:', e.code)
}
```

### Test 4: Sanity — User A czyta swoje dane

```javascript
// Zaloguj się jako User A, getCurrentUser().uid = 'UID_A'
const ref = doc(db, 'users', 'UID_A', 'data', 'feed_default')
const snap = await getDoc(ref)
console.log('✅ User A widzi swoje dane:', snap.data())
```

**Oczekiwany wynik:** widzi dane.

## Jak wdrożyć zmiany

1. Idź do Firebase Console → Firestore Database → Rules
2. Skopiuj zawartość `firestore.rules`
3. Kliknij **Publish**
4. W zakładce **Usage** sprawdź po 5 minutach czy nie ma `permission-denied` dla swoich legalnych operacji (to by oznaczało że reguły są zbyt restrykcyjne — ale nasze nie są)

## Dalsze kroki (na później — NIE blokery launchu)

- **App Check** — zabezpieczenie przed botami/skryptami które mogłyby scrapować API key (pomimo że rules chronią dane, spam request → koszty Firestore)
- **Rate limiting** — dla `setDoc` — przy obecnej architekturze user może w 1 sekundę zrobić 1000 zapisów. Dodać debounce w `useFirestore`.
- **Field validation** — aktualnie user może zapisać dowolny JSON do `value`. Dodać walidację schema w rules.
- **Audit logs** — Firestore ma audit logs w GCP, włączyć dla suspicious patterns (np. 10000 reads/min z jednego konta)

## Conclusion

**Obecny stan rules jest bezpieczny dla MVP/launch.**

Zero zmian w `firestore.rules` — obecna wersja jest OK.
Dodano tylko komentarz w pliku + ten dokument audytowy.
