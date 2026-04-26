# Design Tokens (v2.10.1)

Single source of truth dla designu apki. Wszystkie nowe komponenty używają tylko tych zmiennych.

## Color tokens

### Brand (zielony)

Brand color to **zielony**. To jest core identity apki — stosujemy tam gdzie chcemy pozytywne/zdrowe skojarzenia (FAB, success states, primary actions, brand accents).

```css
--brand-50:  #E1F5EE   /* Najjaśniejszy bg, subtle highlights */
--brand-100: #9FE1CB   /* Border light, hover backgrounds */
--brand-500: #1D9E75   /* Primary brand — buttons, accents */
--brand-600: #0F6E56   /* Hover state, gradient end */
--brand-700: #085041   /* Text on --brand-50, dark accent */
```

**Kiedy używać każdego stopnia:**
- `--brand-50` jako `background` dla pozytywnych kafelków, success badges
- `--brand-500` jako `color` dla active states, primary CTA, FAB
- `--brand-600` jako gradient end (`linear-gradient(135deg, --brand-600, --brand-500)`)
- `--brand-700` jako `color` na `--brand-50` background (text na zielonym kafelku)

### Status colors (semantyczne, NIE brand)

Te kolory **mają znaczenie**. Nie zmieniaj ich na brand żeby było "spójniej" — to byłoby kosztem czytelności.

**Info — niebieski.** Komunikaty informacyjne, niski priorytet. Diaper logs.
```css
--info-50:    #E6F1FB
--info-500:   #185FA5
--info-700:   #0C447C
```

**Warning — amber/żółty.** "Uwaga, ale nie pilne". Lekkie problemy z trendami.
```css
--warning-50:  #FAEEDA
--warning-100: #FAC775
--warning-500: #BA7517
--warning-700: #633806
```

**Alert — koralowy.** "Wymaga akcji". Temperatura podwyższona, lek przeterminowany.
```css
--alert-50:    #FAECE7
--alert-100:   #F0997B
--alert-500:   #D85A30
--alert-700:   #712B13
```

**Critical — czerwony.** "Życie/zdrowie zagrożone". Wysoka gorączka, niemowlak <3mo z gorączką.
```css
--critical-50:  #FCEBEB
--critical-100: #F09595
--critical-500: #A32D2D
--critical-700: #501313
```

**Accent — fiolet.** Sleep tracking. Kolor uspokajający, kojarzący się z nocą.
```css
--accent-50:  #EEEDFE
--accent-500: #534AB7
```

### Neutrals

```css
--bg:        #F7F7F5    /* Main app background */
--surface:   #FFFFFF    /* Card / modal background */
--border:    rgba(0,0,0,0.10)
--border-med: rgba(0,0,0,0.15)
--text:      #1A1A18    /* Primary text */
--text-2:    #5A5A56    /* Secondary text — opisy */
--text-3:    #9A9A94    /* Tertiary — captions, hints */
```

## Spacing scale

**Pięć poziomów. Inne wartości to bug.** Każdy padding/margin/gap MUSI używać jednego z tych:

```css
--space-tight:       4px    /* Inline gaps, micro-spacing */
--space-snug:        8px    /* Default gap między elementami */
--space:            16px    /* Container padding, default block spacing */
--space-comfortable: 24px   /* Section padding, generous gap */
--space-spacious:   32px    /* Hero spacing, między sekcjami */
```

### Kiedy którego używać

**`--space-tight` (4px)**: Gap między ikoną a tekstem w jednej linii. Mała przerwa między numerem a labelem w stat tile.

**`--space-snug` (8px)**: Gap między kafelkami w grid. Padding wewnątrz badge. Margin między elementami listy.

**`--space` (16px)**: Padding głównego content z brzegu ekranu. Padding wewnątrz card. Default w 95% przypadków.

**`--space-comfortable` (24px)**: Padding wewnątrz hero/empty state. Margin między dużymi sekcjami na ekranie.

**`--space-spacious` (32px)**: Tylko dla naprawdę dużych separacji (hero z dużą ilością powietrza).

### Compound padding

Przy paddingu typu `padding: VERTICAL HORIZONTAL`:
```jsx
// ✅ DOBRE — oba z tokens
padding: 'var(--space-snug) var(--space)'  // 8px 16px

// ❌ ZŁE — mix tokens i hardcoded
padding: 'var(--space-snug) 14px'

// ❌ ZŁE — wartość poza skalą
padding: '12px 14px'
```

## Radius scale

```css
--radius-tight:       8px    /* Buttons inline, badges */
--radius:            12px    /* Standard cards, inputs, buttons */
--radius-comfortable: 14px   /* Larger cards, modals top */
--radius-round:      9999px  /* Pills, FAB, avatars */
```

## Migration policy

### Backwards compatibility

`index.css` zawiera **deprecated aliases** dla starego API:

```css
--green        → --brand-500   (deprecated, do usunięcia w v2.11+)
--green-light  → --brand-50
--green-dark   → --brand-600
--purple       → --accent-500
--amber        → --warning-500
--coral        → --alert-500
```

Te aliasy istnieją żeby niezmigrowane komponenty wciąż działały. **NIE używać w nowym kodzie**.

### Co jest już migrowane (v2.10.1)

- ✅ `index.css` (full token system)
- ✅ `App.jsx` (topbar Premium/Trial/Free chips)
- ✅ `TodayTab.jsx` (stat tiles, timeline, header)
- ✅ `QuickAddFab.jsx` (FAB button, sheet, action tiles)
- ✅ `ChildStatusCard.jsx` (spacing only — kolory cfg.* są runtime-driven)
- ✅ `DailyTab.jsx` (SegmentedSwitcher)

### Co NIE jest jeszcze migrowane

Pozostałe komponenty wciąż używają starych aliasów (`--green`, `--purple`, hardcoded kolory). **Działają normalnie** dzięki backwards compat. Migrujemy stopniowo — w każdej kolejnej iteracji jeden file:

- SettingsScreen.jsx
- PaywallScreen.jsx
- MedsTab.jsx
- TempTab.jsx
- SymptomsTab.jsx
- DiaperTab.jsx
- (i inne ~40 komponentów)

## Zasady dla code review

Przy nowym kodzie sprawdzaj:

1. **Żadnych hardcoded kolorów hex** (`#1D9E75`, `#fff`, `#000` itd.) — używać tokens
2. **Żadnych spacing wartości spoza skali 4/8/16/24/32** — zaokrąglić do najbliższej
3. **Żadnych `borderRadius: 10` lub `borderRadius: 16`** — używać `--radius-tight/--radius/--radius-comfortable/--radius-round`
4. **Status colors są semantic** — nie używaj `--alert-*` dla "czerwonego z dekoracji", tylko gdy to literalnie ALERT

## Why

Token system eliminuje:
- Inconsistencies (na jednym ekranie 14px padding, na drugim 16px, różnica niewidoczna ale UX jest "lekko szarpany")
- Refactor nightmare (zmiana brand color → jedna linia w `:root`, nie find-and-replace przez 60 plików)
- Designer-developer disconnect (designer mówi "spacing comfortable", deweloper od razu wie czego użyć)

Kiedy NIE używać tokens: dynamic computed values (np. `width: ${progress}%`), inline shadows które są jednorazowe i specyficzne, animation values.
