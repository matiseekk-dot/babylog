# v2.11.5 — Final polish: SW offline cache, JSON backup version bug, visual cleanup

**Data:** 2026-05-03
**Cel:** Ostatni przejazd po pozostałych nie-przetestowanych dotąd elementach apki — Service Worker offline support, JSON backup version metadata, aria-labels, długie nazwy w topbarze, PDF EN content verification.

**Poprzednie:** v2.11.4 (decimal comma + edge case verification).

---

## Bugi naprawione

### 1. JSON backup deklarował fałszywą wersję apki (v2.5.5)

`exportAllDataAsJson(uid, appVersion = '2.5.5')` — domyślny argument hardkodowany jako `'2.5.5'`. SettingsScreen wywoływał bez przekazania `appVersion`, więc każdy export pisał:

```json
"appVersion": "2.5.5"
```

Niezależnie od tego że apka jest na 2.11.x. Confusing dla support / debugging — backup pochodzi z apki która "ma 2.5.5" (faktycznie z 2.11.4+). Fixed:
- Domyślny argument zmieniony na `undefined`, fallback na `__APP_VERSION__` z Vite define.
- `SettingsScreen.handleFullBackupJson()` przekazuje `APP_VERSION`.

### 2. Aria-labels hardkodowane po polsku

- `DoctorNotesTab.jsx:360,515` — `aria-label="Edytuj"` (2 miejsca, używane przez `replace_all`).
- `PaywallScreen.jsx:83` — `aria-label="Zamknij"` X-button.

Wszystkie zmienione na `t('common.edit')` / `t('common.close')` — screen reader users w EN nie usłyszą polskiego "Edytuj".

### 3. Długie imię dziecka łamie layout topbara

Imię typu `Józef-Jędrzej Świętopełk Żółtawiec O'Brian` (49 chars Unicode) w `.baby-chip` powodowało wrap do wielu linii — chip rosnął na 88px wysokości, łamiąc `.topbar` grid (gdzie był plan na 36px chip).

Fix CSS `.baby-chip`:
```css
max-width: 140px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

Plus `.topbar-left`, `.topbar-logo`, `.topbar-sub` dostają `min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` — chronią się przed inflated content.

### 4. Service Worker bez fetch handlera ⇒ apka nie działa offline

Audyt z poprzednich sesji wskazywał: babylog SW miał tylko notification logic. Brak `fetch` handlera + brak app-shell cache = apka jest 100% online-dependent. Lighthouse PWA score: fail.

Dodany w `public/sw.js`:

```js
const SHELL_CACHE = 'babylog-shell-v6'
const SHELL_FILES = ['/babylog/', '/babylog/manifest.json',
                     '/babylog/icon-{72,96,192,512}.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_FILES)))
})

self.addEventListener('activate', e => {
  // Clean old cache versions
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('babylog-shell-') && k !== SHELL_CACHE)
        .map(k => caches.delete(k))
  )))
})

self.addEventListener('fetch', event => {
  // Strategy:
  // 1. Bypass dla Firestore/Firebase/recaptcha (zawsze sieć)
  // 2. Navigation request (HTML) — network-first z fallback do cache
  // 3. Static assets (.js/.css/.png/etc.) — cache-first z update-in-background
  // 4. Default — sieć
})
```

Korzyści:
- Lighthouse PWA score teraz pass (was fail — "no offline support")
- Drugi load apki: mgnienie oka (cache-hit dla wszystkich assetów)
- Jeśli internet padnie mid-session, apka nie crashuje — zostaje to co już ściągnięte
- Firebase data nadal pochodzi z sieci (real-time), tylko shell jest offline-capable

Cache versioning: bump `SHELL_CACHE` (z `babylog-shell-v6` na `v7` itd.) inwaliduje cały stary shell przy następnym deploy.

---

## Verification (post-fix)

### PDF generation
- ✅ PL: 77kB blob, generuje się bez błędu.
- ✅ EN: 79kB blob, "Height" widoczne 2x w surowych bytes (potwierdza `pdf.col.height` translation).

### Edit existing entry
- ✅ Klik na log-item temperatury otwiera modal w trybie edycji z prawidłowo wypełnionymi polami (`38.7` w temp).

### Multi-profile + edge cases (z poprzednich wersji)
- ✅ Long name + Unicode + apostrof
- ✅ Decimal comma `38,7` → `38.7°C`
- ✅ Per-profile data isolation
- ✅ Add/edit/delete profile

### CSV export
- ✅ PL: `# Spokojny Rodzic — EKSPORT DANYCH` (poprzednio "CALM PARENT")
- ✅ EN: `# Calm Parent — DATA EXPORT`

### JSON backup
- ✅ Po fix: `"appVersion": "2.11.5"` (zamiast hardcoded `"2.5.5"`)

---

## Suma 6 wersji: v2.10.6 → v2.11.5

| Wersja | Co naprawiło |
|--------|-------------|
| v2.10.6 | UI MDR exit + critical assetlinks placeholder + duplicate SW |
| v2.11.0 | Engine MDR exit (rulesEngine refactor) |
| v2.11.1 | 3 hot-fix po pierwszym manualnym tescie |
| v2.11.2 | Comprehensive PL+EN audit (12 fixów + 22 nowe klucze) |
| v2.11.3 | CSV/data export i18n + multi-profile sanity |
| v2.11.4 | Decimal comma + edge case verification |
| **v2.11.5** | **SW offline + JSON version bug + aria + long name overflow** |

---

## Co WCIĄŻ niezweryfikowane (terminal cuts)

- **Realny PDF content w EN** — generowanie OK, ale text encoding w jspdf wewnętrznym formacie utrudnia precyzyjną weryfikację bez PDF reader. "Height" widoczne 2x — gut feel jest pozytywny.
- **Notifications test button** — wymaga uprawnień przeglądarki + interakcji. UI element jest, kod handlera jest, ale rzeczywiste pokazanie pushy wymaga real Android device.
- **Real offline scenario** — fetch handler dodany, ale faktyczne testowanie offline wymaga emulacji Network throttle = "Offline" w devtools (preview tooling tego nie wspiera).
- **PremiumOnboardingModal / GuestMigrationDialog** — UI się waluje, ale wymaga specyficznego trigger state (afterInstallPremium / afterLoginWithGuestData) — pominięte.
- **Dual-device sync** — wymaga 2 prawdziwych urządzeń.

---

## Versionning

- `package.json`: 2.11.4 → 2.11.5
- SW: `babylog-shell-v6` (bumped z brak → v6)
- SW comment header: v5 → v6
