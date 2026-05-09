/**
 * Polska — informacje referencyjne z Charakterystyk Produktów Leczniczych (ChPL).
 *
 * UWAGA: nie wyliczamy dawek (od v2.7.1). Pokazujemy fakty z ulotki:
 * minimalny wiek, max dawki/24h, odstęp między dawkami.
 *
 * Źródło: ChPL paracetamol (Apap, Panadol Baby, Calpol), ChPL ibuprofen
 * (Ibufen, Nurofen dla dzieci), publikowane przez URPLWMiPB.
 *
 * Wartości CELOWO konserwatywne — odstępy 4h dla paracetamolu są na granicy
 * ChPL, my zalecamy 4h+ dla bezpieczeństwa.
 */

export default {
  country: 'PL',
  source: 'ChPL (Charakterystyki Produktów Leczniczych)',
  sourceLabel: 'URPLWMiPB',
  sourceUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl',

  paracetamol: {
    name: 'Paracetamol',
    brands: ['Apap', 'Panadol Baby', 'Calpol', 'Efferalgan'],
    minAge: 'od urodzenia (u niemowląt < 3 mies. tylko pod kontrolą lekarza)',
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 60,  // tylko jako fakt, NIE używane do wyliczeń
    contraindications: ['ciężka niewydolność wątroby', 'uczulenie na paracetamol'],
  },

  ibuprofen: {
    name: 'Ibuprofen',
    brands: ['Ibufen dla dzieci', 'Nurofen dla dzieci', 'MIG'],
    minAge: 'od 3. miesiąca życia (zazwyczaj wymagana waga > 5kg)',
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 30,
    contraindications: [
      'odwodnienie / mała ilość moczu',
      'wymioty / biegunka',
      'astma oskrzelowa',
      'ospa wietrzna (zwiększone ryzyko infekcji)',
      'choroba nerek',
    ],
  },
}
