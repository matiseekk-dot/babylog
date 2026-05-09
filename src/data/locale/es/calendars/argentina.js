/**
 * Argentina — Calendario Nacional de Vacunación.
 *
 * Source: Ministerio de Salud de la Nación Argentina.
 * https://www.argentina.gob.ar/salud/vacunas/calendario-nacional
 *
 * Vacunas obligatorias y gratuitas (Ley 27.491 — vacunación obligatoria).
 * Updated: 2024.
 */

export default {
  country: 'AR',
  countryName: 'Argentina',
  scheduleName: 'Calendario Nacional Argentina',
  scheduleNameFull: 'Calendario Nacional de Vacunación (Ministerio de Salud)',
  source: 'https://www.argentina.gob.ar/salud/vacunas/calendario-nacional',
  sourceLabel: 'Ministerio de Salud de la Nación',
  lastUpdated: '2024',

  schedule: [
    { ageMonths: 0, name: 'BCG (tuberculosis) — dosis única',                  type: 'mandatory', timing: 'al nacer (antes del egreso)' },
    { ageMonths: 0, name: 'Hepatitis B — dosis al nacer',                       type: 'mandatory', timing: 'primeras 12 horas' },

    { ageMonths: 2, name: 'Quíntuple (DTP+Hib+HepB) — 1ª',                      type: 'mandatory' },
    { ageMonths: 2, name: 'Sabin (poliomielitis VPI/VOP) — 1ª',                 type: 'mandatory' },
    { ageMonths: 2, name: 'Neumococo conjugada — 1ª',                            type: 'mandatory' },
    { ageMonths: 2, name: 'Rotavirus — 1ª dosis',                               type: 'mandatory' },

    { ageMonths: 4, name: 'Quíntuple — 2ª',                                      type: 'mandatory' },
    { ageMonths: 4, name: 'Sabin — 2ª',                                          type: 'mandatory' },
    { ageMonths: 4, name: 'Neumococo — 2ª',                                      type: 'mandatory' },
    { ageMonths: 4, name: 'Rotavirus — 2ª dosis',                               type: 'mandatory' },

    { ageMonths: 6, name: 'Quíntuple — 3ª',                                      type: 'mandatory' },
    { ageMonths: 6, name: 'Sabin — 3ª',                                          type: 'mandatory' },
    { ageMonths: 6, name: 'Gripe (anual)',                                       type: 'mandatory', timing: 'antes de la temporada' },

    { ageMonths: 12, name: 'Triple Viral (Sarampión-Rubéola-Paperas) — 1ª',     type: 'mandatory' },
    { ageMonths: 12, name: 'Neumococo — refuerzo',                              type: 'mandatory' },
    { ageMonths: 12, name: 'Hepatitis A — dosis única',                          type: 'mandatory' },

    { ageMonths: 15, name: 'Varicela — 1ª dosis',                               type: 'mandatory', timing: '15 meses' },

    { ageMonths: 18, name: 'Cuádruple (DTP+Hib) — refuerzo',                    type: 'mandatory' },
    { ageMonths: 18, name: 'Sabin — refuerzo',                                  type: 'mandatory' },

    { ageMonths: 60, name: 'Triple Viral — 2ª dosis (refuerzo)',                type: 'mandatory', visit: 'Ingreso escolar' },
    { ageMonths: 60, name: 'Triple Bacteriana (DTP) — refuerzo',                type: 'mandatory' },
    { ageMonths: 60, name: 'Sabin — refuerzo',                                  type: 'mandatory' },
    { ageMonths: 60, name: 'Varicela — 2ª dosis',                               type: 'mandatory' },
  ],

  reminderTextKey: 'vacc.reminder.es',
  disclaimerKey: 'vacc.disclaimer.es',

  // Controles del niño sano (Argentina)
  uUntersuchungen: [
    { id: 'C1',  label: 'Recién nacido', ageRange: 'al nacer',  desc: 'Examen neonatal, Apgar, BCG, HepB' },
    { id: 'C2',  label: '7 días',        ageRange: '7 días',    desc: 'Primera consulta, pesquisa neonatal' },
    { id: 'C3',  label: '1 mes',         ageRange: '1 mes',     desc: 'Crecimiento, lactancia' },
    { id: 'C4',  label: '2 meses',       ageRange: '2 meses',   desc: 'Vacunas + control' },
    { id: 'C5',  label: '4 meses',       ageRange: '4 meses',   desc: 'Vacunas + control' },
    { id: 'C6',  label: '6 meses',       ageRange: '6 meses',   desc: 'Inicio alimentación' },
    { id: 'C7',  label: '9 meses',       ageRange: '9 meses',   desc: 'Desarrollo motor' },
    { id: 'C8',  label: '12 meses',      ageRange: '12 meses',  desc: 'Triple Viral + HepA' },
    { id: 'C9',  label: '18 meses',      ageRange: '18 meses',  desc: 'Cuádruple refuerzo' },
    { id: 'C10', label: '2 años',        ageRange: '2 años',    desc: 'Control integral' },
    { id: 'C11', label: '3 años',        ageRange: '3 años',    desc: 'Lenguaje, conducta' },
    { id: 'C12', label: '5 años',        ageRange: '5 años',    desc: 'Ingreso escolar — refuerzos' },
  ],
}
