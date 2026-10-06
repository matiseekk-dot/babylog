// scripts/shorts-batch4.mjs
//
// Czwarta paczka Shorts (2026-10-06): to, co nas wyróżnia w trybie ciąży.
// Inne aplikacje ciążowe są dla mamy; u nas oboje rodzice widzą to samo na
// swoich telefonach (torba, skurcze), a po porodzie ta sama apka prowadzi dalej.
// Klatka "duo": dwa telefony obok siebie (ona i on).
// Wspólne konto jest w Premium, dlatego filmy mówią o tym wprost (płaci jedna osoba, 14 dni za darmo).
// Ruchy dziecka zgodnie z NHS i RCOG (Green-top 57): bez normy liczbowej,
// słabsze ruchy = telefon od razu, bez domowego detektora tętna.
// Zrzuty: store-assets/screenshots-preg (pregnancy-shots.mjs) i screenshots-2026-09 (01-today).
//
// Run: SHORTS_BATCH=4 FFMPEG_PATH=... node scripts/build-shorts.mjs [pl] [slug...]

const BAG = ['preg-bag-before', 'preg-bag-before']
const BAG2 = ['preg-bag-after', 'preg-bag-after']
const CONTR = ['preg-contractions', 'preg-contractions']
const LIFE = ['preg-home', '01-today']

export const VIDEOS = {
  pl: [
    {
      slug: '17-torba-we-dwoje',
      frames: [
        { type: 'hook', kicker: 'Ciąża we dwoje', title: 'Kto pakuje torbę do szpitala?', sub: 'U nas oboje, każde na swoim telefonie', dur: 2.4 },
        { type: 'duo', caption: 'Jedna lista na dwa telefony', shots: BAG, labels: ['👩 Ona', '👨 On'], dur: 2.4 },
        { type: 'duo', caption: 'On odhacza ładowarkę. Ona widzi to od razu.', shots: BAG2, labels: ['👩 Ona', '👨 On'], badge: '✓ Zsynchronizowane', dur: 3.0 },
        { type: 'note', emoji: '👫', text: 'Wspólne konto: płaci jedna osoba', sub: 'Premium działa u obojga. 14 dni za darmo.', dur: 2.4 },
        { type: 'note', emoji: '🧸', text: 'Wyprawka też do odhaczenia', sub: 'Bez gadżetów, z zasadami bezpiecznego snu.', dur: 2.2 },
        { type: 'end', shot: 'preg-bag-after', headline: 'Ciąża we dwoje: torba, wyprawka, skurcze', dur: 2.8 },
      ],
    },
    {
      slug: '18-skurcze-we-dwoje',
      frames: [
        { type: 'hook', kicker: 'Poród się zaczyna', title: 'Skurcze się zaczęły, a on w pracy?', sub: 'Widzi każdy skurcz na swoim telefonie', dur: 2.4 },
        { type: 'duo', caption: 'Ona dotyka przycisku. On widzi wszystko.', shots: CONTR, labels: ['👩 Ona, w domu', '👨 On, w pracy'], dur: 3.0 },
        { type: 'note', emoji: '⏱️', text: 'Czas i odstępy liczą się same', sub: 'Bez kartki i stopera w drugiej ręce.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Kiedy jechać, ustalcie z położną', sub: 'Wody, krwawienie, słabsze ruchy: dzwońcie od razu.', dur: 2.8 },
        { type: 'end', shot: 'preg-contractions', headline: 'Licznik skurczy dla was obojga', dur: 2.8 },
      ],
    },
    {
      slug: '19-ruchy-dziecka',
      frames: [
        { type: 'hook', kicker: 'Ciąża, 3. trymestr', title: 'Ile ruchów dziecka to norma?', sub: 'Co mówią położne', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Nie ma jednej normy dla wszystkich', sub: 'Liczy się zwykły rytm Twojego dziecka.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Słabsze lub rzadsze ruchy? Dzwoń od razu', sub: 'Nie czekaj do jutra.', tone: 'urgent', dur: 2.6 },
        { type: 'note', emoji: '🚫', text: 'Nie słuchaj tętna domowym detektorem', sub: 'Może fałszywie uspokoić.', dur: 2.4 },
        { type: 'note', emoji: '🛌', text: 'Pod koniec ciąży ruchy nie słabną', sub: 'Mniej miejsca, ale rusza się tak samo często.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, RCOG', disclaimer: 'Ten film nie zastępuje położnej ani lekarza.', dur: 2.2 },
        { type: 'end', shot: 'preg-kicks', headline: 'Dziennik ruchów bez normy do wyrobienia', dur: 2.8 },
      ],
    },
    {
      slug: '20-od-ciazy-do-roczku',
      frames: [
        { type: 'hook', kicker: 'Jedna aplikacja', title: 'Po porodzie kolejna apka?', sub: 'Nie musisz niczego przenosić', dur: 2.2 },
        { type: 'duo', caption: 'Jeden przycisk: „Urodziło się!”', shots: LIFE, labels: ['🤰 W ciąży', '👶 Po porodzie'], dur: 3.0 },
        { type: 'note', emoji: '🎁', text: '14 dni Premium w prezencie', sub: 'Na pierwsze tygodnie z maluszkiem.', dur: 2.2 },
        { type: 'note', emoji: '👫', text: 'Karmienia, sen i pieluchy we dwoje', sub: 'Każde na swoim telefonie, na bieżąco.', dur: 2.4 },
        { type: 'note', emoji: '💳', text: 'Albo płacisz raz, na zawsze', sub: '249 zł: ciąża i całe niemowlęctwo, bez subskrypcji.', dur: 2.6 },
        { type: 'end', shot: '01-today', headline: 'Od testu ciążowego do pierwszych urodzin', dur: 2.8 },
      ],
    },
  ],

  en: [
    {
      slug: '17-hospital-bag-together',
      frames: [
        { type: 'hook', kicker: 'Pregnancy, together', title: 'Who packs the hospital bag?', sub: 'Both of you, each on your own phone', dur: 2.4 },
        { type: 'duo', caption: 'One list on two phones', shots: BAG, labels: ['👩 She', '👨 He'], dur: 2.4 },
        { type: 'duo', caption: 'He ticks off the charger. She sees it right away.', shots: BAG2, labels: ['👩 She', '👨 He'], badge: '✓ In sync', dur: 3.0 },
        { type: 'note', emoji: '👫', text: 'Shared account: one person pays', sub: 'Premium works for both of you. 14 days free.', dur: 2.4 },
        { type: 'note', emoji: '🧸', text: 'Baby essentials to tick off too', sub: 'No gadgets, safe sleep rules included.', dur: 2.2 },
        { type: 'end', shot: 'preg-bag-after', headline: 'Pregnancy together: bag, essentials, contractions', dur: 2.8 },
      ],
    },
    {
      slug: '18-contractions-together',
      frames: [
        { type: 'hook', kicker: 'Labour is starting', title: 'Contractions started and he is at work?', sub: 'He sees every one on his phone', dur: 2.4 },
        { type: 'duo', caption: 'She taps the button. He sees everything.', shots: CONTR, labels: ['👩 She, at home', '👨 He, at work'], dur: 3.0 },
        { type: 'note', emoji: '⏱️', text: 'Length and gaps add up by themselves', sub: 'No paper, no stopwatch in your other hand.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'When to go in: ask your midwife', sub: 'Waters, bleeding, fewer movements: call straight away.', dur: 2.8 },
        { type: 'end', shot: 'preg-contractions', headline: 'A contraction timer for both of you', dur: 2.8 },
      ],
    },
    {
      slug: '19-baby-movements',
      frames: [
        { type: 'hook', kicker: 'Pregnancy, third trimester', title: 'How many baby kicks are normal?', sub: 'What midwives actually say', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'There is no set number for everyone', sub: 'What matters is your baby’s usual pattern.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Weaker or fewer movements? Call now', sub: 'Do not wait until tomorrow.', tone: 'urgent', dur: 2.6 },
        { type: 'note', emoji: '🚫', text: 'Skip home heartbeat monitors', sub: 'They can falsely reassure you.', dur: 2.4 },
        { type: 'note', emoji: '🛌', text: 'Babies do not move less near the end', sub: 'Less room, but they move just as often.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, RCOG', disclaimer: 'This video does not replace your midwife or doctor.', dur: 2.2 },
        { type: 'end', shot: 'preg-kicks', headline: 'A movement diary with no number to hit', dur: 2.8 },
      ],
    },
    {
      slug: '20-pregnancy-to-first-birthday',
      frames: [
        { type: 'hook', kicker: 'One app', title: 'A new app after the birth?', sub: 'No need to move anything', dur: 2.2 },
        { type: 'duo', caption: 'One button: “Baby is born!”', shots: LIFE, labels: ['🤰 Pregnant', '👶 After birth'], dur: 3.0 },
        { type: 'note', emoji: '🎁', text: '14 days of Premium as a gift', sub: 'For your first weeks with the baby.', dur: 2.2 },
        { type: 'note', emoji: '👫', text: 'Feeds, sleep and nappies, together', sub: 'Each on your own phone, in real time.', dur: 2.4 },
        { type: 'note', emoji: '💳', text: 'Or pay once, for good', sub: 'One-time option, no subscription.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'From the pregnancy test to the first birthday', dur: 2.8 },
      ],
    },
  ],

  de: [
    {
      slug: '17-kliniktasche-zu-zweit',
      frames: [
        { type: 'hook', kicker: 'Schwanger zu zweit', title: 'Wer packt die Kliniktasche?', sub: 'Ihr beide, jeder auf seinem Handy', dur: 2.4 },
        { type: 'duo', caption: 'Eine Liste auf zwei Handys', shots: BAG, labels: ['👩 Sie', '👨 Er'], dur: 2.4 },
        { type: 'duo', caption: 'Er hakt das Ladekabel ab. Sie sieht es sofort.', shots: BAG2, labels: ['👩 Sie', '👨 Er'], badge: '✓ Synchron', dur: 3.0 },
        { type: 'note', emoji: '👫', text: 'Gemeinsames Konto: einer zahlt', sub: 'Premium gilt für beide. 14 Tage gratis.', dur: 2.4 },
        { type: 'note', emoji: '🧸', text: 'Auch die Erstausstattung zum Abhaken', sub: 'Ohne Schnickschnack, mit Regeln für sicheren Schlaf.', dur: 2.2 },
        { type: 'end', shot: 'preg-bag-after', headline: 'Schwanger zu zweit: Tasche, Ausstattung, Wehen', dur: 2.8 },
      ],
    },
    {
      slug: '18-wehen-zu-zweit',
      frames: [
        { type: 'hook', kicker: 'Die Geburt beginnt', title: 'Wehen, und er ist im Büro?', sub: 'Er sieht jede Wehe auf seinem Handy', dur: 2.4 },
        { type: 'duo', caption: 'Sie tippt. Er sieht alles.', shots: CONTR, labels: ['👩 Sie, zu Hause', '👨 Er, im Büro'], dur: 3.0 },
        { type: 'note', emoji: '⏱️', text: 'Dauer und Abstände rechnen sich selbst', sub: 'Ohne Zettel und Stoppuhr.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Wann in die Klinik? Mit der Hebamme klären', sub: 'Fruchtwasser, Blutung, weniger Bewegungen: sofort anrufen.', dur: 2.8 },
        { type: 'end', shot: 'preg-contractions', headline: 'Wehen-Timer für euch beide', dur: 2.8 },
      ],
    },
    {
      slug: '19-kindsbewegungen',
      frames: [
        { type: 'hook', kicker: 'Schwangerschaft, 3. Trimester', title: 'Wie viele Tritte sind normal?', sub: 'Was Hebammen wirklich sagen', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Es gibt keine feste Zahl für alle', sub: 'Wichtig ist der übliche Rhythmus Ihres Babys.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Schwächere Bewegungen? Sofort anrufen', sub: 'Auch wenn sie seltener sind. Nicht bis morgen warten.', tone: 'urgent', dur: 2.6 },
        { type: 'note', emoji: '🚫', text: 'Kein Heim-Doppler für die Herztöne', sub: 'Er kann falsch beruhigen.', dur: 2.4 },
        { type: 'note', emoji: '🛌', text: 'Am Ende bewegen sich Babys nicht weniger', sub: 'Weniger Platz, aber genauso oft.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, RCOG', disclaimer: 'Dieses Video ersetzt keine Hebamme und keinen Arzt.', dur: 2.2 },
        { type: 'end', shot: 'preg-kicks', headline: 'Bewegungstagebuch ohne Soll-Zahl', dur: 2.8 },
      ],
    },
    {
      slug: '20-schwangerschaft-bis-geburtstag',
      frames: [
        { type: 'hook', kicker: 'Eine App', title: 'Nach der Geburt eine neue App?', sub: 'Sie müssen nichts übertragen', dur: 2.2 },
        { type: 'duo', caption: 'Ein Knopf: „Baby ist geboren!“', shots: LIFE, labels: ['🤰 Schwanger', '👶 Nach der Geburt'], dur: 3.0 },
        { type: 'note', emoji: '🎁', text: '14 Tage Premium geschenkt', sub: 'Für die ersten Wochen mit dem Baby.', dur: 2.2 },
        { type: 'note', emoji: '👫', text: 'Stillen, Schlaf und Windeln zu zweit', sub: 'Jeder auf seinem Handy, in Echtzeit.', dur: 2.4 },
        { type: 'note', emoji: '💳', text: 'Oder einmal zahlen, für immer', sub: 'Einmalkauf möglich, kein Abo nötig.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Vom Schwangerschaftstest bis zum ersten Geburtstag', dur: 2.8 },
      ],
    },
  ],

  fr: [
    {
      slug: '17-valise-a-deux',
      frames: [
        { type: 'hook', kicker: 'Grossesse à deux', title: 'Qui prépare la valise de maternité ?', sub: 'Vous deux, chacun sur son téléphone', dur: 2.4 },
        { type: 'duo', caption: 'Une liste sur deux téléphones', shots: BAG, labels: ['👩 Elle', '👨 Lui'], dur: 2.4 },
        { type: 'duo', caption: 'Il coche le chargeur. Elle le voit tout de suite.', shots: BAG2, labels: ['👩 Elle', '👨 Lui'], badge: '✓ Synchronisé', dur: 3.0 },
        { type: 'note', emoji: '👫', text: 'Compte partagé : une seule personne paie', sub: 'Premium marche pour vous deux. 14 jours gratuits.', dur: 2.4 },
        { type: 'note', emoji: '🧸', text: 'La liste de naissance aussi', sub: 'Sans gadgets, avec les règles du sommeil sûr.', dur: 2.2 },
        { type: 'end', shot: 'preg-bag-after', headline: 'Grossesse à deux : valise, liste, contractions', dur: 2.8 },
      ],
    },
    {
      slug: '18-contractions-a-deux',
      frames: [
        { type: 'hook', kicker: 'Le travail commence', title: 'Les contractions commencent et il est au travail ?', sub: 'Il les voit toutes sur son téléphone', dur: 2.4 },
        { type: 'duo', caption: 'Elle appuie. Il voit tout.', shots: CONTR, labels: ['👩 Elle, chez elle', '👨 Lui, au travail'], dur: 3.0 },
        { type: 'note', emoji: '⏱️', text: 'Durée et intervalles calculés tout seuls', sub: 'Sans papier ni chrono.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Quand partir ? Voyez-le avec votre sage-femme', sub: 'Perte des eaux, saignement, moins de mouvements : appelez tout de suite.', dur: 2.8 },
        { type: 'end', shot: 'preg-contractions', headline: 'Un compteur de contractions pour vous deux', dur: 2.8 },
      ],
    },
    {
      slug: '19-mouvements-du-bebe',
      frames: [
        { type: 'hook', kicker: 'Grossesse, 3e trimestre', title: 'Combien de mouvements, c’est normal ?', sub: 'Ce que disent les sages-femmes', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'Pas de chiffre valable pour toutes', sub: 'Ce qui compte, c’est le rythme habituel de votre bébé.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Mouvements plus faibles ? Appelez', sub: 'Ou plus rares. N’attendez pas le lendemain.', tone: 'urgent', dur: 2.6 },
        { type: 'note', emoji: '🚫', text: 'Pas de doppler à la maison', sub: 'Il peut rassurer à tort.', dur: 2.4 },
        { type: 'note', emoji: '🛌', text: 'Bébé ne bouge pas moins à la fin', sub: 'Moins de place, mais autant de mouvements.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, RCOG', disclaimer: 'Cette vidéo ne remplace pas votre sage-femme ni votre médecin.', dur: 2.2 },
        { type: 'end', shot: 'preg-kicks', headline: 'Un journal des mouvements, sans chiffre à atteindre', dur: 2.8 },
      ],
    },
    {
      slug: '20-grossesse-premier-anniversaire',
      frames: [
        { type: 'hook', kicker: 'Une seule appli', title: 'Une nouvelle appli après la naissance ?', sub: 'Rien à transférer', dur: 2.2 },
        { type: 'duo', caption: 'Un seul bouton : « Bébé est né ! »', shots: LIFE, labels: ['🤰 Enceinte', '👶 Après la naissance'], dur: 3.0 },
        { type: 'note', emoji: '🎁', text: '14 jours de Premium offerts', sub: 'Pour vos premières semaines avec bébé.', dur: 2.2 },
        { type: 'note', emoji: '👫', text: 'Tétées, sommeil et couches, à deux', sub: 'Chacun sur son téléphone, en temps réel.', dur: 2.4 },
        { type: 'note', emoji: '💳', text: 'Ou payez une fois, pour toujours', sub: 'Option à vie, sans abonnement.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Du test de grossesse au premier anniversaire', dur: 2.8 },
      ],
    },
  ],

  es: [
    {
      slug: '17-bolsa-en-pareja',
      frames: [
        { type: 'hook', kicker: 'Embarazo en pareja', title: '¿Quién prepara la bolsa del hospital?', sub: 'Los dos, cada uno en su móvil', dur: 2.4 },
        { type: 'duo', caption: 'Una lista en dos móviles', shots: BAG, labels: ['👩 Ella', '👨 Él'], dur: 2.4 },
        { type: 'duo', caption: 'Él marca el cargador. Ella lo ve al instante.', shots: BAG2, labels: ['👩 Ella', '👨 Él'], badge: '✓ Sincronizado', dur: 3.0 },
        { type: 'note', emoji: '👫', text: 'Cuenta compartida: paga una persona', sub: 'Premium funciona para los dos. 14 días gratis.', dur: 2.4 },
        { type: 'note', emoji: '🧸', text: 'La canastilla también', sub: 'Sin cacharros, con las normas de sueño seguro.', dur: 2.2 },
        { type: 'end', shot: 'preg-bag-after', headline: 'Embarazo en pareja: bolsa, canastilla, contracciones', dur: 2.8 },
      ],
    },
    {
      slug: '18-contracciones-en-pareja',
      frames: [
        { type: 'hook', kicker: 'Empieza el parto', title: '¿Contracciones y él en el trabajo?', sub: 'Las ve todas en su móvil', dur: 2.4 },
        { type: 'duo', caption: 'Ella toca el botón. Él lo ve todo.', shots: CONTR, labels: ['👩 Ella, en casa', '👨 Él, trabajando'], dur: 3.0 },
        { type: 'note', emoji: '⏱️', text: 'Duración e intervalos, automáticos', sub: 'Sin papel ni cronómetro.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: 'Cuándo ir: háblalo con tu matrona', sub: 'Rotura de bolsa, sangrado, menos movimientos: llama enseguida.', dur: 2.8 },
        { type: 'end', shot: 'preg-contractions', headline: 'Un contador de contracciones para los dos', dur: 2.8 },
      ],
    },
    {
      slug: '19-movimientos-del-bebe',
      frames: [
        { type: 'hook', kicker: 'Embarazo, tercer trimestre', title: '¿Cuántos movimientos son normales?', sub: 'Lo que dicen las matronas', dur: 2.2 },
        { type: 'note', emoji: '👶', text: 'No hay una cifra igual para todas', sub: 'Lo que importa es el ritmo habitual de tu bebé.', dur: 2.4 },
        { type: 'note', emoji: '📞', text: '¿Se mueve menos? Llama ya', sub: 'O más débil de lo habitual. No esperes al día siguiente.', tone: 'urgent', dur: 2.6 },
        { type: 'note', emoji: '🚫', text: 'Nada de doppler en casa', sub: 'Puede tranquilizarte en falso.', dur: 2.4 },
        { type: 'note', emoji: '🛌', text: 'Al final no se mueve menos', sub: 'Tiene menos espacio, pero se mueve igual de a menudo.', dur: 2.4 },
        { type: 'source', plural: true, text: 'NHS, RCOG', disclaimer: 'Este vídeo no sustituye a tu matrona ni a tu médico.', dur: 2.2 },
        { type: 'end', shot: 'preg-kicks', headline: 'Un diario de movimientos sin cifra que alcanzar', dur: 2.8 },
      ],
    },
    {
      slug: '20-embarazo-primer-cumple',
      frames: [
        { type: 'hook', kicker: 'Una sola app', title: '¿Otra app después del parto?', sub: 'No tienes que pasar nada', dur: 2.2 },
        { type: 'duo', caption: 'Un botón: «¡Ha nacido!»', shots: LIFE, labels: ['🤰 Embarazada', '👶 Tras el parto'], dur: 3.0 },
        { type: 'note', emoji: '🎁', text: '14 días de Premium de regalo', sub: 'Para tus primeras semanas con el bebé.', dur: 2.2 },
        { type: 'note', emoji: '👫', text: 'Tomas, sueño y pañales, en pareja', sub: 'Cada uno en su móvil, al momento.', dur: 2.4 },
        { type: 'note', emoji: '💳', text: 'O paga una vez, para siempre', sub: 'Opción de pago único, sin suscripción.', dur: 2.4 },
        { type: 'end', shot: '01-today', headline: 'Del test de embarazo al primer cumpleaños', dur: 2.8 },
      ],
    },
  ],
}
