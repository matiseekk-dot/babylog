// Tydzień ciąży (v2.17.9): karta "Twój tydzień" w trybie ciąży.
// Klucz = pełne tygodnie (24+3 → 24), jak w podręcznikach ("w 24. tygodniu").
// Na każdy tydzień: wielkość (porównanie, nie pomiar), jedno zdanie o rozwoju
// dziecka, jedna rada dla rodziców. Źródła: NHS "Pregnancy week by week",
// ACOG, RCOG; terminy badań PL według standardu opieki okołoporodowej
// (src/data/pregnancyExamsPl.js), w innych językach ogólniej.
// Treść medyczna: przed zmianą i przed publikacją na skudev.pl sprawdzić z położną.
// Bez myślników w tekstach (test w pregnancyWeeks.test.js).

const L = (pl, en, de, fr, es) => ({ pl, en, de, fr, es })

export const SIZE_TEMPLATE = L(
  'Maluszek jest mniej więcej {size}',
  'Your baby is about {size}',
  'Ihr Baby ist etwa {size}',
  'Bébé est à peu près {size}',
  'Tu bebé es más o menos {size}',
)

export const WEEKS = {
  4: {
    emoji: '🌱',
    size: L('wielkości ziarenka maku', 'the size of a poppy seed', 'so groß wie ein Mohnkorn', 'de la taille d’une graine de pavot', 'del tamaño de una semilla de amapola'),
    baby: L(
      'Zarodek zagnieżdża się w macicy i ma niecały milimetr.',
      'The embryo is settling into the lining of the womb and is less than a millimetre long.',
      'Der Embryo nistet sich in der Gebärmutter ein und ist kleiner als ein Millimeter.',
      'L’embryon s’installe dans l’utérus et mesure moins d’un millimètre.',
      'El embrión se implanta en el útero y mide menos de un milímetro.'),
    you: L(
      'Test ciążowy może już wyjść pozytywnie. Jeśli jeszcze nie bierzesz kwasu foliowego, zacznij teraz.',
      'A pregnancy test may already be positive. If you are not taking folic acid yet, start now.',
      'Ein Schwangerschaftstest kann schon positiv sein. Falls Sie noch keine Folsäure nehmen, beginnen Sie jetzt.',
      'Un test de grossesse peut déjà être positif. Si vous ne prenez pas encore d’acide folique, commencez maintenant.',
      'El test de embarazo ya puede dar positivo. Si aún no tomas ácido fólico, empieza ahora.'),
  },
  5: {
    emoji: '🌱',
    size: L('wielkości ziarenka sezamu', 'the size of a sesame seed', 'so groß wie ein Sesamkorn', 'de la taille d’une graine de sésame', 'del tamaño de una semilla de sésamo'),
    baby: L(
      'Tworzy się cewa nerwowa, z której powstaną mózg i rdzeń kręgowy.',
      'The neural tube is forming, which will become the brain and spinal cord.',
      'Das Neuralrohr bildet sich, daraus entstehen Gehirn und Rückenmark.',
      'Le tube neural se forme : il deviendra le cerveau et la moelle épinière.',
      'Se forma el tubo neural, que dará lugar al cerebro y la médula espinal.'),
    you: L(
      'Umów pierwszą wizytę u lekarza albo położnej, najlepiej do 10. tygodnia.',
      'Book your first appointment with a midwife or doctor, ideally before 10 weeks.',
      'Vereinbaren Sie den ersten Termin bei Frauenärztin, Frauenarzt oder Hebamme.',
      'Prenez rendez-vous pour la première consultation de grossesse.',
      'Pide tu primera cita con la matrona o el médico.'),
  },
  6: {
    emoji: '🫘',
    size: L('wielkości ziarenka soczewicy', 'the size of a lentil', 'so groß wie eine Linse', 'de la taille d’une lentille', 'del tamaño de una lenteja'),
    baby: L(
      'Zaczyna bić serce. Na USG często widać już jego pracę.',
      'The heart starts beating, and its flicker can often be seen on a scan.',
      'Das Herz beginnt zu schlagen, im Ultraschall ist es oft schon zu sehen.',
      'Le cœur commence à battre, on le voit souvent déjà à l’échographie.',
      'El corazón empieza a latir y a menudo ya se ve en la ecografía.'),
    you: L(
      'Mdłości i zmęczenie są teraz częste. Pomagają mniejsze posiłki, ale częściej.',
      'Sickness and tiredness are common now. Smaller, more frequent meals can help.',
      'Übelkeit und Müdigkeit sind jetzt häufig. Kleinere, häufigere Mahlzeiten helfen.',
      'Nausées et fatigue sont fréquentes. Des repas plus petits et plus fréquents aident.',
      'Las náuseas y el cansancio son frecuentes. Ayudan comidas más pequeñas y frecuentes.'),
  },
  7: {
    emoji: '🫐',
    size: L('wielkości borówki', 'the size of a blueberry', 'so groß wie eine Heidelbeere', 'de la taille d’une myrtille', 'del tamaño de un arándano'),
    baby: L(
      'Pojawiają się zawiązki rąk i nóg, a mózg rośnie bardzo szybko.',
      'Arm and leg buds appear and the brain is growing fast.',
      'Arm- und Beinknospen entstehen, das Gehirn wächst sehr schnell.',
      'Les ébauches des bras et des jambes apparaissent, le cerveau grandit très vite.',
      'Aparecen los esbozos de brazos y piernas, y el cerebro crece muy rápido.'),
    you: L(
      'Pij małymi łykami przez cały dzień. Gdy nie utrzymujesz w żołądku nawet wody, zadzwoń do lekarza.',
      'Sip fluids through the day. If you cannot keep even water down, call your doctor or midwife.',
      'Trinken Sie über den Tag verteilt in kleinen Schlucken. Wenn Sie nicht einmal Wasser bei sich behalten, rufen Sie Ihre Ärztin oder Ihren Arzt an.',
      'Buvez par petites gorgées tout au long de la journée. Si vous ne gardez même pas l’eau, appelez votre médecin.',
      'Bebe a sorbos durante el día. Si no retienes ni el agua, llama a tu médico.'),
  },
  8: {
    emoji: '🍓',
    size: L('wielkości maliny', 'the size of a raspberry', 'so groß wie eine Himbeere', 'de la taille d’une framboise', 'del tamaño de una frambuesa'),
    baby: L(
      'Tworzą się palce. Maluszek już się porusza, choć jeszcze tego nie czujesz.',
      'Fingers and toes are forming. Your baby already moves, though you cannot feel it yet.',
      'Finger und Zehen bilden sich. Ihr Baby bewegt sich schon, auch wenn Sie es noch nicht spüren.',
      'Les doigts se forment. Bébé bouge déjà, même si vous ne le sentez pas encore.',
      'Se forman los dedos. Tu bebé ya se mueve, aunque todavía no lo notes.'),
    you: L(
      'Na pierwszej wizycie zwykle są badania krwi i moczu. Listę znajdziesz w zakładce Badania.',
      'Your first appointment usually includes blood and urine tests.',
      'Beim ersten Termin werden meist Blut und Urin untersucht.',
      'La première consultation comprend en général une prise de sang et une analyse d’urine.',
      'En la primera visita suelen pedirte análisis de sangre y orina.'),
  },
  9: {
    emoji: '🍒',
    size: L('wielkości wiśni', 'the size of a cherry', 'so groß wie eine Kirsche', 'de la taille d’une cerise', 'del tamaño de una cereza'),
    baby: L(
      'Wszystkie najważniejsze narządy już zaczęły się tworzyć.',
      'All the major organs have started to form.',
      'Alle wichtigen Organe haben begonnen, sich zu bilden.',
      'Tous les organes principaux ont commencé à se former.',
      'Todos los órganos principales ya han empezado a formarse.'),
    you: L(
      'Unikaj alkoholu, dymu papierosowego oraz surowego mięsa, ryb i jaj.',
      'Avoid alcohol, smoke, and raw meat, fish and eggs.',
      'Meiden Sie Alkohol, Rauch sowie rohes Fleisch, rohen Fisch und rohe Eier.',
      'Évitez l’alcool, la fumée, la viande, le poisson et les œufs crus.',
      'Evita el alcohol, el humo y la carne, el pescado y los huevos crudos.'),
  },
  10: {
    emoji: '🍓',
    size: L('wielkości truskawki', 'the size of a strawberry', 'so groß wie eine Erdbeere', 'de la taille d’une fraise', 'del tamaño de una fresa'),
    baby: L(
      'Od teraz lekarze mówią o płodzie, a nie o zarodku.',
      'From now on doctors call your baby a fetus rather than an embryo.',
      'Ab jetzt sprechen Ärzte vom Fötus statt vom Embryo.',
      'À partir de maintenant, on parle de fœtus et non plus d’embryon.',
      'A partir de ahora los médicos hablan de feto y no de embrión.'),
    you: L(
      'Umów USG z 11. do 14. tygodnia, na wolne terminy często trzeba poczekać.',
      'Book the scan for 11 to 14 weeks; appointments can fill up.',
      'Denken Sie an den Ultraschall zwischen der 11. und 14. Woche, Termine sind oft knapp.',
      'Pensez à l’échographie du 1er trimestre (entre 11 et 13 SA + 6 jours), les rendez-vous partent vite.',
      'Pide cita para la ecografía de las semanas 11 a 14, a veces hay que esperar.'),
  },
  11: {
    emoji: '🌿',
    size: L('wielkości figi', 'the size of a fig', 'so groß wie eine Feige', 'de la taille d’une figue', 'del tamaño de un higo'),
    baby: L(
      'Maluszek ma już paluszki, a jego kości zaczynają twardnieć.',
      'Your baby has fingers and toes, and the bones are starting to harden.',
      'Ihr Baby hat Finger und Zehen, die Knochen beginnen zu verhärten.',
      'Bébé a des doigts et des orteils, ses os commencent à durcir.',
      'Tu bebé ya tiene dedos y sus huesos empiezan a endurecerse.'),
    you: L(
      'Teraz jest czas na USG 1. trymestru (od 11. do 14. tygodnia).',
      'This is the time for the first trimester scan (11 to 14 weeks).',
      'Jetzt ist die Zeit für den Ultraschall im 1. Trimester (11. bis 14. Woche).',
      'C’est le moment de l’échographie du 1er trimestre.',
      'Es el momento de la ecografía del primer trimestre (semanas 11 a 14).'),
  },
  12: {
    emoji: '🍋',
    size: L('wielkości limonki', 'the size of a lime', 'so groß wie eine Limette', 'de la taille d’un citron vert', 'del tamaño de una lima'),
    baby: L(
      'Maluszek porusza rączkami i nóżkami i ma ok. 5 cm.',
      'Your baby moves their arms and legs and is about 5 cm long.',
      'Ihr Baby bewegt Arme und Beine und ist etwa 5 cm groß.',
      'Bébé bouge les bras et les jambes et mesure environ 5 cm.',
      'Tu bebé mueve brazos y piernas y mide unos 5 cm.'),
    you: L(
      'U wielu kobiet mdłości słabną pod koniec 1. trymestru.',
      'For many women sickness eases towards the end of the first trimester.',
      'Bei vielen Frauen lässt die Übelkeit gegen Ende des 1. Trimesters nach.',
      'Chez beaucoup de femmes, les nausées diminuent à la fin du 1er trimestre.',
      'En muchas mujeres las náuseas disminuyen al final del primer trimestre.'),
  },
  13: {
    emoji: '🍋',
    size: L('wielkości cytryny', 'the size of a lemon', 'so groß wie eine Zitrone', 'de la taille d’un citron', 'del tamaño de un limón'),
    baby: L(
      'Rosną kości, a na palcach zaczynają tworzyć się linie papilarne.',
      'Bones keep growing and fingerprints are starting to form.',
      'Die Knochen wachsen, auf den Fingerkuppen entstehen die Fingerabdrücke.',
      'Les os grandissent et les empreintes digitales commencent à se former.',
      'Los huesos crecen y empiezan a formarse las huellas dactilares.'),
    you: L(
      'Dobry moment, żeby powiedzieć bliskim. W aplikacji jest gotowa karta do ogłoszenia.',
      'A good time to tell family and friends. The app has a ready-made announcement card.',
      'Ein guter Moment, es der Familie zu sagen. In der App gibt es eine fertige Karte.',
      'Un bon moment pour l’annoncer à vos proches. L’appli propose une carte toute prête.',
      'Buen momento para contarlo a la familia. En la app tienes una tarjeta lista.'),
  },
  14: {
    emoji: '🍑',
    size: L('wielkości brzoskwini', 'the size of a peach', 'so groß wie ein Pfirsich', 'de la taille d’une pêche', 'del tamaño de un melocotón'),
    baby: L(
      'Zaczyna się 2. trymestr. Maluszek robi miny i ćwiczy połykanie.',
      'The second trimester begins. Your baby makes faces and practises swallowing.',
      'Das 2. Trimester beginnt. Ihr Baby schneidet Grimassen und übt das Schlucken.',
      'Le 2e trimestre commence. Bébé fait des grimaces et s’entraîne à avaler.',
      'Empieza el segundo trimestre. Tu bebé hace muecas y practica tragar.'),
    you: L(
      'Wiele osób ma teraz więcej energii. Spacery i pływanie są dobre, jeśli lekarz nie zaleca inaczej.',
      'Many people feel more energetic now. Walking and swimming are great unless you have been told otherwise.',
      'Viele haben jetzt mehr Energie. Spazieren und Schwimmen tun gut, sofern nichts dagegen spricht.',
      'Beaucoup retrouvent de l’énergie. La marche et la natation sont idéales, sauf avis contraire.',
      'Muchas personas tienen ahora más energía. Caminar y nadar va bien, salvo indicación contraria.'),
  },
  15: {
    emoji: '🍎',
    size: L('wielkości jabłka', 'the size of an apple', 'so groß wie ein Apfel', 'de la taille d’une pomme', 'del tamaño de una manzana'),
    baby: L(
      'Maluszek wyczuwa światło przez powieki, choć oczy ma jeszcze zamknięte.',
      'Your baby can sense light through the eyelids, although the eyes are still closed.',
      'Ihr Baby nimmt Licht durch die Lider wahr, obwohl die Augen noch geschlossen sind.',
      'Bébé perçoit la lumière à travers ses paupières, même si ses yeux sont encore fermés.',
      'Tu bebé percibe la luz a través de los párpados, aunque aún tiene los ojos cerrados.'),
    you: L(
      'Spodnie robią się ciasne? Gumka na guzik albo pas ciążowy wystarczą na kilka tygodni.',
      'Trousers getting tight? A button extender or a bump band will do for a few weeks.',
      'Die Hose wird eng? Ein Hosenerweiterer oder ein Bauchband reichen für einige Wochen.',
      'Le pantalon serre ? Une rallonge de bouton ou une bande de grossesse suffisent quelques semaines.',
      '¿Te aprieta el pantalón? Un alargador de botón o una banda de embarazo sirven unas semanas.'),
  },
  16: {
    emoji: '🥑',
    size: L('wielkości awokado', 'the size of an avocado', 'so groß wie eine Avocado', 'de la taille d’un avocat', 'del tamaño de un aguacate'),
    baby: L(
      'Maluszek rusza się coraz więcej. W drugiej ciąży niektóre mamy czują już pierwsze delikatne ruchy.',
      'Your baby is moving more and more. In a second pregnancy some mums already feel the first flutters.',
      'Ihr Baby bewegt sich immer mehr. In der zweiten Schwangerschaft spüren manche schon erste Bewegungen.',
      'Bébé bouge de plus en plus. Lors d’une deuxième grossesse, certaines sentent déjà les premiers mouvements.',
      'Tu bebé se mueve cada vez más. En un segundo embarazo algunas ya notan los primeros movimientos.'),
    you: L(
      'Pierwsze ruchy przypominają bąbelki albo trzepotanie. Zwykle czuje się je między 16. a 24. tygodniem, w pierwszej ciąży raczej później.',
      'First movements feel like bubbles or fluttering. They usually come between 16 and 24 weeks.',
      'Die ersten Bewegungen fühlen sich wie Bläschen oder Flattern an, meist zwischen der 16. und 24. Woche.',
      'Les premiers mouvements ressemblent à des bulles ou à un papillon, en général entre 16 et 24 semaines.',
      'Los primeros movimientos parecen burbujas o un aleteo, suelen llegar entre las semanas 16 y 24.'),
  },
  17: {
    emoji: '🍐',
    size: L('wielkości gruszki', 'the size of a pear', 'so groß wie eine Birne', 'de la taille d’une poire', 'del tamaño de una pera'),
    baby: L(
      'Pod skórą zaczyna odkładać się tkanka tłuszczowa.',
      'Fat is starting to build up under the skin.',
      'Unter der Haut beginnt sich Fettgewebe zu bilden.',
      'De la graisse commence à se former sous la peau.',
      'Empieza a acumularse grasa bajo la piel.'),
    you: L(
      'Śpij na boku, jak Ci wygodnie. Od 28. tygodnia to szczególnie ważne.',
      'Sleep on your side if it is comfortable. From 28 weeks this matters most.',
      'Schlafen Sie auf der Seite, wenn es bequem ist. Ab der 28. Woche ist das besonders wichtig.',
      'Dormez sur le côté si c’est confortable. À partir de 28 semaines, c’est particulièrement important.',
      'Duerme de lado si te resulta cómodo. Desde la semana 28 es especialmente importante.'),
  },
  18: {
    emoji: '🫑',
    size: L('wielkości papryki', 'the size of a bell pepper', 'so groß wie eine Paprika', 'de la taille d’un poivron', 'del tamaño de un pimiento'),
    baby: L(
      'Rozwija się słuch: wkrótce maluszek zacznie słyszeć bicie Twojego serca.',
      'Hearing is developing: soon your baby will hear your heartbeat.',
      'Das Gehör entwickelt sich: bald hört Ihr Baby Ihren Herzschlag.',
      'L’ouïe se développe : bientôt bébé entendra battre votre cœur.',
      'Se desarrolla el oído: pronto tu bebé oirá latir tu corazón.'),
    you: L(
      'Zbliża się USG połówkowe (od 18. do 22. tygodnia), najważniejsze badanie budowy dziecka.',
      'The mid-pregnancy anatomy scan is coming up, usually between 18 and 22 weeks.',
      'Bald steht der große Ultraschall zur Organkontrolle an, meist zwischen der 19. und 22. Woche.',
      'L’échographie morphologique du 2e trimestre approche (vers 22 SA).',
      'Se acerca la ecografía morfológica, hacia la semana 20.'),
  },
  19: {
    emoji: '🥭',
    size: L('wielkości mango', 'the size of a mango', 'so groß wie eine Mango', 'de la taille d’une mangue', 'del tamaño de un mango'),
    baby: L(
      'Skórę pokrywa maź płodowa, która chroni ją w wodach płodowych.',
      'A creamy coating called vernix protects the skin in the amniotic fluid.',
      'Die Käseschmiere schützt die Haut im Fruchtwasser.',
      'Le vernix, une couche crémeuse, protège la peau dans le liquide amniotique.',
      'El vérnix, una capa cremosa, protege la piel en el líquido amniótico.'),
    you: L(
      'Na USG połówkowym zwykle widać płeć, jeśli chcecie ją znać.',
      'The anatomy scan can usually show the sex, if you want to know.',
      'Beim Organultraschall ist das Geschlecht meist zu sehen, wenn Sie es wissen möchten.',
      'L’échographie morphologique montre souvent le sexe, si vous voulez le connaître.',
      'En la ecografía morfológica suele verse el sexo, si queréis saberlo.'),
  },
  20: {
    emoji: '🍌',
    size: L('wielkości banana', 'the size of a banana', 'so groß wie eine Banane', 'de la taille d’une banane', 'del tamaño de un plátano'),
    baby: L(
      'Połowa ciąży! Maluszek ma około 25 cm od główki do pięt.',
      'Halfway there! Your baby is about 25 cm from head to heel.',
      'Halbzeit! Ihr Baby ist etwa 25 cm vom Kopf bis zur Ferse.',
      'La moitié du chemin ! Bébé mesure environ 25 cm de la tête aux talons.',
      '¡Mitad del embarazo! Tu bebé mide unos 25 cm de la cabeza a los talones.'),
    you: L(
      'Nie czujesz jeszcze ruchów? U wielu kobiet przychodzą do 24. tygodnia. Jeśli po 24. tygodniu dalej ich nie czujesz, powiedz położnej.',
      'No movements yet? For many they come by 24 weeks. If you still feel nothing after 24 weeks, tell your midwife.',
      'Noch keine Bewegungen? Bei vielen kommen sie bis zur 24. Woche. Spüren Sie danach nichts, sagen Sie es Ihrer Hebamme.',
      'Pas encore de mouvements ? Ils arrivent souvent avant 24 semaines. Si vous ne sentez rien après, parlez-en à votre sage-femme.',
      '¿Aún no notas movimientos? Suelen llegar antes de la semana 24. Si después no notas nada, díselo a tu matrona.'),
  },
  21: {
    emoji: '🥕',
    size: L('wielkości marchewki', 'the size of a carrot', 'so groß wie eine Karotte', 'de la taille d’une carotte', 'del tamaño de una zanahoria'),
    baby: L(
      'Maluszek połyka wody płodowe i w ten sposób ćwiczy trawienie.',
      'Your baby swallows amniotic fluid, practising digestion.',
      'Ihr Baby schluckt Fruchtwasser und übt so die Verdauung.',
      'Bébé avale du liquide amniotique et entraîne ainsi sa digestion.',
      'Tu bebé traga líquido amniótico y así practica la digestión.'),
    you: L(
      'Zacznijcie zbierać wyprawkę bez pośpiechu. W aplikacji jest lista do odhaczania we dwoje.',
      'Start gathering baby essentials, no rush. The app has a checklist you can tick off together.',
      'Beginnen Sie in Ruhe mit der Erstausstattung. In der App gibt es eine Liste zum gemeinsamen Abhaken.',
      'Commencez la liste de naissance sans vous presser. L’appli propose une liste à cocher à deux.',
      'Empezad la canastilla sin prisa. En la app hay una lista para marcar en pareja.'),
  },
  22: {
    emoji: '🍈',
    size: L('wielkości papai', 'the size of a papaya', 'so groß wie eine Papaya', 'de la taille d’une papaye', 'del tamaño de una papaya'),
    baby: L(
      'Rysy twarzy są już wyraźne, rosną brwi i rzęsy.',
      'The face is well formed, with eyebrows and eyelashes growing.',
      'Das Gesicht ist gut ausgebildet, Augenbrauen und Wimpern wachsen.',
      'Le visage est bien formé, les sourcils et les cils poussent.',
      'La cara ya está bien formada y crecen las cejas y las pestañas.'),
    you: L(
      'Na zgagę pomagają mniejsze posiłki i niejedzenie tuż przed snem.',
      'For heartburn, try smaller meals and not eating right before bed.',
      'Gegen Sodbrennen helfen kleinere Mahlzeiten und nicht direkt vor dem Schlafen zu essen.',
      'Contre les brûlures d’estomac : repas plus petits et pas juste avant le coucher.',
      'Para el ardor, comidas más pequeñas y no comer justo antes de dormir.'),
  },
  23: {
    emoji: '🍊',
    size: L('wielkości grejpfruta', 'the size of a grapefruit', 'so groß wie eine Grapefruit', 'de la taille d’un pamplemousse', 'del tamaño de un pomelo'),
    baby: L(
      'Skóra jest jeszcze cienka i pomarszczona, bo pod spodem mało tłuszczu.',
      'The skin is still thin and wrinkly, with little fat underneath.',
      'Die Haut ist noch dünn und faltig, darunter ist wenig Fett.',
      'La peau est encore fine et fripée, avec peu de graisse dessous.',
      'La piel aún es fina y arrugada, con poca grasa debajo.'),
    you: L(
      'Stopy puchną wieczorem? Odpoczywaj z nogami w górze. Nagły obrzęk twarzy lub rąk z bólem głowy to powód, żeby od razu zadzwonić.',
      'Swollen feet in the evening? Rest with your legs up. Sudden swelling of the face or hands with a headache means call straight away.',
      'Abends geschwollene Füße? Legen Sie die Beine hoch. Plötzliche Schwellungen an Gesicht oder Händen mit Kopfschmerzen: sofort anrufen.',
      'Pieds gonflés le soir ? Surélevez les jambes. Un gonflement soudain du visage ou des mains avec maux de tête : appelez tout de suite.',
      '¿Pies hinchados por la tarde? Descansa con las piernas en alto. Hinchazón repentina de cara o manos con dolor de cabeza: llama enseguida.'),
  },
  24: {
    emoji: '🌽',
    size: L('wielkości kolby kukurydzy', 'the size of an ear of corn', 'so groß wie ein Maiskolben', 'de la taille d’un épi de maïs', 'del tamaño de una mazorca de maíz'),
    baby: L(
      'Płuca intensywnie się rozwijają. Maluszek waży już ponad pół kilograma.',
      'The lungs are developing fast. Your baby already weighs over half a kilo.',
      'Die Lunge entwickelt sich stark. Ihr Baby wiegt schon über ein halbes Kilo.',
      'Les poumons se développent. Bébé pèse déjà plus d’un demi-kilo.',
      'Los pulmones se desarrollan rápido. Tu bebé ya pesa más de medio kilo.'),
    you: L(
      'Między 24. a 28. tygodniem jest test obciążenia glukozą.',
      'Between 24 and 28 weeks you may be offered a glucose test. Ask whether it applies to you.',
      'Zwischen der 24. und 28. Woche wird ein Zuckertest angeboten.',
      'Entre 24 et 28 SA, un test de glycémie peut vous être proposé selon vos facteurs de risque.',
      'Entre las semanas 24 y 28 se suele hacer la prueba de la glucosa (O’Sullivan).'),
  },
  25: {
    emoji: '🥦',
    size: L('wielkości kalafiora', 'the size of a cauliflower', 'so groß wie ein Blumenkohl', 'de la taille d’un chou-fleur', 'del tamaño de una coliflor'),
    baby: L(
      'Maluszek reaguje na Twój głos i dotyk przez brzuch.',
      'Your baby responds to your voice and to touch through the bump.',
      'Ihr Baby reagiert auf Ihre Stimme und auf Berührungen am Bauch.',
      'Bébé réagit à votre voix et au toucher à travers le ventre.',
      'Tu bebé reacciona a tu voz y al tacto a través de la tripa.'),
    you: L(
      'Mówcie i śpiewajcie do brzucha, partner też. To dobry moment, żeby się poznali.',
      'Talk and sing to the bump, your partner too. A good time for them to get to know each other.',
      'Sprechen und singen Sie mit dem Bauch, der Partner auch. So lernen sich die beiden kennen.',
      'Parlez et chantez au ventre, votre partenaire aussi. C’est le moment de faire connaissance.',
      'Hablad y cantad a la tripa, tu pareja también. Buen momento para que se conozcan.'),
  },
  26: {
    emoji: '🥬',
    size: L('wielkości główki sałaty', 'the size of a head of lettuce', 'so groß wie ein Salatkopf', 'de la taille d’une laitue', 'del tamaño de una lechuga'),
    baby: L(
      'Oczy zaczynają się otwierać.',
      'The eyes are beginning to open.',
      'Die Augen beginnen sich zu öffnen.',
      'Les yeux commencent à s’ouvrir.',
      'Los ojos empiezan a abrirse.'),
    you: L(
      'Zaplanujcie szkołę rodzenia albo zajęcia online, najlepiej we dwoje.',
      'Plan antenatal classes, in person or online, ideally together.',
      'Planen Sie einen Geburtsvorbereitungskurs, am besten zu zweit.',
      'Prévoyez les séances de préparation à la naissance, idéalement à deux.',
      'Apuntaos a la preparación al parto, mejor en pareja.'),
  },
  27: {
    emoji: '🥦',
    size: L('wielkości brokułu', 'the size of a broccoli head', 'so groß wie ein Brokkoli', 'de la taille d’un brocoli', 'del tamaño de un brócoli'),
    baby: L(
      'Mózg rośnie bardzo szybko, a maluszek ma już rytm snu i czuwania.',
      'The brain is growing quickly, and your baby has cycles of sleep and wakefulness.',
      'Das Gehirn wächst schnell, Ihr Baby hat schon Schlaf und Wachphasen.',
      'Le cerveau grandit vite et bébé a déjà des cycles de sommeil et d’éveil.',
      'El cerebro crece deprisa y tu bebé ya tiene ciclos de sueño y vigilia.'),
    you: L(
      'Jeśli masz grupę krwi Rh ujemną, zapytaj o immunoglobulinę anty-D (zwykle około 28. tygodnia).',
      'If your blood group is Rh negative, ask about anti-D (usually around 28 weeks).',
      'Wenn Sie Rhesus-negativ sind, fragen Sie nach der Anti-D-Prophylaxe (meist um die 28. Woche).',
      'Si vous êtes de rhésus négatif, demandez pour l’injection d’anti-D (souvent vers 28 SA).',
      'Si tu Rh es negativo, pregunta por la inmunoglobulina anti-D (suele ser hacia la semana 28).'),
  },
  28: {
    emoji: '🍆',
    size: L('wielkości bakłażana', 'the size of an aubergine', 'so groß wie eine Aubergine', 'de la taille d’une aubergine', 'del tamaño de una berenjena'),
    baby: L(
      'Zaczyna się 3. trymestr. Maluszek waży ponad 1 kg i potrafi mrugać.',
      'The third trimester begins. Your baby weighs over 1 kg and can blink.',
      'Das 3. Trimester beginnt. Ihr Baby wiegt über 1 kg und kann blinzeln.',
      'Le 3e trimestre commence. Bébé pèse plus d’1 kg et cligne des yeux.',
      'Empieza el tercer trimestre. Tu bebé pesa más de 1 kg y parpadea.'),
    you: L(
      'Poznaj zwykły rytm ruchów dziecka. Słabsze lub rzadsze ruchy to powód, żeby od razu zadzwonić. Śpij na boku.',
      'Get to know your baby’s usual pattern of movements. Weaker or fewer movements mean call straight away. Sleep on your side.',
      'Lernen Sie den üblichen Bewegungsrhythmus kennen. Schwächere oder seltenere Bewegungen: sofort anrufen. Schlafen Sie auf der Seite.',
      'Apprenez le rythme habituel des mouvements de bébé. Des mouvements plus faibles ou plus rares : appelez tout de suite. Dormez sur le côté.',
      'Conoce el ritmo habitual de movimientos de tu bebé. Si se mueve menos o más débil, llama enseguida. Duerme de lado.'),
  },
  29: {
    emoji: '🎃',
    size: L('wielkości dyni piżmowej', 'the size of a butternut squash', 'so groß wie ein Butternusskürbis', 'de la taille d’une courge butternut', 'del tamaño de una calabaza violín'),
    baby: L(
      'Kości są już wykształcone, choć wciąż miękkie.',
      'The bones are fully formed, though still soft.',
      'Die Knochen sind ausgebildet, aber noch weich.',
      'Les os sont formés, mais encore souples.',
      'Los huesos ya están formados, aunque todavía blandos.'),
    you: L(
      'W 3. trymestrze wizyty są częstsze. Zapisuj pytania między wizytami, w zakładce Badania masz miejsce na notatki.',
      'Appointments get more frequent in the third trimester. Jot down questions between visits.',
      'Im 3. Trimester sind die Termine häufiger. Notieren Sie Fragen zwischen den Terminen.',
      'Les rendez-vous sont plus fréquents au 3e trimestre. Notez vos questions entre deux visites.',
      'En el tercer trimestre hay más visitas. Apunta tus preguntas entre una y otra.'),
  },
  30: {
    emoji: '🥬',
    size: L('wielkości główki kapusty', 'the size of a cabbage', 'so groß wie ein Kohlkopf', 'de la taille d’un chou', 'del tamaño de una col'),
    baby: L(
      'Maluszek ma ok. 40 cm i coraz mniej miejsca, ale rusza się tak samo często.',
      'Your baby is about 40 cm long with less room, but still moves just as often.',
      'Ihr Baby ist etwa 40 cm groß, hat weniger Platz, bewegt sich aber genauso oft.',
      'Bébé mesure environ 40 cm, il a moins de place mais bouge toujours autant.',
      'Tu bebé mide unos 40 cm y tiene menos espacio, pero se mueve igual de a menudo.'),
    you: L(
      'Czas skompletować wyprawkę, zwłaszcza fotelik samochodowy montowany tyłem do kierunku jazdy.',
      'Time to get the essentials together, especially a rear-facing car seat.',
      'Zeit für die Erstausstattung, vor allem eine rückwärtsgerichtete Babyschale.',
      'Le moment de réunir l’essentiel, surtout un siège auto dos à la route.',
      'Es momento de reunir la canastilla, sobre todo una silla de coche a contramarcha.'),
  },
  31: {
    emoji: '🥥',
    size: L('wielkości kokosa', 'the size of a coconut', 'so groß wie eine Kokosnuss', 'de la taille d’une noix de coco', 'del tamaño de un coco'),
    baby: L(
      'Wszystkie zmysły już działają.',
      'All five senses are working.',
      'Alle Sinne funktionieren schon.',
      'Les cinq sens fonctionnent.',
      'Los cinco sentidos ya funcionan.'),
    you: L(
      'Skurcze, które przychodzą i odchodzą, to często skurcze przepowiadające. Regularne lub bolesne przed 37. tygodniem: dzwoń od razu.',
      'Tightenings that come and go are often practice contractions. Regular or painful ones before 37 weeks: call straight away.',
      'Harte Bäuche, die kommen und gehen, sind oft Übungswehen. Regelmäßige oder schmerzhafte vor der 37. Woche: sofort anrufen.',
      'Des contractions qui vont et viennent sont souvent sans gravité. Régulières ou douloureuses avant 37 SA : appelez tout de suite.',
      'Las contracciones que van y vienen suelen ser de ensayo. Si son regulares o dolorosas antes de la semana 37, llama enseguida.'),
  },
  32: {
    emoji: '🍊',
    size: L('wielkości pomelo', 'the size of a pomelo', 'so groß wie eine Pomelo', 'de la taille d’un pomélo', 'del tamaño de un pomelo grande'),
    baby: L(
      'Maluszek ćwiczy oddychanie i coraz częściej układa się główką w dół.',
      'Your baby practises breathing and is more often lying head down.',
      'Ihr Baby übt das Atmen und liegt immer öfter mit dem Kopf nach unten.',
      'Bébé s’entraîne à respirer et se place de plus en plus souvent tête en bas.',
      'Tu bebé practica la respiración y cada vez más a menudo se coloca cabeza abajo.'),
    you: L(
      'Ustalcie plan: gdzie rodzisz, kto jedzie z Tobą i jak najszybciej dojechać.',
      'Make a plan: where you will give birth, who comes with you and the quickest way there.',
      'Machen Sie einen Plan: wo Sie entbinden, wer mitkommt und wie Sie am schnellsten hinkommen.',
      'Faites un plan : où accoucher, qui vous accompagne et le trajet le plus rapide.',
      'Haced un plan: dónde vas a dar a luz, quién te acompaña y cómo llegar rápido.'),
  },
  33: {
    emoji: '🍍',
    size: L('wielkości ananasa', 'the size of a pineapple', 'so groß wie eine Ananas', 'de la taille d’un ananas', 'del tamaño de una piña'),
    baby: L(
      'Maluszek dostaje od Ciebie przeciwciała, które będą go chronić po urodzeniu.',
      'Your baby is getting antibodies from you that will protect them after birth.',
      'Ihr Baby bekommt Antikörper von Ihnen, die es nach der Geburt schützen.',
      'Bébé reçoit vos anticorps, qui le protégeront après la naissance.',
      'Tu bebé recibe tus anticuerpos, que lo protegerán después de nacer.'),
    you: L(
      'Ustalcie, jak partner dowie się, że się zaczęło. Licznik skurczy z aplikacji widać na obu telefonach.',
      'Agree how your partner will know it has started. The app’s contraction timer shows up on both phones.',
      'Klären Sie, wie der Partner erfährt, dass es losgeht. Der Wehen-Timer der App ist auf beiden Handys zu sehen.',
      'Prévoyez comment votre partenaire saura que ça commence. Le minuteur de contractions s’affiche sur vos deux téléphones.',
      'Acordad cómo se enterará tu pareja de que empieza. El contador de contracciones de la app se ve en los dos móviles.'),
  },
  34: {
    emoji: '🍈',
    size: L('wielkości melona', 'the size of a cantaloupe', 'so groß wie eine Honigmelone', 'de la taille d’un melon', 'del tamaño de un melón'),
    baby: L(
      'Paznokcie sięgają już końców palców.',
      'The fingernails now reach the fingertips.',
      'Die Fingernägel reichen bis zu den Fingerspitzen.',
      'Les ongles atteignent le bout des doigts.',
      'Las uñas ya llegan a la punta de los dedos.'),
    you: L(
      'Spakuj torbę do szpitala. W aplikacji jest lista, którą możecie odhaczać we dwoje.',
      'Pack your hospital bag. The app has a list you can tick off together.',
      'Packen Sie die Kliniktasche. In der App gibt es eine Liste zum gemeinsamen Abhaken.',
      'Préparez la valise de maternité. L’appli propose une liste à cocher à deux.',
      'Prepara la bolsa del hospital. En la app hay una lista para marcar en pareja.'),
  },
  35: {
    emoji: '🍈',
    size: L('wielkości melona miodowego', 'the size of a honeydew melon', 'so groß wie eine große Melone', 'de la taille d’un melon miel', 'del tamaño de un melón grande'),
    baby: L(
      'Nerki są już w pełni rozwinięte, a wątroba zaczyna pracować.',
      'The kidneys are fully developed and the liver is starting to work.',
      'Die Nieren sind voll entwickelt, die Leber beginnt zu arbeiten.',
      'Les reins sont développés et le foie commence à fonctionner.',
      'Los riñones ya están desarrollados y el hígado empieza a funcionar.'),
    you: L(
      'Między 35. a 37. tygodniem jest wymaz w kierunku paciorkowców GBS.',
      'Ask whether you will be tested for group B strep. In many countries it is done around 35 to 37 weeks.',
      'Ein Abstrich auf B-Streptokokken wird oft zwischen der 35. und 37. Woche angeboten.',
      'Le prélèvement vaginal pour le streptocoque B se fait en général entre 34 et 38 SA.',
      'Entre las semanas 35 y 37 se hace el cultivo de estreptococo del grupo B.'),
  },
  36: {
    emoji: '🥬',
    size: L('wielkości sałaty rzymskiej', 'the size of a romaine lettuce', 'so groß wie ein Römersalat', 'de la taille d’une romaine', 'del tamaño de una lechuga romana'),
    baby: L(
      'Maluszek przybiera ok. 30 g dziennie i zwykle leży już główką w dół.',
      'Your baby gains about 30 g a day and is usually head down by now.',
      'Ihr Baby nimmt etwa 30 g am Tag zu und liegt meist schon mit dem Kopf nach unten.',
      'Bébé prend environ 30 g par jour et a souvent déjà la tête en bas.',
      'Tu bebé gana unos 30 g al día y suele estar ya cabeza abajo.'),
    you: L(
      'Ustal z położną, przy jakich skurczach jechać do szpitala. Licznik skurczy masz w aplikacji.',
      'Agree with your midwife when to go in once contractions start. The contraction timer is in the app.',
      'Klären Sie mit der Hebamme, bei welchen Wehen Sie losfahren. Der Wehen-Timer ist in der App.',
      'Voyez avec votre sage-femme quand partir à la maternité. Le minuteur de contractions est dans l’appli.',
      'Habla con tu matrona sobre cuándo ir al hospital. El contador de contracciones está en la app.'),
  },
  37: {
    emoji: '🥬',
    size: L('wielkości pęczka botwiny', 'the size of a bunch of Swiss chard', 'so groß wie ein Bund Mangold', 'de la taille d’une botte de blettes', 'del tamaño de un manojo de acelgas'),
    baby: L(
      'Od 37. tygodnia ciąża jest donoszona. Maluszek ćwiczy ssanie i chwytanie.',
      'From 37 weeks your pregnancy is considered full term. Your baby practises sucking and gripping.',
      'Ab der 37. Woche gilt die Schwangerschaft als ausgetragen. Ihr Baby übt Saugen und Greifen.',
      'À partir de 37 SA, bébé est considéré comme à terme. Il s’entraîne à téter et à agripper.',
      'Desde la semana 37 el embarazo se considera a término. Tu bebé practica la succión y el agarre.'),
    you: L(
      'Odejście wód, krwawienie albo słabsze ruchy: jedź od razu, nie czekaj na skurcze.',
      'Waters breaking, bleeding or fewer movements: go in straight away, do not wait for contractions.',
      'Blasensprung, Blutung oder weniger Bewegungen: sofort losfahren, nicht auf Wehen warten.',
      'Perte des eaux, saignement ou moins de mouvements : partez tout de suite, sans attendre les contractions.',
      'Si rompes la bolsa, sangras o notas menos movimientos, ve enseguida sin esperar contracciones.'),
  },
  38: {
    emoji: '🥬',
    size: L('wielkości pora', 'the size of a leek', 'so groß wie eine Lauchstange', 'de la taille d’un poireau', 'del tamaño de un puerro'),
    baby: L(
      'Maluszek ma już mocny chwyt i jest gotowy do narodzin.',
      'Your baby has a strong grip and is ready to be born.',
      'Ihr Baby kann schon kräftig greifen und ist bereit für die Geburt.',
      'Bébé a une bonne prise et il est prêt à naître.',
      'Tu bebé agarra con fuerza y está listo para nacer.'),
    you: L(
      'Torba przy drzwiach, fotelik w aucie? Odpoczywaj, ile się da.',
      'Bag by the door, car seat in the car? Rest as much as you can.',
      'Tasche an der Tür, Babyschale im Auto? Ruhen Sie sich so viel wie möglich aus.',
      'Valise près de la porte, siège auto dans la voiture ? Reposez-vous autant que possible.',
      '¿Bolsa junto a la puerta y silla en el coche? Descansa todo lo que puedas.'),
  },
  39: {
    emoji: '🍉',
    size: L('wielkości małego arbuza', 'the size of a small watermelon', 'so groß wie eine kleine Wassermelone', 'de la taille d’une petite pastèque', 'del tamaño de una sandía pequeña'),
    baby: L(
      'Maluszek ma zwykle ok. 50 cm i 3 do 3,5 kg, ale każdy jest trochę inny.',
      'Your baby is typically about 50 cm and 3 to 3.5 kg, though every baby is different.',
      'Ihr Baby ist meist etwa 50 cm groß und wiegt 3 bis 3,5 kg, jedes ist ein bisschen anders.',
      'Bébé mesure souvent environ 50 cm pour 3 à 3,5 kg, mais chacun est différent.',
      'Tu bebé suele medir unos 50 cm y pesar de 3 a 3,5 kg, aunque cada uno es distinto.'),
    you: L(
      'Zapisuj skurcze w liczniku. Kiedy jechać, powie Ci położna albo lekarz.',
      'Time contractions with the timer. Your midwife or doctor will tell you when to go in.',
      'Messen Sie die Wehen mit dem Timer. Wann Sie losfahren, sagt Ihnen die Hebamme.',
      'Chronométrez les contractions. Votre sage-femme vous dira quand partir.',
      'Cronometra las contracciones. Tu matrona te dirá cuándo ir.'),
  },
  40: {
    emoji: '🎃',
    size: L('wielkości dyni', 'the size of a pumpkin', 'so groß wie ein Kürbis', 'de la taille d’une citrouille', 'del tamaño de una calabaza'),
    baby: L(
      'Tylko część dzieci rodzi się dokładnie w dniu terminu. Poród o czasie to 37. do 42. tydzień.',
      'Only a few babies arrive exactly on their due date. Birth anywhere from 37 to 42 weeks is on time.',
      'Nur wenige Babys kommen genau am Termin. Eine Geburt zwischen der 37. und 42. Woche ist termingerecht.',
      'Peu de bébés naissent le jour exact du terme. Naître entre 37 et 42 SA, c’est à terme.',
      'Pocos bebés nacen justo en la fecha prevista. Nacer entre las semanas 37 y 42 es a término.'),
    you: L(
      'Gdy maluszek przyjdzie na świat, dotknij „Urodziło się!”, a aplikacja przejdzie w tryb niemowlęcia.',
      'When your baby arrives, tap “Baby is born!” and the app switches to baby mode.',
      'Wenn Ihr Baby da ist, tippen Sie auf „Baby ist geboren!“ und die App wechselt in den Babymodus.',
      'Quand bébé sera là, touchez « Bébé est né ! » et l’appli passera en mode bébé.',
      'Cuando llegue tu bebé, toca «¡Ha nacido!» y la app pasará al modo bebé.'),
  },
  41: {
    emoji: '🍉',
    size: L('wielkości arbuza', 'the size of a watermelon', 'so groß wie eine Wassermelone', 'de la taille d’une pastèque', 'del tamaño de una sandía'),
    baby: L(
      'Maluszek dalej rośnie, a lekarz będzie go teraz częściej sprawdzać.',
      'Your baby keeps growing, and you will be checked more often now.',
      'Ihr Baby wächst weiter, jetzt wird öfter kontrolliert.',
      'Bébé continue de grandir, vous serez surveillée plus souvent.',
      'Tu bebé sigue creciendo y ahora te controlarán más a menudo.'),
    you: L(
      'Porozmawiaj z lekarzem o planie, jeśli poród sam się nie zacznie, np. o indukcji.',
      'Talk with your doctor or midwife about the plan if labour does not start on its own, such as induction.',
      'Sprechen Sie über den Plan, falls die Geburt nicht von selbst beginnt, zum Beispiel eine Einleitung.',
      'Parlez avec votre équipe du plan si le travail ne démarre pas, par exemple un déclenchement.',
      'Habla con tu equipo del plan si el parto no empieza solo, por ejemplo una inducción.'),
  },
}

export const WEEK_MIN = 4
export const WEEK_MAX = 41

/** Treść tygodnia dla pełnych tygodni ciąży (poza zakresem: najbliższy tydzień). */
export function weekContent(weeks, locale) {
  const w = Math.min(WEEK_MAX, Math.max(WEEK_MIN, Math.floor(Number(weeks) || 0)))
  const d = WEEKS[w]
  const pick = o => o[locale] ?? o.en
  return {
    week: w,
    emoji: d.emoji,
    size: pick(SIZE_TEMPLATE).replace('{size}', pick(d.size)),
    baby: pick(d.baby),
    you: pick(d.you),
  }
}
