# Promocja małym kosztem, 2026-09

Wszystko do użycia od razu. Pliki są w tym folderze (na Pulpicie: `Aplikacje\Dziecko\Promocja-2026-09`).

Skąd przyszły pobrania, zobaczysz w Play Console → **Statystyki / Pozyskiwanie użytkowników**
(raport źródeł ruchu z kampaniami UTM). Każdy kanał ma swoje oznaczenie:

| Kanał | Oznaczenie (utm_source) |
|---|---|
| Karty z kodem QR (położne, szkoły rodzenia) | `ulotka` |
| Strona skudev.pl | `skudev` |
| Poradnik na skudev.pl | `skudev` (utm_medium `poradnik`) |
| Link w profilu kanału YouTube | `youtube` |

---

## 1. Położne i szkoły rodzenia

**Pliki:**
- `karta-A6.pdf`: jedna karta 105×148 mm, do drukarni.
- `karty-A4-4szt.pdf`: 4 karty na kartce A4, do wydruku w domu i pocięcia po liniach.
- `karta-A6.png`: podgląd.

Kod QR prowadzi na **skudev.pl/pobierz**, a stamtąd do Google Play. Sprawdziłem, że kod się odczytuje.
W drukarni internetowej zamów ulotki A6, papier kredowy matowy 250 do 350 g. 500 sztuk kosztuje zwykle około 100 zł.

**Kody promocyjne (darmowe Premium dla położnej):**
1. Play Console → **Monetyzacja** → **Kody promocyjne** → Utwórz promocję.
2. Produkt: `spokojny_rodzic_premium_lifetime` (plan dożywotni), kody jednorazowe, np. 20 sztuk.
3. Pobierz plik z kodami. Jeden kod = jedna osoba.
4. **Najpierw sprawdź jeden kod na sobie** (drugie konto Google): Sklep Play → Płatności i subskrypcje → Zrealizuj kod,
   potem otwórz aplikację i zobacz, czy Premium się włączyło. Aplikacja przyznaje Premium przez RevenueCat.
   Kod zrealizowany w Sklepie Play powinien zostać wychwycony przy otwarciu aplikacji, ale tego nie da się sprawdzić bez prawdziwego kodu.

**Wiadomość do położnej** (mail, Messenger albo osobiście):
```
Dzień dobry,

nazywam się Mateusz, jestem tatą i po godzinach zrobiłem aplikację Spokojny Rodzic. To dziennik niemowlaka dla obojga rodziców: karmienie, sen, pieluchy, temperatura i podane leki, zapisywane jednym dotknięciem. Oboje rodzice widzą te same wpisy na swoich telefonach.

Progi gorączki pochodzą z wytycznych Polskiego Towarzystwa Pediatrycznego. Aplikacja nie wylicza dawek i nie zastępuje lekarza, pomaga rodzicom mieć wszystko zapisane na wizytę.

Czy mogę zostawić Pani karty z kodem QR dla rodziców, którym uzna Pani, że się przyda? Dla Pani mam kod na darmowe Premium bez limitu czasu, żeby mogła Pani sama sprawdzić aplikację.

Będę wdzięczny za każdą uwagę, co jest dla rodziców najważniejsze w pierwszych tygodniach.

Pozdrawiam,
Mateusz
skudev.pl/spokojny-rodzic
```

**Wiadomość do szkoły rodzenia:**
```
Dzień dobry,

jestem Mateusz, tata i twórca aplikacji Spokojny Rodzic. To dziennik niemowlaka dla obojga rodziców: karmienie, sen, pieluchy i temperatura jednym dotknięciem, te same wpisy na telefonach mamy i taty. Bez reklam.

Czy mógłbym zostawić karty z kodem QR dla uczestników Państwa zajęć? Dla prowadzących mam kody na darmowe Premium bez limitu czasu. Chętnie też opowiem krótko o aplikacji na zajęciach, jeśli to Państwu pasuje.

Pozdrawiam,
Mateusz
skudev.pl/spokojny-rodzic
```

---

## 2. Treści promocyjne w Play Console (za darmo)

Karta „Ważna aktualizacja” pokazuje się w Sklepie Play przy aplikacji i w wynikach wyszukiwania.

1. Play Console → **Zwiększanie liczby użytkowników** → **Treści promocyjne** → Utwórz.
2. Typ: **Ważna aktualizacja**. Start ustaw za kilka dni, bo Google sprawdza treść przed publikacją. Czas trwania: do 4 tygodni.
3. Grafika: `promo-widget-{język}.png` (1920×1080).
4. Teksty:

| Język | Tytuł | Opis |
|---|---|---|
| pl-PL | Nowość: widżet na ekran główny | Karmienie, butelka lub sen jednym dotknięciem, prosto z ekranu głównego. |
| en-US i inne EN | New: home screen widget | Log a feeding, bottle or sleep with one tap, right from your home screen. |
| de-DE | Neu: Widget für den Startbildschirm | Mahlzeit, Flasche oder Schlaf mit einem Tipp, direkt vom Startbildschirm. |
| fr-FR | Nouveau : widget pour l’écran d’accueil | Repas, biberon ou sommeil d’un seul appui, depuis l’écran d’accueil. |
| es-ES | Novedad: widget en la pantalla de inicio | Toma, biberón o sueño con un toque, desde la pantalla de inicio. |

Tytuły mają do 40 znaków, a opisy do 73.

---

## 3. Eksperyment ze stroną w sklepie (za darmo)

Google pokazuje połowie odwiedzających inny krótki opis i mierzy, który daje więcej pobrań.

1. Play Console → **Zwiększanie liczby użytkowników** → **Eksperymenty ze stroną aplikacji w sklepie** → Utwórz.
2. Strona: domyślna. Język: **polski**. Co testujesz: **krótki opis**.
3. Odbiorcy: 50%. Cel: **pozyskani użytkownicy, którzy zostali po 1 dniu**.
4. Warianty:
   - A (obecny): `Dziennik niemowlaka dla obojga rodziców: temperatura, karmienie, sen, leki`
   - B: `Karmienie, sen i gorączka jednym dotknięciem. Te same wpisy u obojga rodziców`
5. Niech trwa co najmniej 7 dni. Jeśli B wygra, zastosuj go jednym przyciskiem, a potem przetestuj w ten sam sposób kolejność screenów.

---

## 4. Mikroinfluencerki (za kody Premium)

Szukaj mam z 5 do 20 tysiącami obserwujących, które pokazują codzienność z niemowlakiem.
Zgodnie z wytycznymi UOKiK barter też jest współpracą, więc poproś o oznaczenie posta (np. „współpraca”).

```
Cześć [imię]!

Jestem Mateusz, tata i twórca aplikacji Spokojny Rodzic na Androida. To dziennik niemowlaka dla obojga rodziców: karmienie, sen, pieluchy i gorączka jednym dotknięciem, a mama i tata widzą te same wpisy na swoich telefonach. Bez reklam.

Chcesz ją przetestować? Wyślę Ci kod na darmowe Premium bez limitu czasu. Jeśli aplikacja Ci się przyda i pokażesz ją u siebie, będzie mi bardzo miło, ale niczego nie wymagam. Szczera opinia jest dla mnie najcenniejsza.

Gdybyś o niej wspomniała, oznacz proszę post jako współpracę.

Mateusz
skudev.pl/spokojny-rodzic
```

---

## 5. Strona skudev.pl (zrobione)

- Podstrona **skudev.pl/spokojny-rodzic** jest aktualna: przycisk do Google Play, wspólne konto, 5 języków, nowe screeny.
  Usunąłem kalkulator dawek (tej funkcji nie ma od v2.7.1 z powodu przepisów MDR) i zapis na premierę.
- Nowy **poradnik**: skudev.pl/poradnik (gorączka, objawy alarmowe, karmienie, pieluchy, sen), ze źródłami i przyciskiem do aplikacji.
- Strona główna: status „w Google Play”, zakładka Poradnik, „sprzedaż danych” zamiast „tracking”
  (aplikacja używa Firebase Analytics, więc „bez trackingu” nie byłoby prawdą).
- `sitemap.xml` i `robots.txt` dla Google.

**Do zrobienia przez Ciebie (5 minut):** dodaj skudev.pl w [Google Search Console](https://search.google.com/search-console)
(weryfikacja przez DNS u rejestratora domeny) i zgłoś mapę witryny `https://skudev.pl/sitemap.xml`.
Wtedy Google szybciej znajdzie poradnik, a Ty zobaczysz, na jakie pytania ludzie trafiają na stronę.
