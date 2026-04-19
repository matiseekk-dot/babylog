/**
 * dailyTips.js
 *
 * Edukacyjne wskazówki rozwojowe — retention hook.
 * Każdego dnia pokazujemy jedną wskazówkę dopasowaną do wieku dziecka.
 *
 * Źródła merytoryczne: WHO developmental milestones, CDC milestone tracker,
 * NHS child development, oraz polskie standardy opieki pediatrycznej.
 *
 * Używanie:
 *   import { getTipForToday } from '../data/dailyTips'
 *   const tip = getTipForToday(ageMonths)
 */

const TIPS = {
  // ─── 0-3 miesiące (noworodek) ───────────────────────────────────────────
  '0-3': [
    { emoji:'👁️', pl:'Trzymaj twarz w odległości ok. 20 cm — tyle widzi dziecko ostro.', en:'Hold your face ~20cm away — that\'s where your baby focuses best.' },
    { emoji:'🤱', pl:'Skin-to-skin przez pierwsze 3 miesiące obniża płacz o 50%.', en:'Skin-to-skin contact in first 3 months reduces crying by 50%.' },
    { emoji:'😴', pl:'Noworodki śpią 16-17h dziennie, ale po 1-3h przerwy. To normalne.', en:'Newborns sleep 16-17h/day but wake every 1-3h. Totally normal.' },
    { emoji:'🎵', pl:'Rozpoznaje Twój głos od urodzenia. Mów do dziecka zawsze, nie tylko "baby talk".', en:'Your baby recognizes your voice from birth. Talk normally, not just baby-talk.' },
    { emoji:'🌡️', pl:'Gorączka ≥38°C u dziecka <3 mies. = zawsze wizyta u lekarza, nawet w nocy.', en:'Fever ≥38°C in baby <3 months = always see a doctor, even at night.' },
    { emoji:'💩', pl:'10-12 pieluch dziennie to norma — mniej niż 6 mokrych może oznaczać odwodnienie.', en:'10-12 diapers/day is normal — less than 6 wet may mean dehydration.' },
    { emoji:'👶', pl:'Dziecko rodzi się z odruchem Moro — nagłe poderwanie rączek przy hałasie. Zanika ok. 4. mies.', en:'Babies have Moro reflex — arm-startle to noises. Disappears around 4 months.' },
    { emoji:'🤲', pl:'Nie da się "rozpuścić" noworodka nadmiarem przytulania. Wręcz odwrotnie — wzmacnia.', en:'You can\'t "spoil" a newborn with too much cuddling. It strengthens bonds.' },
    { emoji:'🍼', pl:'Karmienie na żądanie jest zalecane — średnio co 2-3h, ale indywidualnie.', en:'Feed on demand — typically every 2-3h, but each baby differs.' },
    { emoji:'🌙', pl:'Dzień/noc myli się do ~8 tygodni. Dziennie światło, nocą ciemność i cisza.', en:'Day/night confusion until ~8 weeks. Bright days, dark quiet nights help.' },
  ],

  // ─── 3-6 miesięcy ────────────────────────────────────────────────────────
  '3-6': [
    { emoji:'😊', pl:'Pierwsze "prawdziwe" uśmiechy socjalne pojawiają się ok. 6-8 tygodnia.', en:'First "real" social smiles appear around 6-8 weeks.' },
    { emoji:'🎯', pl:'Około 4. mies. dziecko zaczyna sięgać po zabawki. Oferuj różne faktury.', en:'Around 4 months babies reach for toys. Offer various textures.' },
    { emoji:'🗣️', pl:'Gaworzenie (agu, gaga) to trening mowy. Odpowiadaj — to prawdziwa "rozmowa".', en:'Babbling (baba, gaga) is speech training. Respond — it\'s real conversation.' },
    { emoji:'💪', pl:'Tummy time 3× dziennie po 5-10 min wzmacnia kark i plecy.', en:'Tummy time 3× daily for 5-10 min strengthens neck and back.' },
    { emoji:'🌾', pl:'Pokarm stały nie wcześniej niż 4 mies., najlepiej ok. 6 mies. (WHO).', en:'Solid foods not before 4 months, ideally around 6 months (WHO).' },
    { emoji:'👀', pl:'Widzi kolory po 3 mies. Jasne, kontrastowe zabawki rozwijają wzrok.', en:'Full color vision by 3 months. Bright contrasting toys aid development.' },
    { emoji:'🧸', pl:'Obiekt wciąż "znika" gdy go nie widzi — object permanence dopiero ok. 7 mies.', en:'Objects still "vanish" when out of sight — object permanence develops ~7 months.' },
    { emoji:'💤', pl:'Ok. 4. mies. regression snu to normalne — mózg się rozwija.', en:'4-month sleep regression is normal — brain is developing rapidly.' },
    { emoji:'🎶', pl:'Rytm i melodia uspokajają lepiej niż słowa. Śpiewaj.', en:'Rhythm and melody calm better than words. Sing to your baby.' },
    { emoji:'👂', pl:'Pierwsze "prawdziwe" reakcje na imię ok. 5-6 mies.', en:'Responds to own name around 5-6 months.' },
  ],

  // ─── 6-9 miesięcy ────────────────────────────────────────────────────────
  '6-9': [
    { emoji:'🥄', pl:'Wprowadzaj nowe smaki pojedynczo, co 2-3 dni — łatwiej wykryć alergię.', en:'Introduce new tastes one at a time, every 2-3 days — easier to spot allergies.' },
    { emoji:'🚼', pl:'Raczkowanie zwykle między 7-10 mies. Niektóre dzieci pomijają ten etap.', en:'Crawling typically 7-10 months. Some babies skip it entirely.' },
    { emoji:'👋', pl:'"Pa pa" machanie ręką ok. 9 mies. To rozwój umiejętności społecznych.', en:'Waving "bye-bye" around 9 months. Social skill milestone.' },
    { emoji:'🦷', pl:'Pierwszy ząbek ok. 6 mies. — schłodzone gryzaki pomagają.', en:'First tooth around 6 months — chilled teethers help soothe.' },
    { emoji:'🤏', pl:'Chwyt pęsetowy (kciuk+palec) ok. 9 mies. — małe kawałki jedzenia OK.', en:'Pincer grasp (thumb+finger) around 9 months — small food pieces OK.' },
    { emoji:'😨', pl:'Lęk przed obcymi ok. 8 mies. to etap rozwojowy — nie wymuszaj kontaktu.', en:'Stranger anxiety around 8 months is developmental — don\'t force interactions.' },
    { emoji:'🎭', pl:'"A kuku!" uczy object permanence — obiekt istnieje nawet gdy go nie widać.', en:'"Peek-a-boo" teaches object permanence — things exist when hidden.' },
    { emoji:'💧', pl:'Po 6. mies. woda w kubku (nie butelce) — uczy picia.', en:'After 6 months offer water in a cup (not bottle) to teach sipping.' },
    { emoji:'🎲', pl:'Zabawki przyczynowo-skutkowe (guziki, dźwięki) uczą logiki.', en:'Cause-effect toys (buttons, sounds) teach logical thinking.' },
    { emoji:'🌛', pl:'Ok. 7 mies. nocne przebudzenia mogą wrócić — to etap rozwoju, nie regres.', en:'Around 7 months night wakings may return — developmental, not regression.' },
  ],

  // ─── 9-12 miesięcy ───────────────────────────────────────────────────────
  '9-12': [
    { emoji:'🚶', pl:'Pierwsze kroki zwykle między 9-15 mies. — nie porównuj z innymi dziećmi.', en:'First steps typically 9-15 months — don\'t compare with other babies.' },
    { emoji:'👄', pl:'Pierwsze słowa ("mama", "tata") z intencją ok. 12 mies.', en:'First intentional words ("mama", "dada") around 12 months.' },
    { emoji:'🍽️', pl:'Samodzielne jedzenie palcami — celowe brudzenie się to nauka.', en:'Self-feeding with fingers — intentional messiness is learning.' },
    { emoji:'📖', pl:'10 min dziennie czytania = ~3 mln więcej słów do 5. roku życia.', en:'10 min daily reading = ~3 million more words heard by age 5.' },
    { emoji:'🎨', pl:'Gryzaki z agrestem, bananem, marchewką — smaki + masaż dziąseł.', en:'Teethers with banana/carrot/cucumber — flavor + gum massage.' },
    { emoji:'🤝', pl:'Zaczyna naśladować — czyści stół, rozmawia "przez telefon". Modeluj.', en:'Starts imitating — wipes table, "talks" on phone. Model behavior.' },
    { emoji:'😴', pl:'Norma snu: 11-14h (z 1-2 drzemkami). Poniżej 10h = zmęczenie kumulacja.', en:'Sleep norm: 11-14h (with 1-2 naps). Below 10h = accumulated fatigue.' },
    { emoji:'🧠', pl:'Zaczyna rozumieć proste polecenia: "daj", "pokaż gdzie...".', en:'Begins understanding simple commands: "give", "show me...".' },
    { emoji:'🎈', pl:'Zabawy "cause and effect" (wrzucanie, wyjmowanie) = nauka fizyki.', en:'Cause-effect play (drop, pick up) = learning physics.' },
    { emoji:'🌞', pl:'Witamina D 400-600 IU/dzień do końca 2. r.ż. (rekomendacja PL).', en:'Vitamin D 400-600 IU/day until age 2 (pediatric recommendation).' },
  ],

  // ─── 12+ miesięcy ────────────────────────────────────────────────────────
  '12+': [
    { emoji:'🗣️', pl:'Eksplozja słownictwa ok. 18 mies. — z 10 do 50+ słów w miesiąc.', en:'Vocabulary explosion around 18 months — from 10 to 50+ words in a month.' },
    { emoji:'🎭', pl:'Zabawa symboliczna (udaje picie, telefon) to skok poznawczy.', en:'Symbolic play (pretend drinking, phone) is a cognitive leap.' },
    { emoji:'😤', pl:'"Terrible twos" to zdrowa faza niezależności, nie zła wola.', en:'"Terrible twos" is a healthy independence phase, not defiance.' },
    { emoji:'🎨', pl:'Bazgroły ok. 15 mies. — pierwsze wyrażanie myśli na papierze.', en:'Scribbles around 15 months — first expression of thought on paper.' },
    { emoji:'🏃', pl:'Bieganie ok. 18 mies., wspinanie po meblach = potrzeba ruchu.', en:'Running around 18 months, climbing furniture = need for movement.' },
    { emoji:'🍽️', pl:'"Food jag" (odmawia tego co kochał) = norma, przyjdzie i minie.', en:'"Food jag" (refuses what was loved) = normal, will pass.' },
    { emoji:'💤', pl:'Przejście z 2 drzemek na 1 ok. 15-18 mies.', en:'Transition from 2 naps to 1 around 15-18 months.' },
    { emoji:'👥', pl:'"Parallel play" — bawi się obok innych dzieci, nie z nimi. Normalne do ~3 lat.', en:'"Parallel play" — plays next to other kids, not with them. Normal to ~3 years.' },
    { emoji:'🚽', pl:'Gotowość do nocnika ok. 18-36 mies. — nie zmuszaj.', en:'Potty readiness around 18-36 months — never force it.' },
    { emoji:'❤️', pl:'Umie nazwać emocje — "smutny", "zły". Pomóż etykietować uczucia.', en:'Can name emotions — "sad", "angry". Help label feelings.' },
  ],
}

function pickBucket(ageMonths) {
  if (ageMonths < 3)  return '0-3'
  if (ageMonths < 6)  return '3-6'
  if (ageMonths < 9)  return '6-9'
  if (ageMonths < 12) return '9-12'
  return '12+'
}

/**
 * Zwraca wskazówkę na dzisiaj, deterministycznie dla danego dnia + wieku.
 * Ta sama data = ta sama wskazówka (stabilność).
 */
export function getTipForToday(ageMonths, locale = 'pl') {
  const bucket = pickBucket(ageMonths || 0)
  const tips = TIPS[bucket]
  const today = new Date()
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  )
  const tip = tips[dayOfYear % tips.length]
  return {
    emoji: tip.emoji,
    text: locale === 'en' ? tip.en : tip.pl,
  }
}
