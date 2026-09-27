// scripts/build-shorts.mjs
//
// Krótkie filmy edukacyjne na YouTube Shorts / Reels / TikTok (2026-09).
// Same napisy, bez głosu i bez muzyki (muzykę dodaje się w aplikacji YouTube
// przy wrzucaniu). Treść pochodzi z danych, które już są w apce:
// src/data/referenceTables.js (progi gorączki, objawy alarmowe),
// feedingNorms.js, sleepNorms.js, dailyTips.js. Nie dopisujemy własnych porad.
//
// Klatki renderuje Chrome (HTML → PNG 1080×1920), ffmpeg skleja je z krótkimi
// przejściami. Tekst trzymamy w "bezpiecznej strefie" Shorts: z prawej są
// przyciski (polubienia, komentarze), na dole tytuł i opis filmu.
//
// Wynik: store-assets/shorts/{lang}/{slug}.mp4 i {slug}-cover.png
// Run: FFMPEG_PATH=/sciezka/ffmpeg node scripts/build-shorts.mjs [pl] [slug...]

import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = path.join(ROOT, 'store-assets', 'screenshots-2026-09')
const OUT = path.join(ROOT, 'store-assets', 'shorts')
const ICON = path.join(ROOT, 'public', 'icon-512.png')
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'

const W = 1080
const H = 1920
const FADE = 0.22
// Telefon w screenie sklepu (patrz build-ad-assets.mjs).
const PHONE_CROP = { left: 100, top: 200, width: 880, height: 1760 }

const COMMON = {
  pl: {
    app: 'Spokojny Rodzic',
    cta: 'Pobierz z Google Play',
    tagline: 'Dziennik niemowlaka dla obojga rodziców',
    sourceLabel: 'Źródło',
    sourcesLabel: 'Źródła',
  },
  en: { app: 'Calm Parent', cta: 'Available on Google Play', sourceLabel: 'Source', sourcesLabel: 'Sources' },
  de: { app: 'Calm Parent', cta: 'Jetzt bei Google Play', sourceLabel: 'Quelle', sourcesLabel: 'Quellen' },
  fr: { app: 'Calm Parent', cta: 'Disponible sur Google Play', sourceLabel: 'Source', sourcesLabel: 'Sources' },
  es: { app: 'Calm Parent', cta: 'Disponible en Google Play', sourceLabel: 'Fuente', sourcesLabel: 'Fuentes' },
}

// Poza PL cytujemy AAP (to samo źródło co angielska wersja apki), a numer
// alarmowy jest lokalny: FR 15/112, ES i DE 112, EN ogólnie "emergency".

// Typy klatek: hook, card, list (odsłanianie po jednym), note, source, end.
// dur = ile sekund klatka jest widoczna.
const VIDEOS = {
  pl: [
    {
      slug: '01-goraczka-kiedy-do-lekarza',
      frames: [
        { type: 'hook', kicker: 'Zapisz, przyda się w nocy', title: 'Gorączka u niemowlaka. Kiedy do lekarza?', sub: 'Progi z wytycznych pediatrów', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u niemowlaka', label: 'Poniżej 3 miesięcy', value: 'od 38,0°C', action: 'Pilnie do lekarza, nawet w nocy', tone: 'urgent', dur: 3.0 },
        { type: 'card', kicker: 'Gorączka u niemowlaka', label: '3 do 6 miesięcy', value: 'od 38,0°C', action: 'Skontaktuj się z pediatrą', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u dziecka', label: 'Powyżej 6 miesięcy', value: 'od 39,0°C', action: 'Skontaktuj się z pediatrą', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u dziecka', label: 'W każdym wieku', value: 'od 40,5°C', action: 'Pilna pomoc lekarska', tone: 'urgent', dur: 2.6 },
        { type: 'card', kicker: 'Gorączka u dziecka', label: 'Gorączka trwa', value: 'ponad 72 h', action: 'Skontaktuj się z pediatrą', foot: 'dziecko powyżej 6 miesięcy', tone: 'consult', dur: 3.0 },
        { type: 'source', plural: false, text: 'KOMPAS GORĄCZKA, Polskie Towarzystwo Pediatryczne', disclaimer: 'Ten film nie zastępuje lekarza. Gdy coś Cię niepokoi, dzwoń do lekarza lub pod 112.', dur: 3.4 },
        { type: 'end', shot: '01-today', headline: 'Progi i pomiary masz zawsze pod ręką', dur: 3.4 },
      ],
    },
    {
      slug: '02-ile-razy-je-niemowle',
      frames: [
        { type: 'hook', kicker: 'Karmienie niemowlaka', title: 'Ile razy na dobę je niemowlę?', sub: 'Typowe zakresy według wieku', dur: 2.4 },
        { type: 'list', heading: 'Karmienia na dobę', pairs: true, items: [['0-1 mies.', '8-12 razy'], ['2-3 mies.', '7-9 razy'], ['4-6 mies.', '5-7 razy'], ['7-12 mies.', '4-6 razy']], durs: [1.7, 1.7, 1.7, 2.8] },
        { type: 'note', emoji: '🍼', text: 'To zakresy, nie norma.', sub: 'Karmienie na żądanie to standard według American Academy of Pediatrics.', dur: 3.2 },
        { type: 'note', emoji: '🤱', text: 'Noworodek je zwykle co 2-3 godziny.', sub: 'Każde dziecko ma swój rytm.', dur: 2.6 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, WHO, ESPGHAN', disclaimer: 'Ten film nie zastępuje lekarza ani doradcy laktacyjnego. Wątpliwości omów z pediatrą.', dur: 3.2 },
        { type: 'end', shot: '06-feed', headline: 'Karmienie zapiszesz jednym dotknięciem', dur: 3.4 },
      ],
    },
    {
      slug: '03-mokre-pieluchy',
      frames: [
        { type: 'hook', kicker: 'Pieluchy', title: 'Ile mokrych pieluch to dobry znak?', sub: 'Prosty sygnał, że maluch nie jest odwodniony', dur: 2.6 },
        { type: 'card', kicker: 'Mokre pieluchy', label: 'Od około 5. doby życia', value: '6 i więcej', action: 'mokrych pieluch na dobę', tone: 'good', dur: 3.0 },
        { type: 'note', emoji: '💧', text: 'Mniej niż 6 mokrych pieluch może oznaczać odwodnienie.', dur: 2.8 },
        { type: 'list', heading: 'Sygnały odwodnienia', items: ['Sucha pielucha ponad 6 godzin', 'Płacz bez łez', 'Zapadnięte ciemiączko'], durs: [1.8, 1.8, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Wtedy skontaktuj się z lekarzem.', sub: 'Szczególnie u niemowlęcia.', dur: 2.4 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, Polskie Towarzystwo Pediatryczne', disclaimer: 'Ten film nie zastępuje lekarza.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Pieluchy z całego dnia policzą się same', dur: 3.4 },
      ],
    },
    {
      slug: '04-ile-spi-niemowle',
      frames: [
        { type: 'hook', kicker: 'Sen niemowlaka', title: 'Ile powinno spać niemowlę?', sub: 'Łącznie z drzemkami, w ciągu doby', dur: 2.4 },
        { type: 'list', heading: 'Sen na dobę', pairs: true, items: [['0-3 mies.', '14-17 h'], ['4-11 mies.', '12-15 h'], ['1-2 lata', '11-14 h']], durs: [1.8, 1.8, 2.8] },
        { type: 'note', emoji: '🌙', text: 'Noworodek budzi się co 1-3 godziny.', sub: 'To normalne, nie problem ze snem.', dur: 2.6 },
        { type: 'note', emoji: '💤', text: 'Około 4. miesiąca sen często się psuje.', sub: 'To skok rozwojowy mózgu, nie Twój błąd.', dur: 3.0 },
        { type: 'source', plural: true, text: 'National Sleep Foundation, American Academy of Pediatrics', disclaimer: 'Każde dziecko śpi inaczej. To zakresy, nie norma.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Sen z całego dnia zsumuje się sam', dur: 3.4 },
      ],
    },
    {
      slug: '05-objawy-alarmowe',
      frames: [
        { type: 'hook', kicker: 'Zapisz, oby się nie przydało', title: '5 objawów, z którymi nie czekasz do rana', sub: 'Według wytycznych pediatrów', dur: 2.6 },
        { type: 'list', heading: 'Nie czekaj, gdy widzisz:', numbered: true, items: [
          'Gorączka od 38°C u niemowlęcia poniżej 3 miesięcy',
          'Apatia, trudność z wybudzeniem, brak reakcji',
          'Trudności w oddychaniu, sine usta',
          'Drgawki lub sztywność karku',
          'Plamy, które nie bledną przy ucisku',
        ], durs: [2.1, 2.0, 1.9, 1.8, 2.8] },
        { type: 'note', emoji: '🚨', text: 'Pilna pomoc: SOR lub 112', sub: 'Lepiej sprawdzić o jeden raz za dużo.', tone: 'urgent', dur: 2.8 },
        { type: 'source', plural: true, text: 'KOMPAS GORĄCZKA (Polskie Towarzystwo Pediatryczne), American Academy of Pediatrics', disclaimer: 'Ten film nie zastępuje lekarza.', dur: 3.2 },
        { type: 'end', shot: '01-today', headline: 'Objawy alarmowe i numer 112 zawsze pod ręką', dur: 3.4 },
      ],
    },
  ],

  en: [
    {
      slug: '01-baby-fever-when-to-see-a-doctor',
      frames: [
        { type: 'hook', kicker: 'Save this for the night', title: 'Baby fever: when to see a doctor?', sub: 'Thresholds from pediatric guidelines', dur: 2.6 },
        { type: 'card', kicker: 'Fever in babies', label: 'Under 3 months', value: '38.0°C+', action: 'See a doctor urgently, even at night', foot: '100.4°F or higher', tone: 'urgent', dur: 3.0 },
        { type: 'card', kicker: 'Fever in babies', label: '3 to 6 months', value: '38.0°C+', action: 'Call your pediatrician', foot: '100.4°F or higher', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fever in children', label: 'Over 6 months', value: '39.0°C+', action: 'Call your pediatrician', foot: '102.2°F or higher', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fever in children', label: 'Any age', value: '40.5°C+', action: 'Get urgent medical help', foot: '105°F or higher', tone: 'urgent', dur: 2.6 },
        { type: 'card', kicker: 'Fever in children', label: 'Fever lasting', value: 'over 72 h', action: 'Call your pediatrician', foot: 'child over 6 months', tone: 'consult', dur: 3.0 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'This video does not replace a doctor. If something worries you, call your doctor or emergency services.', dur: 3.4 },
        { type: 'end', shot: '01-today', headline: 'Thresholds and readings always at hand', dur: 3.4 },
      ],
    },
    {
      slug: '02-how-often-do-babies-eat',
      frames: [
        { type: 'hook', kicker: 'Feeding your baby', title: 'How many times a day does a baby eat?', sub: 'Typical ranges by age', dur: 2.4 },
        { type: 'list', heading: 'Feedings per day', pairs: true, items: [['0-1 mo', '8-12 times'], ['2-3 mo', '7-9 times'], ['4-6 mo', '5-7 times'], ['7-12 mo', '4-6 times']], durs: [1.7, 1.7, 1.7, 2.8] },
        { type: 'note', emoji: '🍼', text: 'These are ranges, not rules.', sub: 'Feeding on demand is the standard recommended by the American Academy of Pediatrics.', dur: 3.2 },
        { type: 'note', emoji: '🤱', text: 'Newborns usually eat every 2-3 hours.', sub: 'Every baby has their own rhythm.', dur: 2.6 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, WHO, ESPGHAN', disclaimer: 'This video does not replace a doctor or lactation consultant. Talk to your pediatrician if unsure.', dur: 3.2 },
        { type: 'end', shot: '06-feed', headline: 'Log a feeding with one tap', dur: 3.4 },
      ],
    },
    {
      slug: '03-wet-diapers',
      frames: [
        { type: 'hook', kicker: 'Diapers', title: 'How many wet diapers are a good sign?', sub: 'A simple sign your baby is not dehydrated', dur: 2.6 },
        { type: 'card', kicker: 'Wet diapers', label: 'From about day 5 of life', value: '6 or more', action: 'wet diapers a day', tone: 'good', dur: 3.0 },
        { type: 'note', emoji: '💧', text: 'Fewer than 6 wet diapers may mean dehydration.', dur: 2.8 },
        { type: 'list', heading: 'Signs of dehydration', items: ['Dry diaper for over 6 hours', 'Crying without tears', 'Sunken soft spot on the head'], durs: [1.8, 1.8, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Then contact your doctor.', sub: 'Especially with a young baby.', dur: 2.4 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'This video does not replace a doctor.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Diapers for the whole day, counted for you', dur: 3.4 },
      ],
    },
    {
      slug: '04-how-much-do-babies-sleep',
      frames: [
        { type: 'hook', kicker: 'Baby sleep', title: 'How much should a baby sleep?', sub: 'Total in 24 hours, naps included', dur: 2.4 },
        { type: 'list', heading: 'Sleep per day', pairs: true, items: [['0-3 mo', '14-17 h'], ['4-11 mo', '12-15 h'], ['1-2 yrs', '11-14 h']], durs: [1.8, 1.8, 2.8] },
        { type: 'note', emoji: '🌙', text: 'Newborns wake every 1-3 hours.', sub: 'That is normal, not a sleep problem.', dur: 2.6 },
        { type: 'note', emoji: '💤', text: 'Around 4 months, sleep often gets worse.', sub: 'It is a brain development leap, not your fault.', dur: 3.0 },
        { type: 'source', plural: true, text: 'National Sleep Foundation, American Academy of Pediatrics', disclaimer: 'Every baby sleeps differently. These are ranges, not rules.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Sleep for the whole day, added up for you', dur: 3.4 },
      ],
    },
    {
      slug: '05-warning-signs',
      frames: [
        { type: 'hook', kicker: 'Save this, hope you never need it', title: '5 signs you should not wait until morning', sub: 'Based on pediatric guidelines', dur: 2.6 },
        { type: 'list', heading: 'Do not wait if you see:', numbered: true, items: [
          'Fever of 38°C (100.4°F) or more in a baby under 3 months',
          'Lethargy, hard to wake, not responding',
          'Trouble breathing, bluish lips',
          'Seizures or a stiff neck',
          'A rash that does not fade when pressed',
        ], durs: [2.2, 2.0, 1.9, 1.8, 2.8] },
        { type: 'note', emoji: '🚨', text: 'Get urgent help: ER or emergency number', sub: 'Better to check once too often.', tone: 'urgent', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, Mayo Clinic', disclaimer: 'This video does not replace a doctor.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Warning signs and emergency info always at hand', dur: 3.4 },
      ],
    },
  ],

  de: [
    {
      slug: '01-fieber-baby-wann-zum-arzt',
      frames: [
        { type: 'hook', kicker: 'Speichern, hilft nachts', title: 'Fieber beim Baby: wann zum Arzt?', sub: 'Grenzwerte aus kinderärztlichen Leitlinien', dur: 2.6 },
        { type: 'card', kicker: 'Fieber beim Baby', label: 'Unter 3 Monaten', value: 'ab 38,0°C', action: 'Sofort zum Arzt, auch nachts', tone: 'urgent', dur: 3.0 },
        { type: 'card', kicker: 'Fieber beim Baby', label: '3 bis 6 Monate', value: 'ab 38,0°C', action: 'Kinderarzt kontaktieren', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fieber beim Kind', label: 'Über 6 Monate', value: 'ab 39,0°C', action: 'Kinderarzt kontaktieren', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fieber beim Kind', label: 'In jedem Alter', value: 'ab 40,5°C', action: 'Dringend ärztliche Hilfe', tone: 'urgent', dur: 2.6 },
        { type: 'card', kicker: 'Fieber beim Kind', label: 'Fieber dauert', value: 'über 72 h', action: 'Kinderarzt kontaktieren', foot: 'Kind älter als 6 Monate', tone: 'consult', dur: 3.0 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Dieses Video ersetzt keinen Arzt. Wenn Sie etwas beunruhigt, rufen Sie den Arzt oder die 112 an.', dur: 3.4 },
        { type: 'end', shot: '01-today', headline: 'Grenzwerte und Messungen immer griffbereit', dur: 3.4 },
      ],
    },
    {
      slug: '02-wie-oft-trinkt-ein-baby',
      frames: [
        { type: 'hook', kicker: 'Baby füttern', title: 'Wie oft am Tag trinkt ein Baby?', sub: 'Typische Bereiche nach Alter', dur: 2.4 },
        { type: 'list', heading: 'Mahlzeiten pro Tag', pairs: true, items: [['0-1 Mon.', '8-12 Mal'], ['2-3 Mon.', '7-9 Mal'], ['4-6 Mon.', '5-7 Mal'], ['7-12 Mon.', '4-6 Mal']], durs: [1.7, 1.7, 1.7, 2.8] },
        { type: 'note', emoji: '🍼', text: 'Das sind Bereiche, keine Norm.', sub: 'Füttern nach Bedarf ist laut American Academy of Pediatrics der Standard.', dur: 3.2 },
        { type: 'note', emoji: '🤱', text: 'Neugeborene trinken meist alle 2-3 Stunden.', sub: 'Jedes Baby hat seinen eigenen Rhythmus.', dur: 2.6 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, WHO, ESPGHAN', disclaimer: 'Dieses Video ersetzt weder Arzt noch Stillberatung. Fragen besprechen Sie am besten mit dem Kinderarzt.', dur: 3.2 },
        { type: 'end', shot: '06-feed', headline: 'Mahlzeit mit einem Tipp erfasst', dur: 3.4 },
      ],
    },
    {
      slug: '03-nasse-windeln',
      frames: [
        { type: 'hook', kicker: 'Windeln', title: 'Wie viele nasse Windeln sind ein gutes Zeichen?', sub: 'Ein einfaches Zeichen, dass Ihr Baby genug trinkt', dur: 2.6 },
        { type: 'card', kicker: 'Nasse Windeln', label: 'Ab etwa dem 5. Lebenstag', value: '6 oder mehr', action: 'nasse Windeln pro Tag', tone: 'good', dur: 3.0 },
        { type: 'note', emoji: '💧', text: 'Weniger als 6 nasse Windeln können auf Austrocknung hindeuten.', dur: 3.0 },
        { type: 'list', heading: 'Zeichen für Austrocknung', items: ['Windel über 6 Stunden trocken', 'Weinen ohne Tränen', 'Eingesunkene Fontanelle'], durs: [1.8, 1.8, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Dann den Arzt kontaktieren.', sub: 'Besonders bei Säuglingen.', dur: 2.4 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Dieses Video ersetzt keinen Arzt.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Windeln des ganzen Tages automatisch gezählt', dur: 3.4 },
      ],
    },
    {
      slug: '04-wie-viel-schlaf-braucht-ein-baby',
      frames: [
        { type: 'hook', kicker: 'Babyschlaf', title: 'Wie viel sollte ein Baby schlafen?', sub: 'Insgesamt in 24 Stunden, mit Nickerchen', dur: 2.4 },
        { type: 'list', heading: 'Schlaf pro Tag', pairs: true, items: [['0-3 Mon.', '14-17 h'], ['4-11 Mon.', '12-15 h'], ['1-2 Jahre', '11-14 h']], durs: [1.8, 1.8, 2.8] },
        { type: 'note', emoji: '🌙', text: 'Neugeborene wachen alle 1-3 Stunden auf.', sub: 'Das ist normal und kein Schlafproblem.', dur: 2.6 },
        { type: 'note', emoji: '💤', text: 'Um den 4. Monat wird der Schlaf oft schlechter.', sub: 'Das ist ein Entwicklungsschub, nicht Ihr Fehler.', dur: 3.0 },
        { type: 'source', plural: true, text: 'National Sleep Foundation, American Academy of Pediatrics', disclaimer: 'Jedes Baby schläft anders. Das sind Bereiche, keine Norm.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Schlaf des ganzen Tages automatisch addiert', dur: 3.4 },
      ],
    },
    {
      slug: '05-warnzeichen',
      frames: [
        { type: 'hook', kicker: 'Speichern, hoffentlich nie nötig', title: '5 Warnzeichen: nicht bis morgen warten', sub: 'Nach kinderärztlichen Leitlinien', dur: 2.6 },
        { type: 'list', heading: 'Nicht warten, wenn Sie sehen:', numbered: true, items: [
          'Fieber ab 38°C bei einem Baby unter 3 Monaten',
          'Apathie, schwer zu wecken, keine Reaktion',
          'Atemnot, bläuliche Lippen',
          'Krampfanfall oder steifer Nacken',
          'Flecken, die auf Druck nicht verblassen',
        ], durs: [2.2, 2.0, 1.9, 1.8, 2.8] },
        { type: 'note', emoji: '🚨', text: 'Sofort Hilfe: Notaufnahme oder 112', sub: 'Lieber einmal zu oft nachsehen lassen.', tone: 'urgent', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, Mayo Clinic', disclaimer: 'Dieses Video ersetzt keinen Arzt.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Warnzeichen und Notruf 112 immer griffbereit', dur: 3.4 },
      ],
    },
  ],

  fr: [
    {
      slug: '01-fievre-bebe-quand-consulter',
      frames: [
        { type: 'hook', kicker: 'À garder pour la nuit', title: 'Fièvre chez bébé : quand consulter ?', sub: 'Les seuils des recommandations pédiatriques', dur: 2.6 },
        { type: 'card', kicker: 'Fièvre du nourrisson', label: 'Moins de 3 mois', value: 'dès 38,0°C', action: 'Consultez en urgence, même la nuit', tone: 'urgent', dur: 3.0 },
        { type: 'card', kicker: 'Fièvre du nourrisson', label: '3 à 6 mois', value: 'dès 38,0°C', action: 'Appelez le médecin', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fièvre de l’enfant', label: 'Plus de 6 mois', value: 'dès 39,0°C', action: 'Appelez le médecin', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fièvre de l’enfant', label: 'À tout âge', value: 'dès 40,5°C', action: 'Aide médicale urgente', tone: 'urgent', dur: 2.6 },
        { type: 'card', kicker: 'Fièvre de l’enfant', label: 'La fièvre dure', value: 'plus de 72 h', action: 'Appelez le médecin', foot: 'enfant de plus de 6 mois', tone: 'consult', dur: 3.0 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Cette vidéo ne remplace pas un médecin. En cas de doute, appelez votre médecin ou le 15.', dur: 3.4 },
        { type: 'end', shot: '01-today', headline: 'Seuils et mesures toujours à portée de main', dur: 3.4 },
      ],
    },
    {
      slug: '02-combien-de-repas-bebe',
      frames: [
        { type: 'hook', kicker: 'Alimentation de bébé', title: 'Combien de fois par jour mange un bébé ?', sub: 'Repères selon l’âge', dur: 2.4 },
        { type: 'list', heading: 'Repas par jour', pairs: true, items: [['0-1 mois', '8-12 fois'], ['2-3 mois', '7-9 fois'], ['4-6 mois', '5-7 fois'], ['7-12 mois', '4-6 fois']], durs: [1.7, 1.7, 1.7, 2.8] },
        { type: 'note', emoji: '🍼', text: 'Ce sont des repères, pas une norme.', sub: 'Nourrir à la demande est recommandé par l’American Academy of Pediatrics.', dur: 3.2 },
        { type: 'note', emoji: '🤱', text: 'Un nouveau-né mange en général toutes les 2-3 heures.', sub: 'Chaque bébé a son propre rythme.', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, OMS, ESPGHAN', disclaimer: 'Cette vidéo ne remplace ni un médecin ni une consultante en lactation. En cas de doute, parlez-en à votre médecin.', dur: 3.4 },
        { type: 'end', shot: '06-feed', headline: 'Un repas noté d’un seul appui', dur: 3.4 },
      ],
    },
    {
      slug: '03-couches-mouillees',
      frames: [
        { type: 'hook', kicker: 'Couches', title: 'Combien de couches mouillées, c’est bon signe ?', sub: 'Un repère simple pour savoir si bébé boit assez', dur: 2.6 },
        { type: 'card', kicker: 'Couches mouillées', label: 'À partir du 5e jour environ', value: '6 ou plus', action: 'couches mouillées par jour', tone: 'good', dur: 3.0 },
        { type: 'note', emoji: '💧', text: 'Moins de 6 couches mouillées peut signaler une déshydratation.', dur: 3.0 },
        { type: 'list', heading: 'Signes de déshydratation', items: ['Couche sèche depuis plus de 6 heures', 'Pleurs sans larmes', 'Fontanelle creusée'], durs: [1.8, 1.8, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Contactez alors un médecin.', sub: 'Surtout chez un nourrisson.', dur: 2.4 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Cette vidéo ne remplace pas un médecin.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Les couches de la journée comptées pour vous', dur: 3.4 },
      ],
    },
    {
      slug: '04-combien-dort-bebe',
      frames: [
        { type: 'hook', kicker: 'Sommeil de bébé', title: 'Combien de temps doit dormir un bébé ?', sub: 'Au total sur 24 heures, siestes comprises', dur: 2.4 },
        { type: 'list', heading: 'Sommeil par jour', pairs: true, items: [['0-3 mois', '14-17 h'], ['4-11 mois', '12-15 h'], ['1-2 ans', '11-14 h']], durs: [1.8, 1.8, 2.8] },
        { type: 'note', emoji: '🌙', text: 'Un nouveau-né se réveille toutes les 1-3 heures.', sub: 'C’est normal, pas un trouble du sommeil.', dur: 2.8 },
        { type: 'note', emoji: '💤', text: 'Vers 4 mois, le sommeil se dégrade souvent.', sub: 'C’est une étape du développement, pas votre faute.', dur: 3.0 },
        { type: 'source', plural: true, text: 'National Sleep Foundation, American Academy of Pediatrics', disclaimer: 'Chaque bébé dort différemment. Ce sont des repères, pas une norme.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Le sommeil de la journée additionné pour vous', dur: 3.4 },
      ],
    },
    {
      slug: '05-signes-d-alerte',
      frames: [
        { type: 'hook', kicker: 'À garder, au cas où', title: '5 signes pour ne pas attendre le matin', sub: 'Selon les recommandations pédiatriques', dur: 2.6 },
        { type: 'list', heading: 'N’attendez pas si vous voyez :', numbered: true, items: [
          'Fièvre dès 38°C chez un bébé de moins de 3 mois',
          'Apathie, difficile à réveiller, ne réagit pas',
          'Difficulté à respirer, lèvres bleutées',
          'Convulsions ou raideur de la nuque',
          'Taches qui ne s’effacent pas à la pression',
        ], durs: [2.2, 2.0, 1.9, 1.8, 2.8] },
        { type: 'note', emoji: '🚨', text: 'Urgence : appelez le 15 ou le 112', sub: 'Mieux vaut vérifier une fois de trop.', tone: 'urgent', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, Mayo Clinic', disclaimer: 'Cette vidéo ne remplace pas un médecin.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Signes d’alerte toujours à portée de main', dur: 3.4 },
      ],
    },
  ],

  es: [
    {
      slug: '01-fiebre-bebe-cuando-ir-al-medico',
      frames: [
        { type: 'hook', kicker: 'Guárdalo para la noche', title: 'Fiebre en el bebé: ¿cuándo ir al médico?', sub: 'Umbrales de las guías pediátricas', dur: 2.6 },
        { type: 'card', kicker: 'Fiebre en el bebé', label: 'Menos de 3 meses', value: 'desde 38,0°C', action: 'Al médico con urgencia, incluso de noche', tone: 'urgent', dur: 3.0 },
        { type: 'card', kicker: 'Fiebre en el bebé', label: '3 a 6 meses', value: 'desde 38,0°C', action: 'Consulta con tu pediatra', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fiebre en el niño', label: 'Más de 6 meses', value: 'desde 39,0°C', action: 'Consulta con tu pediatra', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Fiebre en el niño', label: 'A cualquier edad', value: 'desde 40,5°C', action: 'Atención médica urgente', tone: 'urgent', dur: 2.6 },
        { type: 'card', kicker: 'Fiebre en el niño', label: 'La fiebre dura', value: 'más de 72 h', action: 'Consulta con tu pediatra', foot: 'niño mayor de 6 meses', tone: 'consult', dur: 3.0 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Este vídeo no sustituye a un médico. Si algo te preocupa, llama a tu médico o al 112.', dur: 3.4 },
        { type: 'end', shot: '01-today', headline: 'Umbrales y mediciones siempre a mano', dur: 3.4 },
      ],
    },
    {
      slug: '02-cuantas-tomas-al-dia',
      frames: [
        { type: 'hook', kicker: 'Alimentación del bebé', title: '¿Cuántas veces al día come un bebé?', sub: 'Rangos típicos según la edad', dur: 2.4 },
        { type: 'list', heading: 'Tomas al día', pairs: true, items: [['0-1 meses', '8-12 veces'], ['2-3 meses', '7-9 veces'], ['4-6 meses', '5-7 veces'], ['7-12 meses', '4-6 veces']], durs: [1.7, 1.7, 1.7, 2.8] },
        { type: 'note', emoji: '🍼', text: 'Son rangos, no una norma.', sub: 'La alimentación a demanda es lo que recomienda la American Academy of Pediatrics.', dur: 3.2 },
        { type: 'note', emoji: '🤱', text: 'Un recién nacido suele comer cada 2-3 horas.', sub: 'Cada bebé tiene su propio ritmo.', dur: 2.6 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, OMS, ESPGHAN', disclaimer: 'Este vídeo no sustituye a un médico ni a una asesora de lactancia. Si tienes dudas, habla con tu pediatra.', dur: 3.4 },
        { type: 'end', shot: '06-feed', headline: 'Una toma anotada con un toque', dur: 3.4 },
      ],
    },
    {
      slug: '03-panales-mojados',
      frames: [
        { type: 'hook', kicker: 'Pañales', title: '¿Cuántos pañales mojados son buena señal?', sub: 'Una señal sencilla de que tu bebé está bien hidratado', dur: 2.6 },
        { type: 'card', kicker: 'Pañales mojados', label: 'A partir del 5.º día de vida', value: '6 o más', action: 'pañales mojados al día', tone: 'good', dur: 3.0 },
        { type: 'note', emoji: '💧', text: 'Menos de 6 pañales mojados puede indicar deshidratación.', dur: 3.0 },
        { type: 'list', heading: 'Señales de deshidratación', items: ['Pañal seco más de 6 horas', 'Llanto sin lágrimas', 'Fontanela hundida'], durs: [1.8, 1.8, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Entonces consulta con el médico.', sub: 'Sobre todo en lactantes.', dur: 2.4 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Este vídeo no sustituye a un médico.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Los pañales del día, contados solos', dur: 3.4 },
      ],
    },
    {
      slug: '04-cuanto-duerme-un-bebe',
      frames: [
        { type: 'hook', kicker: 'Sueño del bebé', title: '¿Cuánto debe dormir un bebé?', sub: 'En total en 24 horas, siestas incluidas', dur: 2.4 },
        { type: 'list', heading: 'Sueño al día', pairs: true, items: [['0-3 meses', '14-17 h'], ['4-11 meses', '12-15 h'], ['1-2 años', '11-14 h']], durs: [1.8, 1.8, 2.8] },
        { type: 'note', emoji: '🌙', text: 'Un recién nacido se despierta cada 1-3 horas.', sub: 'Es normal, no un problema de sueño.', dur: 2.6 },
        { type: 'note', emoji: '💤', text: 'Hacia los 4 meses, el sueño suele empeorar.', sub: 'Es un salto del desarrollo, no es culpa tuya.', dur: 3.0 },
        { type: 'source', plural: true, text: 'National Sleep Foundation, American Academy of Pediatrics', disclaimer: 'Cada bebé duerme distinto. Son rangos, no una norma.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'El sueño del día, sumado solo', dur: 3.4 },
      ],
    },
    {
      slug: '05-senales-de-alarma',
      frames: [
        { type: 'hook', kicker: 'Guárdalo, ojalá no lo necesites', title: '5 señales para no esperar a mañana', sub: 'Según las guías pediátricas', dur: 2.6 },
        { type: 'list', heading: 'No esperes si ves:', numbered: true, items: [
          'Fiebre desde 38°C en un bebé de menos de 3 meses',
          'Apatía, cuesta despertarlo, no reacciona',
          'Dificultad para respirar, labios azulados',
          'Convulsiones o rigidez de nuca',
          'Manchas que no desaparecen al presionar',
        ], durs: [2.2, 2.0, 1.9, 1.8, 2.8] },
        { type: 'note', emoji: '🚨', text: 'Urgencias o llama al 112', sub: 'Mejor comprobar una vez de más.', tone: 'urgent', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatrics, Mayo Clinic', disclaimer: 'Este vídeo no sustituye a un médico.', dur: 3.0 },
        { type: 'end', shot: '01-today', headline: 'Señales de alarma y 112 siempre a mano', dur: 3.4 },
      ],
    },
  ],
}

// ─── HTML ────────────────────────────────────────────────────────────────────

// Twarda spacja po jednoliterowych słowach i po liczbach: "u niemowlaka",
// "3 miesięcy", "72 h" nie rozjeżdżają się na dwie linie. Zakres "2-3" nie
// łamie się na łączniku, a krótkie ostatnie słowo nie zostaje samo w linii.
const glue = s => String(s)
  .replace(/ ([?:!;])/g, ' $1') // francuska spacja przed ? : ! ;
  .replace(/(^|[\s(])([AaIiOoUuWwZz])\s+/g, '$1$2 ')
  .replace(/(\d)\s+(?=\S)/g, '$1 ')
  .replace(/(\d)-(\d)/g, '$1⁠-⁠$2')
  .replace(/(\S+) (\S{1,7})$/, (m, a, b) => (a.length + b.length <= 13 ? `${a} ${b}` : m))
const esc = s => glue(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const b64 = buf => `data:image/png;base64,${buf.toString('base64')}`

const TONES = {
  urgent:  { bg: '#C0392B', fg: '#fff', value: '#fff' },
  consult: { bg: '#fff',    fg: '#2A1A12', value: '#B84E2E' },
  good:    { bg: '#1F8A6B', fg: '#fff', value: '#fff' },
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #2A1A12; background: #FBF4EE; }
body.brand { background: linear-gradient(180deg, #B84E2E 0%, #D77460 100%); color: #fff; }
.pill { position: absolute; left: 70px; top: 100px; display: flex; align-items: center; gap: 20px;
  font-size: 40px; font-weight: 700; }
.pill img { width: 72px; height: 72px; border-radius: 18px; }
/* Bezpieczna strefa: 160 px wolne z prawej, 440 px na dole (UI Shorts). */
.safe { position: absolute; left: 70px; right: 160px; top: 230px; bottom: 440px;
  display: flex; flex-direction: column; justify-content: center; }
.kicker { font-size: 40px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #B84E2E; margin-bottom: 40px; }
.brand .kicker { color: #fff; background: rgba(255,255,255,.2); align-self: flex-start;
  padding: 16px 30px; border-radius: 999px; letter-spacing: 0; text-transform: none; font-weight: 600; font-size: 44px; }
.title { font-size: 124px; font-weight: 800; line-height: 1.06; letter-spacing: -1px; }
.sub { font-size: 54px; font-weight: 600; opacity: .92; margin-top: 44px; line-height: 1.25; }
.card { border-radius: 48px; padding: 72px 60px; box-shadow: 0 18px 50px rgba(80, 30, 10, .16); }
.card .label { font-size: 62px; font-weight: 600; }
.card .value { font-size: 190px; font-weight: 800; line-height: 1.05; margin: 26px 0 30px; letter-spacing: -3px; white-space: nowrap; }
.card .action { font-size: 68px; font-weight: 700; line-height: 1.18; }
.card .foot { font-size: 46px; font-weight: 600; opacity: .85; margin-top: 26px; }
.heading { font-size: 88px; font-weight: 800; line-height: 1.08; margin-bottom: 48px; }
.rows { display: flex; flex-direction: column; gap: 26px; }
.row { background: #fff; border-radius: 34px; padding: 32px 38px; display: flex; align-items: center; gap: 30px;
  box-shadow: 0 8px 24px rgba(80, 30, 10, .08); border: 5px solid transparent; }
.row.hidden { visibility: hidden; }
.dense .heading { font-size: 76px; margin-bottom: 36px; }
.dense .rows { gap: 20px; }
.dense .row { padding: 24px 32px; }
.dense .row .txt { font-size: 47px; }
.dense .row .num { width: 72px; height: 72px; font-size: 42px; }
.row.new { border-color: #B84E2E; }
.row .num { flex: none; width: 84px; height: 84px; border-radius: 50%; background: #B84E2E; color: #fff;
  font-size: 48px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.row .txt { font-size: 54px; font-weight: 700; line-height: 1.16; }
.row .k { font-size: 58px; font-weight: 600; flex: 1; }
.row .v { font-size: 80px; font-weight: 800; color: #B84E2E; white-space: nowrap; }
.note .emoji { font-size: 180px; line-height: 1; margin-bottom: 48px; }
.note .text { font-size: 104px; font-weight: 800; line-height: 1.08; letter-spacing: -1px; }
.note .text.urgent { color: #C0392B; }
.note .sub { color: #5A463C; opacity: 1; }
.src .label { font-size: 44px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #B84E2E; }
.src .text { font-size: 76px; font-weight: 800; line-height: 1.14; margin: 28px 0 60px; }
.src .disc { background: #fff; border-radius: 34px; padding: 44px 48px; font-size: 52px; font-weight: 600; line-height: 1.28;
  color: #5A463C; box-shadow: 0 8px 24px rgba(80, 30, 10, .08); }
/* Karta końcowa: telefon wypełnia to, co zostaje między napisem a przyciskiem,
   a przycisk kończy się nad tytułem filmu w UI Shorts. */
.end { position: absolute; left: 0; right: 0; top: 170px; bottom: 440px; display: flex; flex-direction: column; align-items: center; }
.end .headline { width: 860px; text-align: center; font-size: 76px; font-weight: 800; line-height: 1.1; }
.end .phonebox { flex: 1 1 0; min-height: 0; margin-top: 44px; display: flex; justify-content: center; }
.end .phone { height: 100%; max-height: 840px; width: auto; aspect-ratio: 1 / 2; border-radius: 42px; box-shadow: 0 30px 70px rgba(60, 15, 0, .35); }
.end .brandrow { margin-top: 44px; display: flex; align-items: center; gap: 22px; font-size: 60px; font-weight: 800; }
.end .brandrow img { width: 92px; height: 92px; border-radius: 22px; }
.end .cta { margin-top: 24px; font-size: 44px; font-weight: 700; background: #fff; color: #B84E2E;
  padding: 18px 44px; border-radius: 999px; }
`

// Duża wartość na karcie ("od 38,0°C") zawsze w jednej linii, a długie słowo
// w tytule ("Warnzeichen:") nie wychodzi za krawędź: zmniejszamy czcionkę,
// aż się zmieści.
const FIT_SCRIPT = `<script>
for (const el of document.querySelectorAll('.card .value, .title, .note .text, .heading, .end .headline')) {
  let size = parseFloat(getComputedStyle(el).fontSize)
  while (el.scrollWidth > el.clientWidth && size > 60) { size -= 4; el.style.fontSize = size + 'px' }
}
</script>`

function page(bodyClass, inner, icon, app) {
  const pill = bodyClass === 'end' ? '' : `<div class="pill"><img src="${icon}">${esc(app)}</div>`
  const cls = bodyClass === 'hook' || bodyClass === 'end' ? 'brand' : ''
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
    <body class="${cls}">${pill}${inner}${FIT_SCRIPT}</body></html>`
}

function htmlFrames(frame, ctx) {
  const { icon, T } = ctx
  switch (frame.type) {
    case 'hook':
      return [{ dur: frame.dur, html: page('hook', `<div class="safe">
        <div class="kicker">${esc(frame.kicker)}</div>
        <div class="title">${esc(frame.title)}</div>
        <div class="sub">${esc(frame.sub)}</div></div>`, icon, T.app) }]
    case 'card': {
      const t = TONES[frame.tone]
      return [{ dur: frame.dur, html: page('card', `<div class="safe">
        <div class="kicker">${esc(frame.kicker)}</div>
        <div class="card" style="background:${t.bg};color:${t.fg}">
          <div class="label">${esc(frame.label)}</div>
          <div class="value" style="color:${t.value}">${esc(frame.value)}</div>
          <div class="action">${esc(frame.action)}</div>
          ${frame.foot ? `<div class="foot">${esc(frame.foot)}</div>` : ''}
        </div></div>`, icon, T.app) }]
    }
    case 'list':
      // Jedna klatka na każdy odsłonięty punkt; nieodsłonięte trzymają miejsce,
      // żeby lista nie skakała.
      return frame.items.map((_, shown) => ({
        dur: frame.durs[shown],
        html: page('list', `<div class="safe${frame.items.length >= 5 ? ' dense' : ''}">
          <div class="heading">${esc(frame.heading)}</div>
          <div class="rows">${frame.items.map((item, i) => {
            const cls = i > shown ? 'row hidden' : i === shown ? 'row new' : 'row'
            if (frame.pairs) return `<div class="${cls}"><div class="k">${esc(item[0])}</div><div class="v">${esc(item[1])}</div></div>`
            const num = `<div class="num">${frame.numbered ? i + 1 : '!'}</div>`
            return `<div class="${cls}">${num}<div class="txt">${esc(item)}</div></div>`
          }).join('')}</div></div>`, icon, T.app),
      }))
    case 'note':
      return [{ dur: frame.dur, html: page('note', `<div class="safe note">
        <div class="emoji">${frame.emoji}</div>
        <div class="text ${frame.tone || ''}">${esc(frame.text)}</div>
        ${frame.sub ? `<div class="sub">${esc(frame.sub)}</div>` : ''}</div>`, icon, T.app) }]
    case 'source':
      return [{ dur: frame.dur, html: page('source', `<div class="safe src">
        <div class="label">${esc(frame.plural ? T.sourcesLabel : T.sourceLabel)}</div>
        <div class="text">${esc(frame.text)}</div>
        <div class="disc">${esc(frame.disclaimer)}</div></div>`, icon, T.app) }]
    case 'end':
      return [{ dur: frame.dur, html: page('end', `<div class="end">
        <div class="headline">${esc(frame.headline)}</div>
        <div class="phonebox"><img class="phone" src="${ctx.phones[frame.shot]}"></div>
        <div class="brandrow"><img src="${icon}">${esc(T.app)}</div>
        <div class="cta">${esc(T.cta)}</div></div>`, icon, T.app) }]
    default:
      throw new Error(`Nieznany typ klatki: ${frame.type}`)
  }
}

// ─── Wideo ───────────────────────────────────────────────────────────────────

function encode(frames, out) {
  const args = ['-y']
  // Każde wejście trwa dur + FADE, bo przejście zjada FADE z sąsiednich klatek.
  frames.forEach(f => args.push('-loop', '1', '-framerate', '30', '-t', (f.dur + FADE).toFixed(2), '-i', f.file))
  const total = frames.reduce((s, f) => s + f.dur, 0) + FADE
  args.push('-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=r=48000:cl=stereo')
  let chain = ''
  let last = '[0:v]'
  let offset = 0
  for (let i = 1; i < frames.length; i++) {
    offset += frames[i - 1].dur
    const label = `[v${i}]`
    chain += `${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${(offset - FADE / 2).toFixed(2)}${label};`
    last = label
  }
  chain += `${last}format=yuv420p[out]`
  args.push('-filter_complex', chain, '-map', '[out]', '-map', `${frames.length}:a`,
    '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out)
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] })
  return total
}

async function phoneImage(lang, shot) {
  const buf = await sharp(path.join(SHOTS, lang, `${shot}.png`)).extract(PHONE_CROP).resize(440, 880).png().toBuffer()
  return b64(buf)
}

async function main() {
  const args = process.argv.slice(2)
  const langs = args.filter(a => VIDEOS[a])
  const slugs = args.filter(a => !VIDEOS[a])
  const icon = b64(await sharp(ICON).resize(128, 128).png().toBuffer())
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const pg = await browser.newPage()
  await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 })

  for (const lang of (langs.length ? langs : Object.keys(VIDEOS))) {
    const T = COMMON[lang]
    const dir = path.join(OUT, lang)
    const tmp = path.join(OUT, '.tmp', lang)
    fs.mkdirSync(dir, { recursive: true })
    fs.mkdirSync(tmp, { recursive: true })
    const phones = {}
    for (const v of VIDEOS[lang]) for (const f of v.frames) if (f.shot && !phones[f.shot]) phones[f.shot] = await phoneImage(lang, f.shot)

    for (const video of VIDEOS[lang]) {
      if (slugs.length && !slugs.some(s => video.slug.startsWith(s))) continue
      const frames = video.frames.flatMap(f => htmlFrames(f, { icon, T, phones }))
      for (const [i, f] of frames.entries()) {
        f.file = path.join(tmp, `${video.slug}-${String(i).padStart(2, '0')}.png`)
        await pg.setContent(f.html, { waitUntil: 'load' })
        const overflow = await pg.evaluate(() => {
          // Karta końcowa: przycisk musi być nad tytułem filmu w UI Shorts.
          const cta = document.querySelector('.end .cta')
          if (cta) return cta.getBoundingClientRect().bottom > 1480
          const s = document.querySelector('.safe')
          if (!s) return false
          const kids = [...s.children].map(c => c.getBoundingClientRect())
          const box = s.getBoundingClientRect()
          const tooWide = [...s.querySelectorAll('*')].some(el => el.scrollWidth > el.clientWidth + 1)
          return tooWide || kids.some(r => r.top < box.top - 1 || r.bottom > box.bottom + 1)
        })
        if (overflow) console.warn(`  UWAGA: ${video.slug} klatka ${i} wychodzi poza bezpieczną strefę`)
        await pg.screenshot({ path: f.file, type: 'png' })
      }
      fs.copyFileSync(frames[0].file, path.join(dir, `${video.slug}-cover.png`))
      const out = path.join(dir, `${video.slug}.mp4`)
      const total = encode(frames, out)
      console.log(`  [${lang}] ${video.slug}.mp4  ${total.toFixed(1)} s, ${frames.length} klatek, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`)
    }
  }
  await browser.close()
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
