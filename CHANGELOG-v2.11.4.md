# v2.11.4 — Polish keyboard decimal-comma fix + edge case verification

**Data:** 2026-05-03
**Cel:** Naprawić `<input type="number">` które po cichu odrzucało wartości z polskim przecinkiem dziesiętnym (38,7°C, 6,5kg). Plus zweryfikowane edge case'y: długie nazwy z diakrytykami, PDF generation, multi-profile workflow.

**Poprzednie:** v2.11.3 (CSV/data export i18n + multi-profile sanity).

---

## TŁO

W manualnej weryfikacji edge case'ów odkryłem, że Polish-keyboard użytkownicy wpisujący temperaturę przez przecinek (`38,7°C`) mogli widzieć puste pole zamiast swojego pomiaru. `<input type="number">` w Chrome traktuje przecinek dziesiętny niejednoznacznie — czasem akceptuje, czasem silnie striped. Helper `parseNum()` istnieje od dawna i konwertuje przecinek na kropkę przy save, ale tylko jeśli string z przecinkiem dotrze do `e.target.value` — co `type="number"` często blokowało.

W praktyce: rodzic wpisuje "38,7", widzi pomiar 38.7°C w UI, klika Save → pole `form.temp` jest stringiem "38,7" (jeśli browser przepuścił) i `parseNum("38,7")` daje 38.7. **Albo** `e.target.value` zwraca "" (jeśli browser blocked), `form.temp` pozostaje '37.0' (default), parseNum daje 37.0 → user widzi 37.0°C w timeline ale pamięta że wpisał 38.7. Ciche nadpisanie pomiaru.

To jest medycznie istotne — różnica 38.7 vs 37.0 to różnica między "wysoka gorączka" a "norma".

## Fix

Wszystkie krytyczne `type="number"` z `step` ułamkowym zmienione na `type="text" inputMode="decimal" pattern="[0-9.,]*"` z onChange-stripping nieprawnych znaków:

```jsx
<input type="text" inputMode="decimal" pattern="[0-9.,]*" maxLength={5}
       value={form.temp}
       onChange={e=>setForm(f=>({...f,temp:e.target.value.replace(/[^0-9.,]/g,'')}))} />
```

`inputMode="decimal"` daje numeryczną klawiaturę na mobilnych urządzeniach, `pattern` filtruje nielegalne znaki, `maxLength` ogranicza do rozsądnej długości. parseNum() w save() po staremu konwertuje "38,7" → 38.7.

Naprawione w:
- **TempTab.jsx:172** — wpisywanie temperatury (najbardziej krytyczne klinicznie)
- **GrowthTab.jsx:225,229,234** — waga, wzrost, obwód głowy (Premium feature)
- **ProfilesScreen.jsx:173,273** — waga w "Add child" + "Edit profile"

SettingsScreen.jsx już od dawna miało tożsame zabezpieczenie (`onChange={e => setWeight(e.target.value.replace(",","."))}`) — pominięte.

## Edge case verification (manualna)

W ramach testu sprawdziłem:

### ✅ Długie nazwy + polskie diakrytyki + apostrof + myślniki
Profil utworzony z nazwą `"Józef-Jędrzej Świętopełk Żółtawiec O'Brian"` (49 znaków, zestaw najgorszych Unicode codepoints PL):
- Modal "Edytuj profil" przyjął bez błędu
- Topbar wyświetla pełną nazwę
- Lista profili wyświetla bez ucięcia
- Brak crashu

### ✅ Decimal comma "38,7" w wpisie temperatury (po fix)
- Input akceptuje przecinek (typ teraz "text")
- Po Save zapisuje się jako 38.7°C w timeline (parseNum konwertuje)
- Nie ma ciche utraty danych

### ✅ PDF report generation
- W PL trial mode (czyli premium): klick "Pobierz raport PDF"
- Modal "Raport dla pediatry" otwiera się z opcjami zakresu (7/14/30 dni / własny)
- Klik "📄 Raport PDF dla pediatry" generuje 77kB PDF blob bez błędu
- Wszystkie nowe klucze i18n z v2.11.2 (`pdf.col.height`, `pdf.col.head_circ`) działają

### ✅ Multi-profile per-child data isolation
- Dodanie drugiego profilu (Kacper, 8 mies.)
- Auto-switch na nowy profil
- Health → Temperature pokazuje 0 pomiarów dla Kacpra (dane Zosia nadal istnieją)
- Edycja + usunięcie profilu działa, fallback na pozostały profil

## Verification

- `npm test` → 119/119 pass
- `npm run build` → clean
- Programmatic test: setVal('38,7') → input.value === '38,7' ✓ → Save → timeline shows '38.7°C' ✓

---

## Dotąd przetestowane (cały szlak)

Suma 4 wersji od v2.10.6:
- v2.10.6 — UI MDR exit + assetlinks + duplicate SW
- v2.11.0 — Engine MDR exit (rulesEngine refactor)
- v2.11.1 — 3 hot-fix po pierwszym manualnym tescie
- v2.11.2 — Comprehensive PL+EN audit (12 fixów + 22 nowe klucze)
- v2.11.3 — CSV/data export i18n + multi-profile sanity
- **v2.11.4 — decimal comma + edge case verification (TEN release)**

Wszystkie taby przetestowane PL+EN, krytyczny MDR test passed, decimal comma fixed, długie nazwy + diakrytyki działają, PDF generuje się.

---

## Co WCIĄŻ niezweryfikowane (świadome cuts)

- **Notifications** — wymaga uprawnień przeglądarki + akceptacji UI. Test button istnieje w Settings.
- **Service worker offline mode** — wymaga emulacji offline.
- **Dual-language PDF content** — wygenerowałem PDF w PL, w EN nie zweryfikowałem treści (wymaga downloadu i otwarcia w PDF readerze).
- **Edge case: very old entries (>1 year)** — nie testowane.
- **Multiple profiles + sync między urządzeniami** — wymaga 2 prawdziwych devices.

Versionning: `package.json`: 2.11.3 → 2.11.4.
