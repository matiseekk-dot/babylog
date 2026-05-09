/**
 * Niemcy — informacje z Fachinformation (niemiecki odpowiednik ChPL).
 *
 * Quelle: Fachinformation ben-u-ron (paracetamol), Nurofen Junior (ibuprofen),
 * publikowane przez Bundesinstitut für Arzneimittel und Medizinprodukte (BfArM).
 *
 * https://www.bfarm.de/EN/Drugs/_node.html
 *
 * UWAGA: TY tylko prezentujesz publiczne fakty z Fachinfo. NIE wyliczasz
 * indywidualnej dawki — zostawiamy to dla Kinderarzta.
 */

export default {
  country: 'DE',
  source: 'Fachinformationen',
  sourceLabel: 'BfArM',
  sourceUrl: 'https://www.bfarm.de',

  paracetamol: {
    name: 'Paracetamol',
    brands: ['ben-u-ron', 'Paracetamol-ratiopharm', 'Paracetamol AL'],
    minAge: 'ab Geburt (Säuglinge < 3 Monate nur unter ärztlicher Aufsicht)',
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 60,
    contraindications: ['schwere Leberinsuffizienz', 'Allergie gegen Paracetamol'],
  },

  ibuprofen: {
    name: 'Ibuprofen',
    brands: ['Nurofen Junior', 'IbuHEXAL Junior', 'Ibuprofen-Saft 2%'],
    minAge: 'ab dem 3. Lebensmonat (üblicherweise > 5 kg Körpergewicht)',
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 30,
    contraindications: [
      'Dehydratation / verminderte Urinausscheidung',
      'Erbrechen / Durchfall',
      'Asthma bronchiale',
      'Windpocken (erhöhtes Infektionsrisiko)',
      'Nierenerkrankung',
    ],
  },
}
