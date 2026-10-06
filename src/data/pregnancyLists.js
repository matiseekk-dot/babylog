// Listy do odhaczania w trybie ciąży (v2.17.6): torba do szpitala i wyprawka.
// Torba zgodna z artykułami na skudev.pl (skudev-landing/_tools/content/pregnancy.mjs),
// dokumenty według kraju (null = pozycja nie dotyczy tego języka).
// Wyprawka: podstawy bez gadżetów; sen według zaleceń AAP (twardy materac,
// śpiworek zamiast kołdry i poduszki).
//
// id pozycji są stałe (zapisane odhaczenia w lists_{profileId}), teksty można zmieniać.

const L = (pl, en, de, fr, es) => ({ pl, en, de, fr, es })

export const LISTS = {
  bag: {
    groups: [
      {
        id: 'docs',
        title: L('Dokumenty', 'Documents', 'Dokumente', 'Papiers', 'Documentos'),
        items: [
          { id: 'id', text: L('Dowód osobisty', 'Photo ID, if your hospital asks for it', 'Personalausweis', 'Pièce d’identité', 'DNI o pasaporte') },
          { id: 'notes', text: L('Karta przebiegu ciąży i wyniki badań', 'Maternity notes and test results', 'Mutterpass', 'Dossier de grossesse et résultats d’examens', 'Cartilla del embarazo y analíticas') },
          { id: 'insurance', text: L(null, null, 'Versichertenkarte', 'Carte Vitale et carte de mutuelle', 'Tarjeta sanitaria') },
          { id: 'plan', text: L('Plan porodu, jeśli go masz', 'Birth plan, if you have one', 'Geburtsplan, falls vorhanden', 'Projet de naissance, si vous en avez un', 'Plan de parto, si lo tienes') },
        ],
      },
      {
        id: 'mom',
        title: L('Dla mamy', 'For you', 'Für Sie', 'Pour vous', 'Para ti'),
        items: [
          { id: 'nightdress', text: L('2 do 3 koszul rozpinanych do karmienia', '2 or 3 front-opening nightdresses', '2 bis 3 Stillnachthemden', '2 ou 3 chemises de nuit d’allaitement', '2 o 3 camisones de lactancia') },
          { id: 'robe', text: L('Szlafrok, kapcie i klapki pod prysznic', 'Dressing gown, slippers and flip-flops', 'Bademantel, Hausschuhe, Badeschlappen', 'Peignoir, chaussons et tongs', 'Bata, zapatillas y chanclas') },
          { id: 'pads', text: L('Podpaski i majtki poporodowe', 'Maternity pads and disposable underwear', 'Wochenbettbinden und Netzslips', 'Serviettes de maternité et culottes jetables', 'Compresas tocológicas y braguitas desechables') },
          { id: 'nursingbra', text: L('Biustonosz do karmienia i wkładki', 'Nursing bra and breast pads', 'Still-BH und Stilleinlagen', 'Soutien-gorge d’allaitement et coussinets', 'Sujetador de lactancia y discos') },
          { id: 'toiletries', text: L('Kosmetyki, ręcznik, gumka do włosów', 'Toiletries, towel, hair tie', 'Kosmetik, Handtuch, Haargummi', 'Trousse de toilette, serviette, élastique', 'Neceser, toalla, goma del pelo') },
          { id: 'snacks', text: L('Woda i przekąski', 'Water and snacks', 'Wasser und Snacks', 'Eau et en-cas', 'Agua y tentempiés') },
          { id: 'charger', text: L('Ładowarka z długim kablem', 'Phone charger with a long cable', 'Ladekabel, möglichst lang', 'Chargeur avec un long câble', 'Cargador con cable largo') },
          { id: 'clothes', text: L('Luźne ubranie na wyjście', 'Loose clothes to go home in', 'Lockere Kleidung für den Heimweg', 'Vêtements amples pour la sortie', 'Ropa holgada para la salida') },
        ],
      },
      {
        id: 'baby',
        title: L('Dla dziecka', 'For your baby', 'Für das Baby', 'Pour bébé', 'Para el bebé'),
        items: [
          { id: 'babyclothes', text: L('Body i pajacyki w rozmiarze 56 (2 do 3 komplety)', 'Bodysuits and sleepsuits, newborn size (2 or 3 sets)', 'Bodys und Strampler in Größe 50 oder 56', 'Bodies et pyjamas taille naissance', 'Bodies y pijamas de recién nacido') },
          { id: 'hat', text: L('Czapeczka i skarpetki', 'Hat and socks', 'Mützchen und Söckchen', 'Bonnet et chaussettes', 'Gorrito y calcetines') },
          { id: 'diapers', text: L('Pieluszki 1 i chusteczki, jeśli szpital nie daje', 'Newborn nappies and wipes, if not provided', 'Windeln und Feuchttücher, falls nötig', 'Couches et lingettes, si besoin', 'Pañales y toallitas, si hace falta') },
          { id: 'blanket', text: L('Kocyk albo rożek', 'Blanket', 'Decke', 'Couverture ou gigoteuse', 'Mantita o arrullo') },
          { id: 'outfit', text: L('Ubranko na wyjście do pogody', 'Going-home outfit for the weather', 'Outfit für den Heimweg', 'Tenue de sortie adaptée à la météo', 'Ropa de salida según el tiempo') },
          { id: 'carseat', text: L('Fotelik samochodowy w aucie', 'Rear-facing car seat in the car', 'Babyschale im Auto', 'Siège auto dans la voiture', 'Silla de coche instalada') },
        ],
      },
      {
        id: 'partner',
        title: L('Dla osoby towarzyszącej', 'For your birth partner', 'Für die Begleitperson', 'Pour l’accompagnant', 'Para tu acompañante'),
        items: [
          { id: 'partnerbag', text: L('Ubranie na zmianę, przekąski, ładowarka', 'Change of clothes, snacks, charger', 'Wechselkleidung, Snacks, Ladegerät', 'Vêtements de rechange, en-cas, chargeur', 'Ropa de recambio, tentempiés, cargador') },
          { id: 'parking', text: L('Karta albo drobne na parking', 'Card or change for parking', 'Karte oder Kleingeld für den Parkplatz', 'Carte ou monnaie pour le parking', 'Tarjeta o monedas para el parking') },
        ],
      },
    ],
  },
  layette: {
    groups: [
      {
        id: 'sleep',
        title: L('Sen', 'Sleep', 'Schlafen', 'Sommeil', 'Sueño'),
        items: [
          { id: 'crib', text: L('Łóżeczko albo kołyska z twardym materacem', 'Cot or crib with a firm mattress', 'Babybett oder Wiege mit fester Matratze', 'Lit ou berceau avec matelas ferme', 'Cuna o minicuna con colchón firme') },
          { id: 'sheets', text: L('2 do 3 prześcieradeł z gumką', '2 or 3 fitted sheets', '2 bis 3 Spannbettlaken', '2 ou 3 draps-housses', '2 o 3 sábanas bajeras') },
          { id: 'sleepbag', text: L('Śpiworek zamiast kołdry i poduszki', 'Baby sleeping bag instead of duvet and pillow', 'Babyschlafsack statt Decke und Kissen', 'Gigoteuse à la place de couette et oreiller', 'Saco de dormir en vez de edredón y almohada') },
        ],
      },
      {
        id: 'clothes',
        title: L('Ubranka', 'Clothes', 'Kleidung', 'Vêtements', 'Ropa'),
        items: [
          { id: 'bodies', text: L('5 do 7 body w rozmiarach 56 i 62', '5 to 7 bodysuits, newborn and 0 to 3 months', '5 bis 7 Bodys in Größe 56 und 62', '5 à 7 bodies taille naissance et 1 mois', '5 a 7 bodies de 0 y 1 mes') },
          { id: 'sleepsuits', text: L('5 do 7 pajacyków', '5 to 7 sleepsuits', '5 bis 7 Strampler', '5 à 7 pyjamas', '5 a 7 pijamas') },
          { id: 'hats', text: L('2 czapeczki i skarpetki', '2 hats and socks', '2 Mützchen und Söckchen', '2 bonnets et chaussettes', '2 gorritos y calcetines') },
          { id: 'outerwear', text: L('Ciepłe okrycie albo kombinezon do pory roku', 'Warm outerwear for the season', 'Warme Oberbekleidung je nach Jahreszeit', 'Combinaison ou manteau selon la saison', 'Abrigo o buzo según la estación') },
        ],
      },
      {
        id: 'care',
        title: L('Pielęgnacja', 'Care', 'Pflege', 'Soins', 'Cuidado'),
        items: [
          { id: 'nappies', text: L('Pieluszki w rozmiarze 1 albo 2', 'Nappies in size 1 or 2', 'Windeln in Größe 1 oder 2', 'Couches taille 1 ou 2', 'Pañales talla 1 o 2') },
          { id: 'wipes', text: L('Chusteczki albo waciki i ciepła woda', 'Wipes, or cotton pads and warm water', 'Feuchttücher oder Waschlappen und Wasser', 'Lingettes ou cotons et eau tiède', 'Toallitas o algodón y agua tibia') },
          { id: 'cream', text: L('Krem na odparzenia', 'Nappy rash cream', 'Wundschutzcreme', 'Crème pour le change', 'Crema para el culito') },
          { id: 'bath', text: L('Wanienka i 2 ręczniki z kapturem', 'Baby bath and 2 hooded towels', 'Babybadewanne und 2 Kapuzenhandtücher', 'Baignoire bébé et 2 capes de bain', 'Bañera y 2 toallas con capucha') },
          { id: 'thermometer', text: L('Termometr', 'Thermometer', 'Fieberthermometer', 'Thermomètre', 'Termómetro') },
          { id: 'nails', text: L('Nożyczki albo pilniczek do paznokci', 'Baby nail scissors or file', 'Babynagelschere oder Feile', 'Ciseaux ou lime à ongles bébé', 'Tijeras o lima de uñas para bebé') },
        ],
      },
      {
        id: 'feeding',
        title: L('Karmienie', 'Feeding', 'Füttern', 'Alimentation', 'Alimentación'),
        items: [
          { id: 'muslins', text: L('Pieluszki tetrowe albo muślinowe', 'Muslin cloths', 'Spucktücher (Mullwindeln)', 'Langes en mousseline', 'Muselinas') },
          { id: 'bottles', text: L('Butelki, jeśli planujesz mleko modyfikowane', 'Bottles, if you plan to use formula', 'Fläschchen, falls Sie Säuglingsnahrung planen', 'Biberons, si vous prévoyez le lait infantile', 'Biberones, si vas a dar leche de fórmula') },
        ],
      },
      {
        id: 'out',
        title: L('Na spacer i do auta', 'Out and about', 'Unterwegs', 'Sorties', 'Paseo y coche'),
        items: [
          { id: 'carseat2', text: L('Fotelik samochodowy montowany tyłem', 'Rear-facing car seat', 'Rückwärtsgerichtete Babyschale', 'Siège auto dos à la route', 'Silla de coche a contramarcha') },
          { id: 'pram', text: L('Wózek z gondolą', 'Pram with a carrycot', 'Kinderwagen mit Babywanne', 'Poussette avec nacelle', 'Cochecito con capazo') },
          { id: 'sling', text: L('Chusta albo nosidło (opcjonalnie)', 'Sling or carrier (optional)', 'Tragetuch oder Trage (optional)', 'Écharpe ou porte-bébé (facultatif)', 'Fular o mochila (opcional)') },
        ],
      },
    ],
  },
}

/** Grupy i pozycje w danym języku (bez pozycji, które go nie dotyczą). */
export function listFor(listId, locale) {
  const list = LISTS[listId]
  if (!list) return []
  return list.groups.map(g => ({
    id: g.id,
    title: g.title[locale] || g.title.en,
    items: g.items.map(it => ({ id: it.id, text: it.text[locale] === undefined ? it.text.en : it.text[locale] })).filter(it => it.text),
  }))
}

/** { done, total } z uwzględnieniem własnych pozycji. */
export function listProgress(listId, locale, state) {
  const groups = listFor(listId, locale)
  const checked = state?.[listId] || {}
  const custom = state?.custom?.[listId] || []
  const ids = groups.flatMap(g => g.items.map(it => it.id))
  return {
    done: ids.filter(id => checked[id]).length + custom.filter(c => c.done).length,
    total: ids.length + custom.length,
  }
}
