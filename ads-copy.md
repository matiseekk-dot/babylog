# Google Ads: kampanie App promotion (PL, EN, DE, FR, ES), 2026-09-26

Materiały: `store-assets/ads/{pl,en,de,fr,es}/` (generuje `scripts/build-ad-assets.mjs`
z prawdziwych screenów sklepu). Limity Google: nagłówek do 30 znaków, opis do 90, sprawdzone.
Bez obietnic medycznych (reklamy zdrowotne są weryfikowane ostrzej) i bez WIELKICH liter.

---

## Budżet (80 zł dziennie)

- **80 zł dziennie = 40 zł Francja + 40 zł Niemcy**, osobne kampanie, na **14 dni** (ok. 1 120 zł).
- Polska, Hiszpania i kraje anglojęzyczne osobno, jeśli zechcesz (materiały są gotowe).
- **Optymalizacja:** zacznij od **instalacji**, a `first_entry_added` (pierwszy wpis) ustaw jako
  konwersję do obserwacji. Przy 40 zł dziennie Google może mieć za mało wpisów, żeby od razu
  uczyć się pod pierwszy wpis. Gdy kampania zbierze kilkadziesiąt pierwszych wpisów
  w miesiącu, przełącz cel na „działania w aplikacji: first_entry_added”.
- **Po 7 dniach:** porównaj kraje w Firebase Analytics (kraj: first_visit, onboarding_completed,
  first_entry_added). Pieniądze przesuń tam, gdzie pierwszy wpis jest tańszy.

## Połączenie Firebase z Google Ads (raz, przed startem)

1. Firebase → Analytics → **Events** → przy `first_entry_added` włącz **„Oznacz jako kluczowe zdarzenie”**.
2. Firebase → ⚙ Ustawienia projektu → **Integracje → Google Ads → Połącz** (wybierz konto reklamowe).
3. Google Ads → Narzędzia → Pomiar → **Konwersje → Nowe → Aplikacja → Google Analytics for Firebase**,
   zaznacz `first_entry_added` i zaimportuj.

## Filmy (YouTube)

Kampanie aplikacji biorą filmy tylko z YouTube: wgraj każdy film jako **„Niepubliczny”**
i wklej link w komponentach kampanii. Film poziomy możesz też dodać w Play Console
w polu **„Film w YouTube”** na stronie aplikacji w danym języku.

| Język | Pionowy 9:16 | Poziomy 16:9 |
|---|---|---|
| PL | `pl/video-portrait.mp4` | `pl/video-landscape.mp4` |
| EN | `en/video-portrait.mp4` | `en/video-landscape.mp4` |
| DE | `de/video-portrait.mp4` | `de/video-landscape.mp4` |
| FR | `fr/video-portrait.mp4` | `fr/video-landscape.mp4` |
| ES | `es/video-portrait.mp4` | `es/video-landscape.mp4` |

14 s, bez dźwięku: gorączka w nocy, jedno Premium dla obojga, karmienie w 2 sekundy,
wszystko w jednym miejscu, na końcu plansza z nazwą i „Pobierz z Google Play”.

## Grafiki

W każdym folderze języka 9 plików: 3 motywy w 3 formatach.

- Motywy: `shared` (jedno Premium dla obojga), `fever` (gorączka w nocy), `feed` (karmienie w 2 s)
- Formaty: `-landscape` 1200×628, `-square` 1200×1200, `-portrait` 1200×1500

Wgraj wszystkie 9, Google sam dobiera, co działa najlepiej.

---

## 🇫🇷 Francja (język: francuski)

### Nagłówki
```
Carnet bébé pour 2 parents
Fièvre à 3 h du matin ?
Repas, sommeil, température
Un Premium pour 2 parents
Rappel du prochain repas
```

### Opisy
```
Notez repas, sommeil et fièvre en un appui. Les deux parents voient tout en direct.
Seuils de fièvre selon les recommandations pédiatriques. Sans pub, données dans l’UE.
Widget sur l’écran d’accueil : un repas ou le sommeil noté d’un seul appui, même la nuit.
14 jours de Premium offerts : courbes de croissance OMS et rapport PDF pour le pédiatre.
Ne remplace pas un médecin : vous aide à observer bébé et à préparer la consultation.
```

## 🇩🇪 Niemcy (język: niemiecki)

### Nagłówki
```
Baby-Tagebuch für 2 Eltern
Fieber um 3 Uhr nachts?
Mahlzeit, Schlaf, Temperatur
Ein Premium für beide Eltern
Daten in der EU, ohne Werbung
```

### Opisy
```
Mahlzeiten, Schlaf und Fieber mit einem Tipp erfassen. Beide Eltern sehen alles live.
Fieberschwellen nach pädiatrischen Leitlinien. Werbefrei, Daten auf Servern in der EU.
Widget auf dem Startbildschirm: Mahlzeit oder Schlaf mit einem Tipp, auch nachts.
14 Tage Premium gratis: WHO-Wachstumskurven und PDF-Bericht für den Kinderarzt.
Ersetzt keinen Arzt. Hilft Ihnen, Ihr Baby zu beobachten und Daten parat zu haben.
```

## 🇪🇸 Hiszpania (język: hiszpański)

### Nagłówki
```
Diario del bebé para 2 padres
¿Fiebre a las 3 de la mañana?
Tomas, sueño, temperatura
Un Premium para ambos padres
Aviso de la próxima toma
```

### Opisy
```
Anota tomas, sueño y fiebre con un toque. Ambos padres lo ven todo al momento.
Umbrales de fiebre según guías pediátricas. Sin anuncios, datos guardados en la UE.
Widget en la pantalla de inicio: una toma o el sueño con un toque, también de noche.
14 días de Premium gratis: curvas de crecimiento OMS e informe PDF para el pediatra.
No sustituye a un médico: te ayuda a observar a tu bebé y preparar la consulta.
```

## 🇬🇧 Angielski (UK, US, Kanada, Australia i inne)

### Nagłówki
```
Baby tracker for 2 parents
Fever at 3 AM?
Feeding, sleep, temperature
One Premium for both parents
Next-feeding reminders
```

### Opisy
```
Log feedings, sleep and fever with one tap. Both parents see everything in real time.
Fever thresholds based on pediatric guidelines. No ads, data stored in the EU.
Home screen widget: log a feeding or sleep with one tap, even at night.
14 days of Premium free: WHO growth charts and a PDF report for your pediatrician.
Not a replacement for a doctor. Helps you observe your baby and prepare for visits.
```

## 🇵🇱 Polska (język: polski)

### Nagłówki
```
Dziennik niemowlaka we dwoje
Gorączka o 3 w nocy?
Karmienie, sen, temperatura
Jedno Premium dla obojga
Przypomnienie o karmieniu
```

### Opisy
```
Karmienie, sen i gorączka jednym dotknięciem. Oboje rodzice widzą wszystko na bieżąco.
Progi gorączki wg Polskiego Towarzystwa Pediatrycznego. Bez reklam, dane w UE.
Widżet na ekranie głównym: karmienie albo sen jednym dotknięciem, także w nocy.
14 dni Premium za darmo: siatki centylowe WHO i raport PDF dla pediatry.
Nie zastępuje lekarza. Pomaga obserwować dziecko i przygotować się do wizyty.
```
