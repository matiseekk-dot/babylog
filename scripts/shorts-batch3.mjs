// scripts/shorts-batch3.mjs
//
// Trzecia paczka Shorts (2026-10-05): ciąża, pod nowe narzędzia na skudev.pl.
// Format jak paczka 2 (pytanie na pierwszej klatce, ok. 15 s), który dał
// 1700 wyświetleń w kilka godzin (temperatura EN/ES).
// Treść zgodna z poradnikiem i kalkulatorem na skudev.pl (content/pregnancy.mjs,
// exams-pl.mjs, benefits-pl.mjs). Francja: termin 41 SA (287 dni, CNGOF).
// Na końcu telefon z trybem ciąży: store-assets/screenshots-preg (pregnancy-shots.mjs).
//
// Run: SHORTS_BATCH=3 FFMPEG_PATH=... node scripts/build-shorts.mjs [pl] [slug...]

export const VIDEOS = {
  pl: [
    {
      slug: '11-termin-porodu',
      frames: [
        { type: 'hook', kicker: 'Ciąża', title: 'Kiedy urodzi się Twoje dziecko?', sub: 'Termin porodu policzysz w 10 sekund', dur: 2.2 },
        { type: 'note', emoji: '📅', text: 'Pierwszy dzień ostatniej miesiączki + 280 dni', sub: 'Tak liczą lekarze (reguła Naegelego).', dur: 2.6 },
        { type: 'card', kicker: 'Przykład', label: 'Ostatnia miesiączka 1 stycznia 2026', value: '8.10.2026', action: 'termin porodu', tone: 'good', dur: 2.6 },
        { type: 'note', emoji: '🩻', text: 'Termin z USG jest dokładniejszy', sub: 'Najlepiej z badania w 1. trymestrze.', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'W dniu terminu rodzi się mało dzieci', sub: 'Poród o czasie to 37. do 42. tydzień.', dur: 2.4 },
        { type: 'source', plural: true, text: 'ACOG, WHO', disclaimer: 'Kalkulator terminu znajdziesz na skudev.pl.', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Tydzień ciąży liczy się sam, codziennie', dur: 2.8 },
      ],
    },
    {
      slug: '12-torba-do-szpitala',
      frames: [
        { type: 'hook', kicker: 'Ciąża, około 36. tygodnia', title: 'Torba do szpitala: o tym zapominasz', sub: '3 rzeczy, których brakuje najczęściej', dur: 2.2 },
        { type: 'list', heading: 'Najczęściej zapominane', numbered: true, items: ['Ładowarka z długim kablem', 'Ubranko na wyjście dla dziecka', 'Fotelik samochodowy w aucie'], durs: [1.8, 1.8, 2.4] },
        { type: 'note', emoji: '📄', text: 'Dokumenty na wierzchu', sub: 'Dowód, karta ciąży i wyniki badań.', dur: 2.2 },
        { type: 'note', emoji: '🗓️', text: 'Spakuj się około 36. tygodnia', sub: 'Poród może zacząć się wcześniej, niż myślisz.', dur: 2.4 },
        { type: 'source', plural: false, text: 'NHS', disclaimer: 'Każdy szpital ma swoją listę. Pełna lista: skudev.pl.', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Tydzień ciąży i licznik skurczy w jednym miejscu', dur: 2.8 },
      ],
    },
    {
      slug: '13-jedz-od-razu',
      frames: [
        { type: 'hook', kicker: 'Zapisz, oby się nie przydało', title: 'Kiedy jechać do szpitala od razu?', sub: '5 sygnałów w ciąży, z którymi nie czekasz', dur: 2.2 },
        { type: 'list', heading: 'Jedź od razu albo dzwoń, gdy:', numbered: true, items: ['Odejdą wody, zwłaszcza zielone', 'Pojawi się krwawienie', 'Dziecko rusza się słabiej niż zwykle', 'Skurcze przed 37. tygodniem', 'Silny ból głowy albo mroczki'], durs: [1.6, 1.6, 1.7, 1.6, 2.4] },
        { type: 'note', emoji: '⏱️', text: 'Skurcze? Zapytaj położną o swoją zasadę', sub: 'Często: regularnie co około 5 minut przez godzinę.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Ten film nie zastępuje lekarza ani położnej.', dur: 2.4 },
        { type: 'end', shot: 'preg-contractions', headline: 'Licznik skurczy jednym przyciskiem', dur: 2.8 },
      ],
    },
    {
      slug: '14-mity-o-plci',
      frames: [
        { type: 'hook', kicker: 'Chłopiec czy dziewczynka?', title: 'Kształt brzucha zdradza płeć?', sub: '3 mity, które słyszy każda ciężarna', dur: 2.2 },
        { type: 'card', kicker: 'Mit 1', label: 'Spiczasty brzuch to chłopiec', value: 'MIT', action: 'Kształt brzucha zależy od mięśni i ułożenia dziecka.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Mit 2', label: 'Tętno ponad 140 to dziewczynka', value: 'MIT', action: 'Badania nie widzą różnicy w tętnie chłopców i dziewczynek.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Mit 3', label: 'Ochota na słodkie to dziewczynka', value: 'MIT', action: 'Zachcianki nie mają związku z płcią dziecka.', tone: 'consult', dur: 2.4 },
        { type: 'note', emoji: '🩺', text: 'Płeć pewnie pokaże USG albo badanie krwi', sub: 'USG połówkowe około 20. tygodnia, test z krwi wcześniej.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Mity to zabawa, nie metoda.', dur: 2.2 },
        { type: 'end', shot: 'preg-home', headline: 'Ogłoś ciążę bliskim gotową kartą', dur: 2.8 },
      ],
    },
    {
      slug: '15-badania-w-ciazy',
      frames: [
        { type: 'hook', kicker: 'Ciąża 2026', title: 'Jakie badania w którym tygodniu?', sub: 'Według nowego standardu opieki okołoporodowej', dur: 2.2 },
        { type: 'list', heading: 'Najważniejsze terminy', pairs: true, items: [['Badania krwi', 'do 10. tyg.'], ['USG 1. trymestru', '11-14 tyg.'], ['USG połówkowe', '18-22 tyg.'], ['Test z glukozą', '24-28 tyg.'], ['Posiew GBS', '35-37 tyg.']], durs: [1.4, 1.4, 1.4, 1.4, 2.2] },
        { type: 'note', emoji: '📅', text: 'Cały harmonogram do kalendarza', sub: 'Wpisz termin porodu na skudev.pl i pobierz plik.', dur: 2.4 },
        { type: 'source', plural: false, text: 'Standard opieki okołoporodowej, Dz.U. 2026 poz. 1140', disclaimer: 'Lekarz może zlecić inne lub dodatkowe badania.', dur: 2.6 },
        { type: 'end', shot: 'preg-exams', headline: 'Badania do odhaczenia w aplikacji', dur: 2.8 },
      ],
    },
    {
      slug: '16-zasilek-81-procent',
      frames: [
        { type: 'hook', kicker: 'Zasiłek macierzyński 2026', title: '81,5% czy 100% i 70%?', sub: 'Który wariant bardziej się opłaca', dur: 2.2 },
        { type: 'note', emoji: '✍️', text: 'Wniosek w ciągu 21 dni od porodu', sub: '81,5% przez cały okres urlopu.', dur: 2.4 },
        { type: 'note', emoji: '📉', text: 'Bez wniosku: 100%, potem 70%', sub: '100% przez 20 tygodni, później 70%.', dur: 2.4 },
        { type: 'card', kicker: 'Przykład: pensja 7000 zł brutto', label: 'Łącznie przez rok', value: '≈ 59 700 zł', action: 'w obu wariantach', foot: 'Różni się tylko rozłożenie w czasie', tone: 'good', dur: 2.8 },
        { type: 'note', emoji: '👨', text: '9 tygodni tylko dla drugiego rodzica', sub: 'Płatne 70% jego podstawy.', dur: 2.2 },
        { type: 'source', plural: true, text: 'Ustawa zasiłkowa, Kodeks pracy', disclaimer: 'Swój zasiłek policzysz na skudev.pl.', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Tryb ciąży: tydzień, skurcze i badania', dur: 2.8 },
      ],
    },
  ],

  en: [
    {
      slug: '11-due-date-in-10-seconds',
      frames: [
        { type: 'hook', kicker: 'Pregnancy', title: 'When will your baby arrive?', sub: 'Work out your due date in 10 seconds', dur: 2.2 },
        { type: 'note', emoji: '📅', text: 'First day of your last period + 280 days', sub: 'That is how doctors count (Naegele’s rule).', dur: 2.6 },
        { type: 'card', kicker: 'Example', label: 'Last period: 1 January 2026', value: '8 Oct 2026', action: 'due date', tone: 'good', dur: 2.6 },
        { type: 'note', emoji: '🩻', text: 'An ultrasound due date is more accurate', sub: 'Especially from a first-trimester scan.', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Few babies arrive on the due date', sub: 'Birth between 37 and 42 weeks is on time.', dur: 2.4 },
        { type: 'source', plural: true, text: 'ACOG, WHO', disclaimer: 'Due date calculator: skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Your pregnancy week, updated every day', dur: 2.8 },
      ],
    },
    {
      slug: '12-hospital-bag-forgotten',
      frames: [
        { type: 'hook', kicker: 'Pregnancy, around 36 weeks', title: 'Hospital bag: what people forget', sub: 'The 3 things most often missing', dur: 2.2 },
        { type: 'list', heading: 'Most often forgotten', numbered: true, items: ['Phone charger with a long cable', 'Going-home outfit for the baby', 'Car seat fitted in the car'], durs: [1.8, 1.8, 2.4] },
        { type: 'note', emoji: '📄', text: 'Documents on top', sub: 'Your maternity notes and test results.', dur: 2.2 },
        { type: 'note', emoji: '🗓️', text: 'Pack by about 36 weeks', sub: 'Labour can start earlier than you think.', dur: 2.4 },
        { type: 'source', plural: false, text: 'NHS', disclaimer: 'Every hospital has its own list. Full checklist: skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Pregnancy week and contraction timer in one place', dur: 2.8 },
      ],
    },
    {
      slug: '13-go-to-hospital-now',
      frames: [
        { type: 'hook', kicker: 'Save this, hope you never need it', title: 'When to go to hospital straight away', sub: '5 pregnancy signs not to wait on', dur: 2.2 },
        { type: 'list', heading: 'Call or go now if:', numbered: true, items: ['Your waters break, especially if green', 'You have bleeding', 'Baby moves less than usual', 'Contractions before 37 weeks', 'Severe headache or blurred vision'], durs: [1.6, 1.6, 1.7, 1.6, 2.4] },
        { type: 'note', emoji: '⏱️', text: 'Contractions? Ask your midwife for your rule', sub: 'Often: regular, about every 5 minutes, for an hour.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'This video does not replace your doctor or midwife.', dur: 2.4 },
        { type: 'end', shot: 'preg-contractions', headline: 'Contraction timer with one button', dur: 2.8 },
      ],
    },
    {
      slug: '14-bump-shape-myths',
      frames: [
        { type: 'hook', kicker: 'Boy or girl?', title: 'Does your bump shape reveal the sex?', sub: '3 myths every pregnant woman hears', dur: 2.2 },
        { type: 'card', kicker: 'Myth 1', label: 'Pointy bump means a boy', value: 'MYTH', action: 'Bump shape depends on muscles and the baby’s position.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Myth 2', label: 'Heart rate over 140 means a girl', value: 'MYTH', action: 'Studies find no difference between boys and girls.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Myth 3', label: 'Sweet cravings mean a girl', value: 'MYTH', action: 'Cravings have nothing to do with the baby’s sex.', tone: 'consult', dur: 2.4 },
        { type: 'note', emoji: '🩺', text: 'An ultrasound or blood test can tell', sub: 'The 20-week scan, or a blood test earlier.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Myths are fun, not a method.', dur: 2.2 },
        { type: 'end', shot: 'preg-home', headline: 'Announce your pregnancy with a ready-made card', dur: 2.8 },
      ],
    },
  ],

  de: [
    {
      slug: '11-geburtstermin-in-10-sekunden',
      frames: [
        { type: 'hook', kicker: 'Schwangerschaft', title: 'Wann kommt Ihr Baby?', sub: 'Den Geburtstermin in 10 Sekunden berechnen', dur: 2.2 },
        { type: 'note', emoji: '📅', text: 'Erster Tag der letzten Periode + 280 Tage', sub: 'So rechnen Ärztinnen und Ärzte (Naegele-Regel).', dur: 2.6 },
        { type: 'card', kicker: 'Beispiel', label: 'Letzte Periode: 1. Januar 2026', value: '8.10.2026', action: 'Geburtstermin', tone: 'good', dur: 2.6 },
        { type: 'note', emoji: '🩻', text: 'Der Termin aus dem Ultraschall ist genauer', sub: 'Vor allem aus dem ersten Trimester.', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Nur wenige Babys kommen am Termin', sub: 'Eine Geburt zwischen der 37. und 42. Woche ist termingerecht.', dur: 2.4 },
        { type: 'source', plural: true, text: 'ACOG, WHO', disclaimer: 'Geburtstermin-Rechner: skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Die SSW zählt sich jeden Tag von selbst', dur: 2.8 },
      ],
    },
    {
      slug: '12-kliniktasche-vergessen',
      frames: [
        { type: 'hook', kicker: 'Schwangerschaft, um die 36. SSW', title: 'Kliniktasche: Das wird vergessen', sub: '3 Dinge, die am häufigsten fehlen', dur: 2.2 },
        { type: 'list', heading: 'Am häufigsten vergessen', numbered: true, items: ['Ladekabel, möglichst lang', 'Outfit fürs Baby für den Heimweg', 'Babyschale im Auto'], durs: [1.8, 1.8, 2.4] },
        { type: 'note', emoji: '📄', text: 'Dokumente obenauf', sub: 'Mutterpass, Versichertenkarte, Ausweis.', dur: 2.2 },
        { type: 'note', emoji: '🗓️', text: 'Bis zur 36. SSW packen', sub: 'Die Geburt kann früher beginnen als gedacht.', dur: 2.4 },
        { type: 'source', plural: false, text: 'NHS', disclaimer: 'Jede Klinik hat eine eigene Liste. Checkliste: skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'SSW und Wehen-Timer an einem Ort', dur: 2.8 },
      ],
    },
    {
      slug: '13-sofort-in-die-klinik',
      frames: [
        { type: 'hook', kicker: 'Speichern, hoffentlich nie gebraucht', title: 'Wann sofort in die Klinik?', sub: '5 Warnzeichen in der Schwangerschaft', dur: 2.2 },
        { type: 'list', heading: 'Sofort anrufen oder losfahren, wenn:', numbered: true, items: ['Die Fruchtblase platzt, vor allem grünlich', 'Blutungen auftreten', 'Das Baby sich weniger bewegt', 'Wehen vor der 37. SSW', 'Starke Kopfschmerzen oder Sehstörungen'], durs: [1.6, 1.6, 1.7, 1.6, 2.4] },
        { type: 'note', emoji: '⏱️', text: 'Wehen? Fragen Sie Ihre Hebamme', sub: 'Oft: regelmäßig etwa alle 5 Minuten, eine Stunde lang.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Dieses Video ersetzt weder Arzt noch Hebamme.', dur: 2.4 },
        { type: 'end', shot: 'preg-contractions', headline: 'Wehen-Timer mit einem Knopf', dur: 2.8 },
      ],
    },
    {
      slug: '14-bauchform-mythen',
      frames: [
        { type: 'hook', kicker: 'Junge oder Mädchen?', title: 'Verrät die Bauchform das Geschlecht?', sub: '3 Mythen, die jede Schwangere hört', dur: 2.2 },
        { type: 'card', kicker: 'Mythos 1', label: 'Spitzer Bauch heißt Junge', value: 'MYTHOS', action: 'Die Bauchform hängt von Muskeln und Lage des Babys ab.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Mythos 2', label: 'Herzschlag über 140 heißt Mädchen', value: 'MYTHOS', action: 'Studien finden keinen Unterschied zwischen Jungen und Mädchen.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Mythos 3', label: 'Lust auf Süßes heißt Mädchen', value: 'MYTHOS', action: 'Gelüste haben nichts mit dem Geschlecht zu tun.', tone: 'consult', dur: 2.4 },
        { type: 'note', emoji: '🩺', text: 'Sicher zeigen es Ultraschall oder Bluttest', sub: 'Beim Ultraschall um die 20. SSW, per Bluttest früher.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Mythen sind Spaß, keine Methode.', dur: 2.2 },
        { type: 'end', shot: 'preg-home', headline: 'Schwangerschaft mit fertiger Karte verkünden', dur: 2.8 },
      ],
    },
  ],

  fr: [
    {
      slug: '11-calcul-terme-10-secondes',
      frames: [
        { type: 'hook', kicker: 'Grossesse', title: 'Quand bébé va-t-il naître ?', sub: 'Calculez le terme en 10 secondes', dur: 2.2 },
        { type: 'note', emoji: '📅', text: 'Premier jour des dernières règles + 287 jours', sub: 'En France, le terme est fixé à 41 SA.', dur: 2.6 },
        { type: 'card', kicker: 'Exemple', label: 'Dernières règles : 1er janvier 2026', value: '15/10/2026', action: 'date prévue d’accouchement', tone: 'good', dur: 2.6 },
        { type: 'note', emoji: '🩻', text: 'Le terme de l’échographie est plus précis', sub: 'Surtout celui de l’écho du 1er trimestre.', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Peu de bébés naissent le jour du terme', sub: 'Une naissance entre 37 et 42 SA est à terme.', dur: 2.4 },
        { type: 'source', plural: true, text: 'CNGOF, OMS', disclaimer: 'Calculateur de terme : skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Les SA se comptent toutes seules, chaque jour', dur: 2.8 },
      ],
    },
    {
      slug: '12-valise-maternite-oublis',
      frames: [
        { type: 'hook', kicker: 'Grossesse, vers 36 SA', title: 'Valise de maternité : ce qu’on oublie', sub: 'Les 3 choses qui manquent le plus souvent', dur: 2.2 },
        { type: 'list', heading: 'Les plus oubliés', numbered: true, items: ['Chargeur avec un long câble', 'Tenue de sortie pour bébé', 'Siège auto dans la voiture'], durs: [1.8, 1.8, 2.4] },
        { type: 'note', emoji: '📄', text: 'Les papiers sur le dessus', sub: 'Carte Vitale, pièce d’identité, dossier de grossesse.', dur: 2.2 },
        { type: 'note', emoji: '🗓️', text: 'Préparez-la vers 36 SA', sub: 'Le travail peut commencer plus tôt que prévu.', dur: 2.4 },
        { type: 'source', plural: false, text: 'NHS', disclaimer: 'Chaque maternité a sa liste. Liste complète : skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'SA et minuteur de contractions au même endroit', dur: 2.8 },
      ],
    },
    {
      slug: '13-partir-maternite-tout-de-suite',
      frames: [
        { type: 'hook', kicker: 'À garder, en espérant ne jamais s’en servir', title: 'Quand partir tout de suite à la maternité ?', sub: '5 signes qui n’attendent pas', dur: 2.2 },
        { type: 'list', heading: 'Appelez ou partez si :', numbered: true, items: ['Perte des eaux, surtout verdâtres', 'Saignement', 'Bébé bouge moins que d’habitude', 'Contractions avant 37 SA', 'Fort mal de tête ou troubles de la vue'], durs: [1.6, 1.6, 1.7, 1.6, 2.4] },
        { type: 'note', emoji: '⏱️', text: 'Contractions ? Demandez la règle de votre maternité', sub: 'Souvent : toutes les 5 min depuis 2 h pour un 1er bébé.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Cette vidéo ne remplace pas votre médecin ou sage-femme.', dur: 2.4 },
        { type: 'end', shot: 'preg-contractions', headline: 'Minuteur de contractions en un seul bouton', dur: 2.8 },
      ],
    },
    {
      slug: '14-forme-ventre-idees-recues',
      frames: [
        { type: 'hook', kicker: 'Fille ou garçon ?', title: 'La forme du ventre révèle-t-elle le sexe ?', sub: '3 idées reçues que toute femme enceinte entend', dur: 2.2 },
        { type: 'card', kicker: 'Idée reçue 1', label: 'Ventre pointu, c’est un garçon', value: 'FAUX', action: 'La forme du ventre dépend des muscles et de la position de bébé.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Idée reçue 2', label: 'Cœur à plus de 140, c’est une fille', value: 'FAUX', action: 'Les études ne trouvent aucune différence entre filles et garçons.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Idée reçue 3', label: 'Envie de sucré, c’est une fille', value: 'FAUX', action: 'Les envies n’ont rien à voir avec le sexe du bébé.', tone: 'consult', dur: 2.4 },
        { type: 'note', emoji: '🩺', text: 'L’échographie ou une prise de sang le diront', sub: 'À l’écho du 2e trimestre, ou plus tôt par prise de sang.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Les idées reçues sont un jeu, pas une méthode.', dur: 2.2 },
        { type: 'end', shot: 'preg-home', headline: 'Annoncez la grossesse avec une carte prête', dur: 2.8 },
      ],
    },
  ],

  es: [
    {
      slug: '11-fecha-de-parto-10-segundos',
      frames: [
        { type: 'hook', kicker: 'Embarazo', title: '¿Cuándo nacerá tu bebé?', sub: 'Calcula la fecha de parto en 10 segundos', dur: 2.2 },
        { type: 'note', emoji: '📅', text: 'Primer día de la última regla + 280 días', sub: 'Así calculan los médicos (regla de Naegele).', dur: 2.6 },
        { type: 'card', kicker: 'Ejemplo', label: 'Última regla: 1 de enero de 2026', value: '8/10/2026', action: 'fecha probable de parto', tone: 'good', dur: 2.6 },
        { type: 'note', emoji: '🩻', text: 'La fecha de la ecografía es más precisa', sub: 'Sobre todo la del primer trimestre.', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Pocos bebés nacen justo en la fecha', sub: 'Nacer entre las semanas 37 y 42 es a término.', dur: 2.4 },
        { type: 'source', plural: true, text: 'ACOG, OMS', disclaimer: 'Calculadora de fecha de parto: skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'La semana de embarazo, actualizada cada día', dur: 2.8 },
      ],
    },
    {
      slug: '12-bolsa-hospital-olvidos',
      frames: [
        { type: 'hook', kicker: 'Embarazo, hacia la semana 36', title: 'Bolsa del hospital: lo que se olvida', sub: 'Las 3 cosas que más faltan', dur: 2.2 },
        { type: 'list', heading: 'Lo más olvidado', numbered: true, items: ['Cargador con cable largo', 'Ropa de salida del bebé', 'Silla de coche instalada'], durs: [1.8, 1.8, 2.4] },
        { type: 'note', emoji: '📄', text: 'Los documentos arriba', sub: 'DNI, tarjeta sanitaria y cartilla del embarazo.', dur: 2.2 },
        { type: 'note', emoji: '🗓️', text: 'Prepárala hacia la semana 36', sub: 'El parto puede empezar antes de lo que crees.', dur: 2.4 },
        { type: 'source', plural: false, text: 'NHS', disclaimer: 'Cada hospital tiene su lista. Lista completa: skudev.pl', dur: 2.4 },
        { type: 'end', shot: 'preg-home', headline: 'Semana de embarazo y contracciones en un solo lugar', dur: 2.8 },
      ],
    },
    {
      slug: '13-ir-al-hospital-ya',
      frames: [
        { type: 'hook', kicker: 'Guárdalo, ojalá no lo necesites', title: '¿Cuándo ir al hospital ya?', sub: '5 señales del embarazo que no esperan', dur: 2.2 },
        { type: 'list', heading: 'Llama o ve ya si:', numbered: true, items: ['Rompes aguas, sobre todo verdes', 'Tienes sangrado', 'El bebé se mueve menos', 'Contracciones antes de la semana 37', 'Dolor de cabeza fuerte o visión borrosa'], durs: [1.6, 1.6, 1.7, 1.6, 2.4] },
        { type: 'note', emoji: '⏱️', text: '¿Contracciones? Pregunta tu regla a la matrona', sub: 'A menudo: cada 5 minutos durante una hora.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Este vídeo no sustituye a tu médico ni a tu matrona.', dur: 2.4 },
        { type: 'end', shot: 'preg-contractions', headline: 'Contador de contracciones con un botón', dur: 2.8 },
      ],
    },
    {
      slug: '14-forma-barriga-mitos',
      frames: [
        { type: 'hook', kicker: '¿Niño o niña?', title: '¿La forma de la barriga revela el sexo?', sub: '3 mitos que escucha toda embarazada', dur: 2.2 },
        { type: 'card', kicker: 'Mito 1', label: 'Barriga en punta, niño', value: 'MITO', action: 'La forma depende de los músculos y la posición del bebé.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Mito 2', label: 'Latido de más de 140, niña', value: 'MITO', action: 'Los estudios no encuentran diferencia entre niños y niñas.', tone: 'consult', dur: 2.6 },
        { type: 'card', kicker: 'Mito 3', label: 'Antojo de dulce, niña', value: 'MITO', action: 'Los antojos no tienen que ver con el sexo del bebé.', tone: 'consult', dur: 2.4 },
        { type: 'note', emoji: '🩺', text: 'Lo dirán una ecografía o un análisis de sangre', sub: 'La ecografía de la semana 20, o antes con un análisis.', dur: 2.6 },
        { type: 'source', plural: true, text: 'NHS, ACOG', disclaimer: 'Los mitos son un juego, no un método.', dur: 2.2 },
        { type: 'end', shot: 'preg-home', headline: 'Anuncia el embarazo con una tarjeta lista', dur: 2.8 },
      ],
    },
  ],
}
