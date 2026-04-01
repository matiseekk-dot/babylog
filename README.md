# 🍼 BabyLog

Aplikacja dla młodych rodziców do śledzenia wszystkich aspektów opieki nad niemowlęciem.

## Moduły

- 🍼 **Karmienie** – pierś (lewa/prawa), butelka, statystyki dzienne
- 🌙 **Sen** – stoper snu, historia drzemek, normy wiekowe
- 👶 **Pieluchy** – szybkie dodawanie, liczniki, notatki
- ⭐ **Kamienie milowe** – 16 etapów rozwoju z datami
- 📏 **Wzrost i waga** – historia pomiarów, wykresy
- 🌡️ **Temperatura** – log gorączek, wykres z liniami normy
- 💊 **Leki** – kalkulator dawek wg wagi, historia podań
- 💉 **Szczepienia** – kalendarz PSO, oznaczanie wykonanych
- 🥕 **Rozszerzanie diety** – BLW/papki, śledzenie próbowanych pokarmów
- 📖 **Dziennik** – wspomnienia z nastrojem dziecka
- 👨‍👩‍👧 **Multi-profil** – obsługa wielu dzieci

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

## Deploy na GitHub Pages

1. Utwórz repo `babylog` na GitHub
2. Wrzuć kod i push na branch `main`
3. W Settings → Pages → Source wybierz **GitHub Actions**
4. Workflow automatycznie zbuduje i opublikuje aplikację

Aplikacja będzie dostępna pod: `https://<twoj-login>.github.io/babylog/`

## Tech

- React 18 + Vite
- localStorage (działa na iOS)
- Recharts (wykresy)
- Brak backendu, brak AI API – w pełni offline
