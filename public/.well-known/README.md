# assetlinks.json — KRYTYCZNY plik dla TWA

## Co to robi

Bez tego pliku TWA (Trusted Web Activity = Twoja apka z Play Store) pokazuje
**URL bar w przeglądarce** zamiast wyglądać jak natywna apka. Plik
weryfikuje że domena `matiseekk-dot.github.io/babylog/` należy do Twojej
apki Play Store.

## Co wstawić

Plik `assetlinks.json` ma DWA placeholdery które MUSISZ uzupełnić **przed
publikacją do Play Store**:

```json
"package_name": "PACKAGE_NAME_PLACEHOLDER",   // ← np. "pl.skudev.spokojny_rodzic"
"sha256_cert_fingerprints": ["SHA256_FINGERPRINT_PLACEHOLDER"]
```

### Skąd wziąć package_name

To jest Application ID z Twojego wrappera TWA (bubblewrap). Znajdziesz w:
- `app/build.gradle` → `applicationId "..."`
- albo w Play Console → swoja apka → "App content" → tam jest Package name

### Skąd wziąć SHA-256 cert fingerprint

To jest fingerprint klucza, którym podpisujesz AAB. Są dwa:

**Opcja 1 — Play App Signing (zalecane):**
Play Console → Twoja apka → "Setup" → "App integrity" → tam masz
"App signing key certificate" → skopiuj SHA-256.

**Opcja 2 — własny upload key:**
Jeśli sam podpisujesz AAB (bubblewrap):
```bash
keytool -list -v -keystore android.keystore -alias android
```
W output szukaj linii `SHA256: AB:CD:EF:...`

**WAŻNE:** Format w `assetlinks.json` to ciągłe stringi z dwukropkami,
np. `"AB:CD:EF:12:34:..."` — **dokładnie tak jak keytool zwraca**.

## Po wpisaniu

1. Commit + push (idzie na GitHub Pages pod `/.well-known/assetlinks.json`)
2. Sprawdź że publicznie dostępny:
   ```
   curl https://matiseekk-dot.github.io/babylog/.well-known/assetlinks.json
   ```
3. Test w Play Console (przy dodawaniu AAB Console weryfikuje powiązanie)

## Częsty błąd

`PACKAGE_NAME_PLACEHOLDER` w produkcji = TWA pokazuje URL bar. Nikt tego
nie chce. Sprawdź ten plik **PRZED uploadem AAB**, nie po.
