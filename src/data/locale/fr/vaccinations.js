/**
 * Calendrier des vaccinations (France).
 *
 * Source: Calendrier des vaccinations et recommandations vaccinales 2024,
 * Santé publique France / HCSP / Ministère de la Santé.
 * https://sante.gouv.fr/prevention-en-sante/preserver-sa-sante/vaccination/calendrier-vaccinal
 *
 * UWAGA: TY tylko prezentujesz oficjalny francuski harmonogram. NIE
 * indywidualizujesz dla konkretnego dziecka. Conseil = Pédiatre / Médecin traitant.
 *
 * 11 vaccins obligatoires depuis 2018 pour les enfants nés à partir du 1er janvier 2018.
 *
 * Wartości pokazują stan 2024. Aktualizuje się co roku w czerwcu (publikacja BEH).
 */

export default {
  country: 'FR',
  countryName: 'France',
  scheduleName: 'Calendrier vaccinal France',
  scheduleNameFull: 'Calendrier des vaccinations (Santé publique France / HCSP)',
  source: 'https://sante.gouv.fr/prevention-en-sante/preserver-sa-sante/vaccination/calendrier-vaccinal',
  sourceLabel: 'Santé publique France / HCSP',
  lastUpdated: '2024-06',

  schedule: [
    // 11 vaccins obligatoires (depuis 2018) :
    // DTP (diphtérie, tétanos, poliomyélite), Coqueluche, Hib, HepB,
    // Pneumocoque, Méningocoque C, ROR (rougeole-oreillons-rubéole)
    //
    // Schéma simplifié 2/4/11 mois (depuis 2013).

    { ageMonths: 2,  name: 'Hexavalent (DTP + Coqueluche + Hib + HépB) — 1ère dose', type: 'mandatory', visit: 'Examen 2 mois' },
    { ageMonths: 2,  name: 'Pneumocoque (PCV13) — 1ère dose', type: 'mandatory', visit: 'Examen 2 mois' },
    { ageMonths: 2,  name: 'Rotavirus — 1ère dose (recommandé)', type: 'recommended', timing: 'à partir de 6 semaines' },

    { ageMonths: 3,  name: 'Rotavirus — 2ème dose (recommandé)', type: 'recommended' },

    { ageMonths: 4,  name: 'Hexavalent — 2ème dose', type: 'mandatory', visit: 'Examen 4 mois' },
    { ageMonths: 4,  name: 'Pneumocoque — 2ème dose', type: 'mandatory' },
    { ageMonths: 4,  name: 'Rotavirus — 3ème dose si schéma 3 doses', type: 'recommended' },

    { ageMonths: 5,  name: 'Méningocoque B — 1ère dose (recommandé depuis 2022)', type: 'recommended' },

    { ageMonths: 6,  name: 'Méningocoque B — 2ème dose', type: 'recommended' },

    { ageMonths: 11, name: 'Hexavalent — 3ème dose (rappel)', type: 'mandatory', visit: 'Examen 9 mois' },
    { ageMonths: 11, name: 'Pneumocoque — 3ème dose (rappel)', type: 'mandatory' },

    { ageMonths: 12, name: 'ROR (Rougeole-Oreillons-Rubéole) — 1ère dose', type: 'mandatory', visit: 'Examen 12 mois' },
    { ageMonths: 12, name: 'Méningocoque C — 1ère dose', type: 'mandatory' },
    { ageMonths: 12, name: 'Méningocoque B — 3ème dose (rappel)', type: 'recommended' },

    { ageMonths: 16, name: 'ROR — 2ème dose (entre 16-18 mois)', type: 'mandatory' },
    { ageMonths: 18, name: 'Méningocoque C — rappel', type: 'mandatory' },

    { ageMonths: 72, name: 'DTP-Coqueluche — rappel (6 ans)', type: 'mandatory', visit: 'Examen 6 ans' },
  ],

  reminderTextKey: 'vacc.reminder.fr',
  disclaimerKey: 'vacc.disclaimer.fr',

  // Examens obligatoires de l'enfant (système français)
  // 20 examens médicaux obligatoires de la naissance à 16 ans.
  // 14 examens dans les 3 premières années — couverts ici.
  // Source: Code de la santé publique L2132-2 / Carnet de santé.
  uUntersuchungen: [
    { id: 'EX1',  label: 'À la naissance', ageRange: 'jour de la naissance', desc: 'Examen néonatal (Apgar, malformations)' },
    { id: 'EX2',  label: 'J8',             ageRange: '8 jours',             desc: 'Premier examen pédiatrique (certificat 8 jours)' },
    { id: 'EX3',  label: '1 mois',         ageRange: '1 mois',              desc: 'Suivi croissance, alimentation' },
    { id: 'EX4',  label: '2 mois',         ageRange: '2 mois',              desc: 'Examen + 1ères vaccinations' },
    { id: 'EX5',  label: '3 mois',         ageRange: '3 mois',              desc: 'Suivi développement' },
    { id: 'EX6',  label: '4 mois',         ageRange: '4 mois',              desc: 'Examen + vaccinations (2ème série)' },
    { id: 'EX7',  label: '5 mois',         ageRange: '5 mois',              desc: 'Vaccinations (méningo B)' },
    { id: 'EX8',  label: '9 mois',         ageRange: '9 mois',              desc: 'Examen obligatoire (certificat 9 mois)' },
    { id: 'EX9',  label: '12 mois',        ageRange: '12 mois',             desc: 'Vaccinations ROR + suivi' },
    { id: 'EX10', label: '16-18 mois',     ageRange: '16-18 mois',          desc: 'ROR rappel + suivi' },
    { id: 'EX11', label: '24 mois',        ageRange: '24 mois',             desc: 'Examen obligatoire (certificat 24 mois)' },
    { id: 'EX12', label: '3 ans',          ageRange: '3 ans',               desc: 'Suivi développement' },
    { id: 'EX13', label: '4 ans',          ageRange: '4 ans',               desc: 'Bilan' },
    { id: 'EX14', label: '5-6 ans',        ageRange: '5-6 ans',             desc: 'Bilan scolaire + DTP rappel' },
  ],
}
