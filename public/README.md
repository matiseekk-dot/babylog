# Calm Parent — Store Assets (v2)

**Data:** 22.04.2026
**Zawartość:** Ikona + Feature Graphic (PL i EN)

## Co jest w paczce

### Ikona aplikacji
| Plik | Rozmiar | Gdzie użyć |
|------|---------|------------|
| `icon.svg` | vector | Master source |
| `icon-1024.png` | 1024×1024 | Android adaptive icon foreground |
| `icon-512.png` | 512×512 | PWA manifest, Play Console "Ikona aplikacji" |
| `icon-192.png` | 192×192 | PWA manifest, Android home screen |
| `icon-96.png` | 96×96 | Android xxxhdpi |
| `icon-72.png` | 72×72 | Android xxhdpi |
| `playstore-icon-512.png` | 512×512 | Duplikat icon-512 specjalnie dla Play Console |

### Feature Graphic (baner w Play Store)
| Plik | Rozmiar | Użyj gdy |
|------|---------|----------|
| `feature-graphic-pl.png` | 1024×500 | Polska wersja Play Store |
| `feature-graphic-en.png` | 1024×500 | Angielska wersja Play Store |
| `feature-graphic-pl.svg` | vector | Źródło PL |
| `feature-graphic-en.svg` | vector | Źródło EN |

## Jak wdrożyć

### 1. W repo `babylog` (PWA)

```bash
cp icon-*.png babylog/public/
cp icon.svg babylog/public/
cp feature-graphic-*.png babylog/store-assets/
cp feature-graphic-*.svg babylog/store-assets/
```

Commit + push → PWA live w 2 min.

### 2. W Play Console

**Zwiększaj liczbę użytkowników → Strona główna aplikacji w sklepie → Grafika**

- **Ikona aplikacji** → upload `playstore-icon-512.png`
- **Grafika promocyjna (Feature graphic)** → upload `feature-graphic-pl.png`
- Zapisz

### 3. Nowy .aab (przed Production)

TWA wrapper ma własną ikonę wbudowaną w .aab. Przed Production rebuildem użyj `icon-1024.png` jako źródło dla `android/app/src/main/res/mipmap-*/ic_launcher.png`.

## Brand identity

- **Tło coral:** `#D97056 → #C95A48 → #B84A3A`
- **Buzia cream:** `#FDF8F0 → #FBF3E4`
- **Detale:** `#1E2618` (ink)
- **Blush na policzkach:** `#F5B5A8`

Wszystkie elementy spójne między ikoną a feature graphic.
