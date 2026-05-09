/**
 * STIKO — Ständige Impfkommission (Niemcy).
 *
 * Quelle: Empfehlungen der STIKO am RKI, Epidemiologisches Bulletin 2024/4.
 * https://www.rki.de/DE/Content/Kommissionen/STIKO/Empfehlungen
 *
 * UWAGA: TY tylko prezentujesz oficjalny niemiecki harmonogram. NIE
 * indywidualizujesz dla konkretnego dziecka. Berater jest Kinderarzt.
 *
 * Wartości pokazują stand 2024 (V Plus 2/3/4, MMR-V, etc.). Trzeba
 * aktualizować przy publikacji nowych Empfehlungen STIKO (zwykle co 2 lata).
 */

export default {
  country: 'DE',
  countryName: 'Deutschland',
  scheduleName: 'STIKO',
  scheduleNameFull: 'Ständige Impfkommission (am RKI)',
  source: 'https://www.rki.de/DE/Content/Kommissionen/STIKO/Empfehlungen',
  sourceLabel: 'Robert Koch-Institut (RKI)',
  lastUpdated: '2024-01',

  schedule: [
    // U-Untersuchungen alignment: U2 (3-10 Tag), U3 (4-5 Wochen), U4 (3-4 Monate),
    // U5 (6-7 Monate), U6 (10-12 Monate), U7 (21-24 Monate), U7a (34-36 Monate),
    // U8 (46-48 Monate), U9 (60-64 Monate)
    //
    // Wiele szczepień jest "zu U-Termin" — łączone z wizytami profilaktycznymi.

    { ageMonths: 2,  name: 'Rotaviren (RV) — 1. Dosis',  type: 'mandatory', timing: 'ab 6. Lebenswoche', uVisit: null },
    { ageMonths: 2,  name: '6-fach (D-T-aP-Hib-IPV-HepB) — 1. Dosis', type: 'mandatory', uVisit: 'U4' },
    { ageMonths: 2,  name: 'Pneumokokken (PCV) — 1. Dosis', type: 'mandatory', uVisit: 'U4' },

    { ageMonths: 3,  name: 'Rotaviren — 2. Dosis (oder 3. je nach Impfstoff)',  type: 'mandatory' },

    { ageMonths: 4,  name: '6-fach — 2. Dosis (z aktualizacją 2020 odpadła, teraz tylko 2/4/11 mies.)', type: 'mandatory', note: 'STIKO 2020+: 2/4/11 schemat (statt 2/3/4/11)' },
    { ageMonths: 4,  name: 'Pneumokokken — 2. Dosis', type: 'mandatory' },

    { ageMonths: 11, name: '6-fach — 3. (Auffrischung)', type: 'mandatory', uVisit: 'U6' },
    { ageMonths: 11, name: 'Pneumokokken — 3. (Auffrischung)', type: 'mandatory' },
    { ageMonths: 11, name: 'MMR (Masern-Mumps-Röteln) — 1. Dosis', type: 'mandatory' },
    { ageMonths: 11, name: 'Varizellen (Windpocken) — 1. Dosis', type: 'mandatory' },
    { ageMonths: 12, name: 'Meningokokken C — 1. Dosis', type: 'mandatory', timing: 'ab 12. Monat' },

    { ageMonths: 15, name: 'MMR — 2. Dosis (mind. 4 Wochen Abstand)', type: 'mandatory' },
    { ageMonths: 15, name: 'Varizellen — 2. Dosis', type: 'mandatory' },

    { ageMonths: 60, name: 'D-T-aP — Auffrischung (5-6 Jahre)', type: 'mandatory', uVisit: 'U9' },
  ],

  reminderTextKey: 'vacc.reminder.de',
  disclaimerKey: 'vacc.disclaimer.de',

  // Bonus: niemiecki system U-Untersuchungen (9 wizyt profilaktycznych).
  // To NIE są szczepienia, to OSOBNE wizyty pediatryczne wymagane przez
  // niemiecki system zdrowia publicznego. Idealny match dla naszego PDF
  // dla pediatry — Vorsorgeheft.
  uUntersuchungen: [
    { id: 'U1', label: 'U1', ageRange: 'sofort nach Geburt', desc: 'Erstuntersuchung im Kreißsaal' },
    { id: 'U2', label: 'U2', ageRange: '3.-10. Lebenstag',   desc: 'Neugeborenen-Basisuntersuchung' },
    { id: 'U3', label: 'U3', ageRange: '4.-5. Lebenswoche',  desc: 'Erste Untersuchung beim Kinderarzt' },
    { id: 'U4', label: 'U4', ageRange: '3.-4. Monat',        desc: 'Bewegungsfähigkeit, Sehen, Hören' },
    { id: 'U5', label: 'U5', ageRange: '6.-7. Monat',        desc: 'Sprachentwicklung, Greifen' },
    { id: 'U6', label: 'U6', ageRange: '10.-12. Monat',      desc: 'Entwicklungsschritte 1. Lebensjahr' },
    { id: 'U7', label: 'U7', ageRange: '21.-24. Monat',      desc: 'Sprache, Motorik' },
    { id: 'U7a',label: 'U7a',ageRange: '34.-36. Monat',      desc: 'Verhalten, soziales Spiel' },
    { id: 'U8', label: 'U8', ageRange: '46.-48. Monat',      desc: 'Vorschulreife' },
    { id: 'U9', label: 'U9', ageRange: '60.-64. Monat',      desc: 'Einschulungsuntersuchung' },
  ],
}
