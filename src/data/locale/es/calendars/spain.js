/**
 * España — Calendario común de vacunación (CISNS / CAV-AEP).
 *
 * Source: https://vacunasaep.org/profesionales/calendario-de-vacunaciones-de-la-aep
 * https://www.sanidad.gob.es/areas/promocionPrevencion/vacunaciones/
 *
 * Esquema 2/4/11 meses (DTPa-Hib-VPI-HepB hexavalente, Pneumocócica, ROR).
 * Updated: 2024-09 (CAV-AEP recomendaciones anuales).
 */

export default {
  country: 'ES',
  countryName: 'España',
  scheduleName: 'Calendario AEP',
  scheduleNameFull: 'Calendario común de vacunación (CISNS / CAV-AEP)',
  source: 'https://vacunasaep.org/profesionales/calendario-de-vacunaciones-de-la-aep',
  sourceLabel: 'CAV-AEP / Ministerio de Sanidad',
  lastUpdated: '2024-09',

  schedule: [
    { ageMonths: 2,  name: 'Hexavalente (DTPa + Hib + VPI + HepB) — 1ª dosis', type: 'mandatory', visit: 'Revisión 2 meses' },
    { ageMonths: 2,  name: 'Pneumocócica (VNC13) — 1ª dosis', type: 'mandatory', visit: 'Revisión 2 meses' },
    { ageMonths: 2,  name: 'Rotavirus — 1ª dosis (recomendada CAV-AEP)', type: 'recommended', timing: 'desde las 6 semanas' },
    { ageMonths: 2,  name: 'Meningococo B — 1ª dosis (CAV-AEP)', type: 'recommended' },

    { ageMonths: 3,  name: 'Rotavirus — 2ª dosis', type: 'recommended' },

    { ageMonths: 4,  name: 'Hexavalente — 2ª dosis', type: 'mandatory', visit: 'Revisión 4 meses' },
    { ageMonths: 4,  name: 'Pneumocócica — 2ª dosis', type: 'mandatory' },
    { ageMonths: 4,  name: 'Meningococo B — 2ª dosis', type: 'recommended' },
    { ageMonths: 4,  name: 'Rotavirus — 3ª dosis (si esquema 3 dosis)', type: 'recommended' },

    { ageMonths: 11, name: 'Hexavalente — 3ª dosis (refuerzo)', type: 'mandatory', visit: 'Revisión 12 meses' },
    { ageMonths: 11, name: 'Pneumocócica — 3ª dosis (refuerzo)', type: 'mandatory' },

    { ageMonths: 12, name: 'ROR (Rubéola-Sarampión-Parotiditis) — 1ª dosis', type: 'mandatory' },
    { ageMonths: 12, name: 'Meningococo C — 1ª dosis', type: 'mandatory' },
    { ageMonths: 12, name: 'Meningococo B — 3ª dosis (refuerzo)', type: 'recommended' },

    { ageMonths: 15, name: 'Varicela — 1ª dosis', type: 'mandatory', timing: '15 meses' },
    { ageMonths: 15, name: 'Meningococo ACWY — 1ª dosis', type: 'mandatory', timing: '12-15 meses' },

    { ageMonths: 36, name: 'ROR — 2ª dosis (3-4 años)', type: 'mandatory' },
    { ageMonths: 36, name: 'Varicela — 2ª dosis', type: 'mandatory' },

    { ageMonths: 72, name: 'DTPa-VPI — refuerzo (6 años)', type: 'mandatory', visit: 'Revisión 6 años' },
  ],

  reminderTextKey: 'vacc.reminder.es',
  disclaimerKey: 'vacc.disclaimer.es',

  // Revisiones del niño sano — Programa de Salud Infantil España
  uUntersuchungen: [
    { id: 'R1',  label: 'Recién nacido', ageRange: 'al nacer',         desc: 'Examen neonatal (Apgar, malformaciones)' },
    { id: 'R2',  label: '15 días',       ageRange: '7-15 días',        desc: 'Primera revisión, prueba del talón' },
    { id: 'R3',  label: '1 mes',         ageRange: '1 mes',            desc: 'Crecimiento, alimentación, lactancia' },
    { id: 'R4',  label: '2 meses',       ageRange: '2 meses',          desc: 'Revisión + 1ª serie de vacunas' },
    { id: 'R5',  label: '4 meses',       ageRange: '4 meses',          desc: 'Revisión + vacunas 2ª serie' },
    { id: 'R6',  label: '6 meses',       ageRange: '6 meses',          desc: 'Inicio alimentación complementaria' },
    { id: 'R7',  label: '11-12 meses',   ageRange: '11-12 meses',      desc: 'Revisión + vacunas refuerzo + ROR' },
    { id: 'R8',  label: '15 meses',      ageRange: '15 meses',         desc: 'Varicela + Meningococo ACWY' },
    { id: 'R9',  label: '18 meses',      ageRange: '18 meses',         desc: 'Desarrollo del lenguaje' },
    { id: 'R10', label: '2 años',        ageRange: '2 años',           desc: 'Revisión integral' },
    { id: 'R11', label: '3 años',        ageRange: '3 años',           desc: 'ROR 2ª dosis + Varicela 2ª' },
    { id: 'R12', label: '4 años',        ageRange: '4 años',           desc: 'Bilan preescolar' },
    { id: 'R13', label: '6 años',        ageRange: '6 años',           desc: 'DTPa-VPI refuerzo + revisión escolar' },
  ],
}
