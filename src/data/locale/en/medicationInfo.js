/**
 * EN locale — medication reference info (international default).
 *
 * Phase 2 split: en-US (FDA labels) vs en-GB (BNFC = British National Formulary
 * for Children).
 *
 * Aktualnie używamy USA FDA labels jako default. UK + AU mają nieco
 * inne brand names ale dose info bardzo podobne.
 *
 * Source: FDA package inserts; AAP Committee on Drugs guidance.
 */

export default {
  country: 'US',
  source: 'FDA Drug Labels',
  sourceLabel: 'U.S. Food and Drug Administration',
  sourceUrl: 'https://www.fda.gov/drugs',

  paracetamol: {
    name: 'Acetaminophen',  // US naming
    brands: ['Tylenol Infants/Children', 'Children\'s Tylenol'],
    minAge: 'from birth (consult pediatrician for infants under 3 months)',
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 75,  // FDA standard, slightly higher than EU
    contraindications: ['severe liver disease', 'allergy to acetaminophen'],
  },

  ibuprofen: {
    name: 'Ibuprofen',
    brands: ['Children\'s Motrin', 'Children\'s Advil'],
    minAge: 'from 6 months (per FDA label, some pediatricians from 3 months with weight > 5kg)',
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 40,
    contraindications: [
      'dehydration / decreased urine output',
      'vomiting / diarrhea',
      'asthma',
      'chickenpox (increased infection risk)',
      'kidney disease',
    ],
  },
}
