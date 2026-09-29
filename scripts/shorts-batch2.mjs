// scripts/shorts-batch2.mjs
//
// Druga paczka Shorts (2026-09-29). Wnioski z pierwszej: najlepiej szły pytania
// z liczbą i konkretem (gorączka, mokre pieluchy), a widzowie oglądali średnio
// ok. 5 s. Dlatego: pytanie na pierwszej klatce, krótsze klatki, całość ~15 s.
// Treść zgodna z tym, co mówi apka (referenceTables, dailyTips, alerty kaszlu
// i wysypki) oraz ze źródłami podanymi w filmie. Numery alarmowe lokalne:
// PL/DE/ES 112, FR 15 (i 112), EN "emergency services".
//
// Run: SHORTS_BATCH=2 FFMPEG_PATH=... node scripts/build-shorts.mjs [pl] [slug...]

export const VIDEOS = {
  pl: [
    {
      slug: '06-temperatura-gdzie-mierzyc',
      frames: [
        { type: 'hook', kicker: 'Temperatura u niemowlaka', title: 'Pacha, pupa czy ucho?', sub: 'Gdzie mierzyć, żeby wynik był wiarygodny', dur: 2.2 },
        { type: 'note', emoji: '🌡️', text: 'W pupie: najdokładniej', sub: 'Tak mierz niemowlę do 3. miesiąca.', dur: 2.4 },
        { type: 'note', emoji: '💪', text: 'Pod pachą: najłatwiej', sub: 'Ale najmniej dokładnie. Wątpliwy wynik sprawdź inną metodą.', dur: 2.6 },
        { type: 'note', emoji: '👂', text: 'W uchu: od 6. miesiąca', sub: 'U młodszych dzieci bywa niedokładnie.', dur: 2.2 },
        { type: 'note', emoji: '🙂', text: 'Na czole: od 3. miesiąca', sub: 'Termometrem skroniowym, zgodnie z instrukcją.', dur: 2.2 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Gorączka od 38°C u dziecka poniżej 3 miesięcy to zawsze powód do kontaktu z lekarzem.', dur: 2.8 },
        { type: 'end', shot: '02-temperature', headline: 'Pomiary i metoda zapisane w jednym miejscu', dur: 2.8 },
      ],
    },
    {
      slug: '07-test-szklanki',
      frames: [
        { type: 'hook', kicker: 'Wysypka i gorączka', title: 'Zrób test szklanki', sub: '10 sekund, które mówią, czy dzwonić na 112', dur: 2.2 },
        { type: 'note', emoji: '🥛', text: 'Dociśnij przezroczystą szklankę do wysypki.', sub: 'Patrz na plamki przez szkło.', dur: 2.6 },
        { type: 'card', kicker: 'Test szklanki', label: 'Plamki bledną', value: '✓', action: 'Obserwuj dziecko. Przy gorączce zadzwoń do pediatry.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Test szklanki', label: 'Plamki NIE bledną', value: '112', action: 'Dzwoń od razu', foot: 'To może być zakażenie meningokokowe', tone: 'urgent', dur: 2.8 },
        { type: 'note', emoji: '🔦', text: 'Ciemna skóra? Sprawdź dłonie, stopy i wnętrze powiek.', sub: 'Tam plamki widać najlepiej.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, Meningitis Research Foundation', disclaimer: 'Gdy dziecko wygląda na bardzo chore, dzwoń 112 bez względu na wynik testu.', dur: 3.0 },
        { type: 'end', shot: '05-when-to-seek-help', headline: 'Objawy alarmowe zawsze pod ręką', dur: 2.8 },
      ],
    },
    {
      slug: '08-pierwsze-zabki',
      frames: [
        { type: 'hook', kicker: 'Ząbkowanie', title: 'Kiedy wychodzi pierwszy ząb?', sub: 'Typowa kolejność zębów mlecznych', dur: 2.2 },
        { type: 'list', heading: 'Zęby (w miesiącach)', pairs: true, items: [['Dolne jedynki', '6-10'], ['Górne jedynki', '8-12'], ['Górne dwójki', '9-13'], ['Dolne dwójki', '10-16']], durs: [1.4, 1.4, 1.4, 2.2] },
        { type: 'note', emoji: '🦷', text: 'Każde dziecko ma swój rytm.', sub: 'Brak zębów po 18. miesiącu? Zapytaj dentystę.', dur: 2.6 },
        { type: 'note', emoji: '🌡️', text: 'Ząbkowanie nie daje wysokiej gorączki.', sub: 'Gorączka od 38°C ma inną przyczynę. Skonsultuj ją z lekarzem.', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatric Dentistry, American Academy of Pediatrics', disclaimer: 'To typowe zakresy, nie norma.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Każdy ząbek z datą zapiszesz w aplikacji', dur: 2.8 },
      ],
    },
    {
      slug: '09-szczekajacy-kaszel',
      frames: [
        { type: 'hook', kicker: 'Kaszel w nocy', title: 'Kaszel jak szczekanie psa?', sub: 'Tak często wygląda krup, czyli zapalenie krtani', dur: 2.2 },
        { type: 'note', emoji: '🐕', text: 'Szczekający kaszel i chrypka', sub: 'Zwykle nasilają się w nocy.', dur: 2.4 },
        { type: 'note', emoji: '🤗', text: 'Uspokój dziecko i trzymaj je pionowo.', sub: 'Płacz nasila duszność.', dur: 2.6 },
        { type: 'list', heading: 'Dzwoń 112, gdy:', numbered: true, items: ['Świst przy wdechu, także w spoczynku', 'Skóra wciąga się między żebrami', 'Sine usta lub bardzo blada skóra', 'Ślini się i nie może przełknąć'], durs: [1.8, 1.8, 1.7, 2.6] },
        { type: 'note', emoji: '🩺', text: 'W innych przypadkach zadzwoń do pediatry.', sub: 'Szczególnie gdy pojawi się gorączka.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, American Academy of Pediatrics', disclaimer: 'Ten film nie zastępuje lekarza.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Epizody kaszlu zapiszesz i pokażesz lekarzowi', dur: 2.8 },
      ],
    },
    {
      slug: '10-rozszerzanie-diety',
      frames: [
        { type: 'hook', kicker: 'Rozszerzanie diety', title: 'Kiedy pierwsze posiłki stałe?', sub: 'Według WHO i pediatrów', dur: 2.2 },
        { type: 'card', kicker: 'Rozszerzanie diety', label: 'Najczęściej', value: 'ok. 6 mies.', action: 'Nie wcześniej niż po 4. miesiącu', tone: 'good', dur: 2.6 },
        { type: 'list', heading: 'Sygnały gotowości', numbered: true, items: ['Siedzi z podparciem', 'Pewnie trzyma głowę', 'Interesuje się jedzeniem', 'Nie wypycha łyżeczki językiem'], durs: [1.3, 1.3, 1.3, 2.2] },
        { type: 'note', emoji: '🍯', text: 'Miód dopiero po 12. miesiącu.', sub: 'Ryzyko botulizmu.', dur: 2.2 },
        { type: 'note', emoji: '🥕', text: 'Nowe produkty pojedynczo, co 3-4 dni.', sub: 'Łatwiej zauważyć alergię.', dur: 2.4 },
        { type: 'source', plural: true, text: 'WHO, ESPGHAN, American Academy of Pediatrics', disclaimer: 'Termin rozszerzania diety ustal z pediatrą.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Nowe produkty i reakcje zapiszesz w aplikacji', dur: 2.8 },
      ],
    },
  ],

  en: [
    {
      slug: '06-where-to-take-baby-temperature',
      frames: [
        { type: 'hook', kicker: 'Baby temperature', title: 'Armpit, bottom or ear?', sub: 'Where to measure for a reliable reading', dur: 2.2 },
        { type: 'note', emoji: '🌡️', text: 'Rectal: most accurate', sub: 'Use it for babies under 3 months.', dur: 2.4 },
        { type: 'note', emoji: '💪', text: 'Armpit: easiest', sub: 'But least accurate. Double-check a doubtful reading another way.', dur: 2.6 },
        { type: 'note', emoji: '👂', text: 'Ear: from 6 months', sub: 'Less accurate in younger babies.', dur: 2.2 },
        { type: 'note', emoji: '🙂', text: 'Forehead: from 3 months', sub: 'With a temporal artery thermometer, following its instructions.', dur: 2.2 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'A fever of 38°C (100.4°F) or more in a baby under 3 months always needs a doctor.', dur: 2.8 },
        { type: 'end', shot: '02-temperature', headline: 'Readings and method saved in one place', dur: 2.8 },
      ],
    },
    {
      slug: '07-glass-test-rash',
      frames: [
        { type: 'hook', kicker: 'Rash and fever', title: 'Do the glass test', sub: '10 seconds that tell you when to call for help', dur: 2.2 },
        { type: 'note', emoji: '🥛', text: 'Press a clear glass firmly against the rash.', sub: 'Look at the spots through the glass.', dur: 2.6 },
        { type: 'card', kicker: 'Glass test', label: 'Spots fade', value: '✓', action: 'Watch your child. With a fever, call your pediatrician.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Glass test', label: 'Spots do NOT fade', value: '🚨', action: 'Call emergency services now', foot: 'It could be meningococcal disease', tone: 'urgent', dur: 2.8 },
        { type: 'note', emoji: '🔦', text: 'Darker skin? Check palms, soles and inside the eyelids.', sub: 'Spots are easier to see there.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, Meningitis Research Foundation', disclaimer: 'If your child seems very unwell, get help immediately, whatever the glass test shows.', dur: 3.0 },
        { type: 'end', shot: '05-when-to-seek-help', headline: 'Warning signs always at hand', dur: 2.8 },
      ],
    },
    {
      slug: '08-baby-teeth-timeline',
      frames: [
        { type: 'hook', kicker: 'Teething', title: 'When does the first tooth come in?', sub: 'The typical order of baby teeth', dur: 2.2 },
        { type: 'list', heading: 'Teeth (in months)', pairs: true, items: [['Bottom front', '6-10'], ['Top front', '8-12'], ['Top sides', '9-13'], ['Bottom sides', '10-16']], durs: [1.4, 1.4, 1.4, 2.2] },
        { type: 'note', emoji: '🦷', text: 'Every baby has their own pace.', sub: 'No teeth by 18 months? Ask a dentist.', dur: 2.6 },
        { type: 'note', emoji: '🌡️', text: 'Teething does not cause a high fever.', sub: 'A fever of 38°C (100.4°F) or more has another cause. Check with a doctor.', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatric Dentistry, American Academy of Pediatrics', disclaimer: 'These are typical ranges, not rules.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Log every tooth with its date', dur: 2.8 },
      ],
    },
    {
      slug: '09-barking-cough-croup',
      frames: [
        { type: 'hook', kicker: 'Coughing at night', title: 'A cough like a barking dog?', sub: 'That is often croup, a swelling of the voice box', dur: 2.2 },
        { type: 'note', emoji: '🐕', text: 'Barking cough and hoarse voice', sub: 'Usually worse at night.', dur: 2.4 },
        { type: 'note', emoji: '🤗', text: 'Keep your child calm and upright.', sub: 'Crying makes breathing harder.', dur: 2.6 },
        { type: 'list', heading: 'Call emergency services if:', numbered: true, items: ['A high-pitched sound when breathing in, even at rest', 'Skin pulling in between the ribs', 'Blue lips or very pale skin', 'Drooling and unable to swallow'], durs: [1.8, 1.8, 1.7, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Otherwise, call your pediatrician.', sub: 'Especially if a fever appears.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, American Academy of Pediatrics', disclaimer: 'This video does not replace a doctor.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Log coughing episodes and show your doctor', dur: 2.8 },
      ],
    },
    {
      slug: '10-starting-solids',
      frames: [
        { type: 'hook', kicker: 'Starting solids', title: 'When do babies start solid food?', sub: 'According to WHO and pediatricians', dur: 2.2 },
        { type: 'card', kicker: 'Starting solids', label: 'Usually', value: 'about 6 mo', action: 'Not before 4 months', tone: 'good', dur: 2.6 },
        { type: 'list', heading: 'Signs of readiness', numbered: true, items: ['Sits with support', 'Holds head steady', 'Shows interest in food', 'Does not push the spoon out with the tongue'], durs: [1.3, 1.3, 1.3, 2.2] },
        { type: 'note', emoji: '🍯', text: 'No honey before 12 months.', sub: 'Risk of botulism.', dur: 2.2 },
        { type: 'note', emoji: '🥕', text: 'New foods one at a time, every 3-4 days.', sub: 'Allergies are easier to spot.', dur: 2.4 },
        { type: 'source', plural: true, text: 'WHO, ESPGHAN, American Academy of Pediatrics', disclaimer: 'Agree on the timing with your pediatrician.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Log new foods and reactions in the app', dur: 2.8 },
      ],
    },
  ],

  de: [
    {
      slug: '06-fieber-messen-baby',
      frames: [
        { type: 'hook', kicker: 'Fieber messen beim Baby', title: 'Achsel, Po oder Ohr?', sub: 'Wo die Messung zuverlässig ist', dur: 2.2 },
        { type: 'note', emoji: '🌡️', text: 'Im Po: am genauesten', sub: 'So messen Sie Babys unter 3 Monaten.', dur: 2.4 },
        { type: 'note', emoji: '💪', text: 'Unter der Achsel: am einfachsten', sub: 'Aber am ungenauesten. Unsichere Werte anders nachmessen.', dur: 2.6 },
        { type: 'note', emoji: '👂', text: 'Im Ohr: ab 6 Monaten', sub: 'Bei jüngeren Babys ungenau.', dur: 2.2 },
        { type: 'note', emoji: '🙂', text: 'An der Stirn: ab 3 Monaten', sub: 'Mit Schläfenthermometer, laut Anleitung.', dur: 2.2 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Fieber ab 38 °C bei einem Baby unter 3 Monaten: immer zum Arzt.', dur: 2.8 },
        { type: 'end', shot: '02-temperature', headline: 'Messwerte und Methode an einem Ort', dur: 2.8 },
      ],
    },
    {
      slug: '07-glastest-ausschlag',
      frames: [
        { type: 'hook', kicker: 'Ausschlag und Fieber', title: 'Machen Sie den Glastest', sub: '10 Sekunden, die zeigen, wann Sie die 112 rufen', dur: 2.2 },
        { type: 'note', emoji: '🥛', text: 'Drücken Sie ein klares Glas fest auf den Ausschlag.', sub: 'Schauen Sie durch das Glas auf die Flecken.', dur: 2.6 },
        { type: 'card', kicker: 'Glastest', label: 'Flecken verblassen', value: '✓', action: 'Kind beobachten. Bei Fieber den Kinderarzt anrufen.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Glastest', label: 'Flecken verblassen NICHT', value: '112', action: 'Sofort anrufen', foot: 'Es kann eine Meningokokken-Infektion sein', tone: 'urgent', dur: 2.8 },
        { type: 'note', emoji: '🔦', text: 'Dunkle Haut? Handflächen, Fußsohlen und Lidinnenseiten prüfen.', sub: 'Dort sind Flecken besser zu sehen.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, Meningitis Research Foundation', disclaimer: 'Wirkt Ihr Kind sehr krank, rufen Sie die 112, egal was der Glastest zeigt.', dur: 3.0 },
        { type: 'end', shot: '05-when-to-seek-help', headline: 'Warnzeichen immer griffbereit', dur: 2.8 },
      ],
    },
    {
      slug: '08-erste-zaehne',
      frames: [
        { type: 'hook', kicker: 'Zahnen', title: 'Wann kommt der erste Zahn?', sub: 'Die typische Reihenfolge der Milchzähne', dur: 2.2 },
        { type: 'list', heading: 'Zähne (in Monaten)', pairs: true, items: [['Unten vorne', '6-10'], ['Oben vorne', '8-12'], ['Oben seitlich', '9-13'], ['Unten seitlich', '10-16']], durs: [1.4, 1.4, 1.4, 2.2] },
        { type: 'note', emoji: '🦷', text: 'Jedes Kind hat sein eigenes Tempo.', sub: 'Mit 18 Monaten noch kein Zahn? Fragen Sie den Zahnarzt.', dur: 2.6 },
        { type: 'note', emoji: '🌡️', text: 'Zahnen macht kein hohes Fieber.', sub: 'Fieber ab 38 °C hat eine andere Ursache. Lassen Sie es ärztlich abklären.', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatric Dentistry, American Academy of Pediatrics', disclaimer: 'Typische Bereiche, keine Norm.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Jeden Zahn mit Datum festhalten', dur: 2.8 },
      ],
    },
    {
      slug: '09-bellender-husten',
      frames: [
        { type: 'hook', kicker: 'Husten in der Nacht', title: 'Husten wie ein bellender Hund?', sub: 'Oft steckt Pseudokrupp dahinter', dur: 2.2 },
        { type: 'note', emoji: '🐕', text: 'Bellender Husten und Heiserkeit', sub: 'Meist nachts schlimmer.', dur: 2.4 },
        { type: 'note', emoji: '🤗', text: 'Beruhigen Sie Ihr Kind und halten Sie es aufrecht.', sub: 'Weinen verstärkt die Atemnot.', dur: 2.6 },
        { type: 'list', heading: 'Rufen Sie die 112, wenn:', numbered: true, items: ['Pfeifen beim Einatmen, auch in Ruhe', 'Die Haut zwischen den Rippen einsinkt', 'Blaue Lippen oder sehr blasse Haut', 'Starker Speichelfluss, Schlucken geht nicht'], durs: [1.8, 1.8, 1.7, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Sonst den Kinderarzt anrufen.', sub: 'Besonders wenn Fieber dazukommt.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, American Academy of Pediatrics', disclaimer: 'Dieses Video ersetzt keinen Arzt.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Hustenepisoden erfassen und dem Arzt zeigen', dur: 2.8 },
      ],
    },
    {
      slug: '10-beikost-start',
      frames: [
        { type: 'hook', kicker: 'Beikost', title: 'Wann beginnt die Beikost?', sub: 'Laut WHO und Kinderärzten', dur: 2.2 },
        { type: 'card', kicker: 'Beikost', label: 'Meistens', value: 'ca. 6 Mon.', action: 'Frühestens ab dem 5. Monat', tone: 'good', dur: 2.6 },
        { type: 'list', heading: 'Zeichen der Bereitschaft', numbered: true, items: ['Sitzt mit Unterstützung', 'Hält den Kopf sicher', 'Interessiert sich fürs Essen', 'Schiebt den Löffel nicht mehr mit der Zunge heraus'], durs: [1.3, 1.3, 1.3, 2.2] },
        { type: 'note', emoji: '🍯', text: 'Kein Honig vor dem 12. Monat.', sub: 'Botulismus-Risiko.', dur: 2.2 },
        { type: 'note', emoji: '🥕', text: 'Neue Lebensmittel einzeln, alle 3-4 Tage.', sub: 'So erkennen Sie Allergien leichter.', dur: 2.4 },
        { type: 'source', plural: true, text: 'WHO, ESPGHAN, American Academy of Pediatrics', disclaimer: 'Den Start besprechen Sie am besten mit dem Kinderarzt.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Neue Lebensmittel und Reaktionen festhalten', dur: 2.8 },
      ],
    },
  ],

  fr: [
    {
      slug: '06-prendre-temperature-bebe',
      frames: [
        { type: 'hook', kicker: 'Température de bébé', title: 'Aisselle, rectale ou oreille ?', sub: 'Où mesurer pour un résultat fiable', dur: 2.2 },
        { type: 'note', emoji: '🌡️', text: 'Rectale : la plus précise', sub: 'À utiliser chez le bébé de moins de 3 mois.', dur: 2.4 },
        { type: 'note', emoji: '💪', text: 'Sous l’aisselle : la plus simple', sub: 'Mais la moins précise. Vérifiez un résultat douteux autrement.', dur: 2.6 },
        { type: 'note', emoji: '👂', text: 'Dans l’oreille : dès 6 mois', sub: 'Moins fiable chez les plus petits.', dur: 2.2 },
        { type: 'note', emoji: '🙂', text: 'Sur le front : dès 3 mois', sub: 'Avec un thermomètre temporal, selon sa notice.', dur: 2.2 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Une fièvre dès 38 °C chez un bébé de moins de 3 mois nécessite toujours un médecin.', dur: 2.8 },
        { type: 'end', shot: '02-temperature', headline: 'Mesures et méthode au même endroit', dur: 2.8 },
      ],
    },
    {
      slug: '07-test-du-verre',
      frames: [
        { type: 'hook', kicker: 'Éruption et fièvre', title: 'Faites le test du verre', sub: '10 secondes pour savoir s’il faut appeler le 15', dur: 2.2 },
        { type: 'note', emoji: '🥛', text: 'Appuyez un verre transparent sur les taches.', sub: 'Regardez les taches à travers le verre.', dur: 2.6 },
        { type: 'card', kicker: 'Test du verre', label: 'Les taches s’effacent', value: '✓', action: 'Surveillez l’enfant. En cas de fièvre, appelez le médecin.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Test du verre', label: 'Les taches ne s’effacent PAS', value: '15', action: 'Appelez tout de suite le 15 ou le 112', foot: 'Cela peut être une infection à méningocoque', tone: 'urgent', dur: 2.8 },
        { type: 'note', emoji: '🔦', text: 'Peau foncée ? Regardez les paumes, les plantes des pieds et l’intérieur des paupières.', sub: 'Les taches s’y voient mieux.', dur: 2.8 },
        { type: 'source', plural: true, text: 'NHS, Meningitis Research Foundation', disclaimer: 'Si l’enfant semble très malade, appelez le 15, quel que soit le résultat du test.', dur: 3.0 },
        { type: 'end', shot: '05-when-to-seek-help', headline: 'Signes d’alerte toujours à portée de main', dur: 2.8 },
      ],
    },
    {
      slug: '08-premieres-dents',
      frames: [
        { type: 'hook', kicker: 'Poussée dentaire', title: 'Quand sort la première dent ?', sub: 'L’ordre habituel des dents de lait', dur: 2.2 },
        { type: 'list', heading: 'Dents (en mois)', pairs: true, items: [['Devant, en bas', '6-10'], ['Devant, en haut', '8-12'], ['Côtés, en haut', '9-13'], ['Côtés, en bas', '10-16']], durs: [1.4, 1.4, 1.4, 2.2] },
        { type: 'note', emoji: '🦷', text: 'Chaque enfant a son rythme.', sub: 'Pas de dent à 18 mois ? Demandez au dentiste.', dur: 2.6 },
        { type: 'note', emoji: '🌡️', text: 'Les dents ne donnent pas de forte fièvre.', sub: 'Une fièvre dès 38 °C a une autre cause. Parlez-en au médecin.', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatric Dentistry, American Academy of Pediatrics', disclaimer: 'Ce sont des repères, pas une norme.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Chaque dent notée avec sa date', dur: 2.8 },
      ],
    },
    {
      slug: '09-toux-aboyante',
      frames: [
        { type: 'hook', kicker: 'Toux la nuit', title: 'Une toux qui aboie ?', sub: 'C’est souvent une laryngite', dur: 2.2 },
        { type: 'note', emoji: '🐕', text: 'Toux aboyante et voix rauque', sub: 'Souvent pire la nuit.', dur: 2.4 },
        { type: 'note', emoji: '🤗', text: 'Calmez l’enfant et gardez-le assis.', sub: 'Les pleurs aggravent la gêne respiratoire.', dur: 2.6 },
        { type: 'list', heading: 'Appelez le 15 si :', numbered: true, items: ['Bruit aigu à l’inspiration, même au repos', 'La peau se creuse entre les côtes', 'Lèvres bleues ou peau très pâle', 'Il bave et n’arrive pas à avaler'], durs: [1.8, 1.8, 1.7, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Sinon, appelez le médecin.', sub: 'Surtout si une fièvre apparaît.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, American Academy of Pediatrics', disclaimer: 'Cette vidéo ne remplace pas un médecin.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Les épisodes de toux notés pour le médecin', dur: 2.8 },
      ],
    },
    {
      slug: '10-diversification',
      frames: [
        { type: 'hook', kicker: 'Diversification', title: 'Quand commencer la diversification ?', sub: 'Selon l’OMS et les pédiatres', dur: 2.2 },
        { type: 'card', kicker: 'Diversification', label: 'En général', value: 'vers 6 mois', action: 'Jamais avant 4 mois', tone: 'good', dur: 2.6 },
        { type: 'list', heading: 'Signes qu’il est prêt', numbered: true, items: ['Tient assis avec appui', 'Tient bien sa tête', 'S’intéresse aux repas', 'Ne repousse plus la cuillère avec la langue'], durs: [1.3, 1.3, 1.3, 2.2] },
        { type: 'note', emoji: '🍯', text: 'Pas de miel avant 12 mois.', sub: 'Risque de botulisme.', dur: 2.2 },
        { type: 'note', emoji: '🥕', text: 'Un nouvel aliment à la fois, tous les 3-4 jours.', sub: 'Plus facile de repérer une allergie.', dur: 2.4 },
        { type: 'source', plural: true, text: 'OMS, ESPGHAN, American Academy of Pediatrics', disclaimer: 'Décidez du moment avec votre médecin.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Nouveaux aliments et réactions notés', dur: 2.8 },
      ],
    },
  ],

  es: [
    {
      slug: '06-tomar-temperatura-bebe',
      frames: [
        { type: 'hook', kicker: 'Temperatura del bebé', title: '¿Axila, recto u oído?', sub: 'Dónde medir para un resultado fiable', dur: 2.2 },
        { type: 'note', emoji: '🌡️', text: 'Rectal: la más precisa', sub: 'Úsala en bebés menores de 3 meses.', dur: 2.4 },
        { type: 'note', emoji: '💪', text: 'En la axila: la más fácil', sub: 'Pero la menos precisa. Comprueba un resultado dudoso de otra forma.', dur: 2.6 },
        { type: 'note', emoji: '👂', text: 'En el oído: desde los 6 meses', sub: 'Menos fiable en bebés más pequeños.', dur: 2.2 },
        { type: 'note', emoji: '🙂', text: 'En la frente: desde los 3 meses', sub: 'Con termómetro temporal, según sus instrucciones.', dur: 2.2 },
        { type: 'source', plural: false, text: 'American Academy of Pediatrics', disclaimer: 'Fiebre de 38 °C o más en un bebé menor de 3 meses: acude siempre al médico.', dur: 2.8 },
        { type: 'end', shot: '02-temperature', headline: 'Mediciones y método en un solo lugar', dur: 2.8 },
      ],
    },
    {
      slug: '07-prueba-del-vaso',
      frames: [
        { type: 'hook', kicker: 'Erupción y fiebre', title: 'Haz la prueba del vaso', sub: '10 segundos que te dicen cuándo llamar al 112', dur: 2.2 },
        { type: 'note', emoji: '🥛', text: 'Presiona un vaso transparente sobre las manchas.', sub: 'Mira las manchas a través del vidrio.', dur: 2.6 },
        { type: 'card', kicker: 'Prueba del vaso', label: 'Las manchas desaparecen', value: '✓', action: 'Vigila al niño. Si tiene fiebre, llama al pediatra.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Prueba del vaso', label: 'Las manchas NO desaparecen', value: '112', action: 'Llama ahora mismo', foot: 'Puede ser una infección meningocócica', tone: 'urgent', dur: 2.8 },
        { type: 'note', emoji: '🔦', text: '¿Piel oscura? Mira palmas, plantas de los pies y el interior de los párpados.', sub: 'Ahí se ven mejor las manchas.', dur: 2.8 },
        { type: 'source', plural: true, text: 'NHS, Meningitis Research Foundation', disclaimer: 'Si tu hijo parece muy enfermo, llama al 112 sea cual sea el resultado.', dur: 3.0 },
        { type: 'end', shot: '05-when-to-seek-help', headline: 'Señales de alarma siempre a mano', dur: 2.8 },
      ],
    },
    {
      slug: '08-primeros-dientes',
      frames: [
        { type: 'hook', kicker: 'Dentición', title: '¿Cuándo sale el primer diente?', sub: 'El orden habitual de los dientes de leche', dur: 2.2 },
        { type: 'list', heading: 'Dientes (en meses)', pairs: true, items: [['Centrales abajo', '6-10'], ['Centrales arriba', '8-12'], ['Laterales arriba', '9-13'], ['Laterales abajo', '10-16']], durs: [1.4, 1.4, 1.4, 2.2] },
        { type: 'note', emoji: '🦷', text: 'Cada niño tiene su ritmo.', sub: '¿Sin dientes a los 18 meses? Consulta al dentista.', dur: 2.6 },
        { type: 'note', emoji: '🌡️', text: 'La dentición no da fiebre alta.', sub: 'Una fiebre de 38 °C o más tiene otra causa. Consúltala con el médico.', dur: 2.8 },
        { type: 'source', plural: true, text: 'American Academy of Pediatric Dentistry, American Academy of Pediatrics', disclaimer: 'Son rangos habituales, no una norma.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Cada diente con su fecha, anotado', dur: 2.8 },
      ],
    },
    {
      slug: '09-tos-perruna',
      frames: [
        { type: 'hook', kicker: 'Tos por la noche', title: '¿Tos como el ladrido de un perro?', sub: 'Suele ser crup, una inflamación de la laringe', dur: 2.2 },
        { type: 'note', emoji: '🐕', text: 'Tos perruna y ronquera', sub: 'Suele empeorar por la noche.', dur: 2.4 },
        { type: 'note', emoji: '🤗', text: 'Calma al niño y mantenlo erguido.', sub: 'El llanto empeora la dificultad para respirar.', dur: 2.6 },
        { type: 'list', heading: 'Llama al 112 si:', numbered: true, items: ['Ruido agudo al inspirar, incluso en reposo', 'La piel se hunde entre las costillas', 'Labios azulados o piel muy pálida', 'Babea y no puede tragar'], durs: [1.8, 1.8, 1.7, 2.6] },
        { type: 'note', emoji: '🩺', text: 'Si no, llama al pediatra.', sub: 'Sobre todo si aparece fiebre.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, American Academy of Pediatrics', disclaimer: 'Este vídeo no sustituye a un médico.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Episodios de tos anotados para el médico', dur: 2.8 },
      ],
    },
    {
      slug: '10-alimentacion-complementaria',
      frames: [
        { type: 'hook', kicker: 'Alimentación complementaria', title: '¿Cuándo empezar con sólidos?', sub: 'Según la OMS y los pediatras', dur: 2.2 },
        { type: 'card', kicker: 'Alimentación complementaria', label: 'Normalmente', value: 'hacia 6 meses', action: 'Nunca antes de los 4 meses', tone: 'good', dur: 2.6 },
        { type: 'list', heading: 'Señales de que está listo', numbered: true, items: ['Se sienta con apoyo', 'Sostiene bien la cabeza', 'Muestra interés por la comida', 'No empuja la cuchara con la lengua'], durs: [1.3, 1.3, 1.3, 2.2] },
        { type: 'note', emoji: '🍯', text: 'Nada de miel antes de los 12 meses.', sub: 'Riesgo de botulismo.', dur: 2.2 },
        { type: 'note', emoji: '🥕', text: 'Alimentos nuevos de uno en uno, cada 3-4 días.', sub: 'Así es más fácil detectar alergias.', dur: 2.4 },
        { type: 'source', plural: true, text: 'OMS, ESPGHAN, American Academy of Pediatrics', disclaimer: 'Decide el momento con tu pediatra.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Alimentos nuevos y reacciones anotados', dur: 2.8 },
      ],
    },
  ],
}
