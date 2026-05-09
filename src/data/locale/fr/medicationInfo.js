/**
 * France — informations issues du RCP (Résumé des Caractéristiques du Produit).
 *
 * Source: RCP publié par l'ANSM (Agence nationale de sécurité du médicament)
 * et accessible via base de données publique medicaments.gouv.fr et VIDAL.
 *
 * https://base-donnees-publique.medicaments.gouv.fr
 *
 * UWAGA: TY tylko prezentujesz publiczne fakty z RCP. NIE wyliczasz
 * indywidualnej dawki — zostawiamy to dla Pédiatre.
 */

export default {
  country: 'FR',
  source: 'RCP (Résumé des Caractéristiques du Produit)',
  sourceLabel: 'ANSM / VIDAL',
  sourceUrl: 'https://base-donnees-publique.medicaments.gouv.fr',

  paracetamol: {
    name: 'Paracétamol',
    brands: ['Doliprane', 'Efferalgan', 'Dafalgan', 'Paracétamol Mylan'],
    minAge: 'dès la naissance (nourrissons < 3 mois uniquement sous surveillance médicale)',
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 60,
    contraindications: ['insuffisance hépatique sévère', 'allergie au paracétamol'],
  },

  ibuprofen: {
    name: 'Ibuprofène',
    brands: ['Advil', 'Nurofen', 'Antarène', 'Ibuprofène Mylan'],
    minAge: 'à partir de 3 mois (généralement > 5 kg de poids corporel)',
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 30,
    contraindications: [
      'déshydratation / diminution de la diurèse',
      'vomissements / diarrhée',
      'asthme bronchique',
      'varicelle (risque accru d\'infection)',
      'maladie rénale',
    ],
  },
}
