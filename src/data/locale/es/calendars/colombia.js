/**
 * Colombia — Esquema PAI (Programa Ampliado de Inmunizaciones).
 *
 * Source: Ministerio de Salud y Protección Social de Colombia.
 * https://www.minsalud.gov.co/salud/publica/Vacunacion/Paginas/pai.aspx
 *
 * Esquema PAI 2024 — vacunas obligatorias y gratuitas.
 */

export default {
  country: 'CO',
  countryName: 'Colombia',
  scheduleName: 'Esquema PAI Colombia',
  scheduleNameFull: 'Programa Ampliado de Inmunizaciones (Ministerio de Salud)',
  source: 'https://www.minsalud.gov.co/salud/publica/Vacunacion/Paginas/pai.aspx',
  sourceLabel: 'Ministerio de Salud y Protección Social',
  lastUpdated: '2024',

  schedule: [
    { ageMonths: 0, name: 'BCG (tuberculosis)',                                  type: 'mandatory', timing: 'al nacer' },
    { ageMonths: 0, name: 'Hepatitis B — dosis al nacer',                        type: 'mandatory', timing: 'primeras 12 horas' },

    { ageMonths: 2, name: 'Pentavalente (DTP+Hib+HepB) — 1ª',                    type: 'mandatory' },
    { ageMonths: 2, name: 'Polio inactivada (VPI) — 1ª',                         type: 'mandatory' },
    { ageMonths: 2, name: 'Neumococo conjugada — 1ª',                            type: 'mandatory' },
    { ageMonths: 2, name: 'Rotavirus — 1ª dosis',                                type: 'mandatory' },

    { ageMonths: 4, name: 'Pentavalente — 2ª',                                   type: 'mandatory' },
    { ageMonths: 4, name: 'Polio inactivada — 2ª',                               type: 'mandatory' },
    { ageMonths: 4, name: 'Neumococo — 2ª',                                      type: 'mandatory' },
    { ageMonths: 4, name: 'Rotavirus — 2ª dosis',                                type: 'mandatory' },

    { ageMonths: 6, name: 'Pentavalente — 3ª',                                   type: 'mandatory' },
    { ageMonths: 6, name: 'Polio (VPO oral) — 3ª',                               type: 'mandatory' },
    { ageMonths: 6, name: 'Influenza estacional — 1ª (anual)',                   type: 'mandatory' },

    { ageMonths: 7, name: 'Influenza — 2ª dosis',                                type: 'mandatory' },

    { ageMonths: 12, name: 'Triple Viral (SRP) — 1ª',                            type: 'mandatory' },
    { ageMonths: 12, name: 'Varicela — 1ª dosis',                                type: 'mandatory' },
    { ageMonths: 12, name: 'Hepatitis A — dosis única',                          type: 'mandatory' },
    { ageMonths: 12, name: 'Neumococo — refuerzo',                               type: 'mandatory' },

    { ageMonths: 18, name: 'DPT — refuerzo',                                     type: 'mandatory' },
    { ageMonths: 18, name: 'Polio (VPI) — refuerzo',                             type: 'mandatory' },
    { ageMonths: 18, name: 'Fiebre Amarilla',                                    type: 'mandatory', timing: '18 meses' },

    { ageMonths: 60, name: 'DPT — 2º refuerzo (5 años)',                         type: 'mandatory' },
    { ageMonths: 60, name: 'Polio (VPO oral) — refuerzo',                        type: 'mandatory' },
    { ageMonths: 60, name: 'Triple Viral (SRP) — refuerzo',                      type: 'mandatory' },
    { ageMonths: 60, name: 'Varicela — 2ª dosis',                                type: 'mandatory' },
  ],

  reminderTextKey: 'vacc.reminder.es',
  disclaimerKey: 'vacc.disclaimer.es',

  // Controles de crecimiento y desarrollo (Colombia — Resolución 3280/2018)
  uUntersuchungen: [
    { id: 'C1',  label: 'Recién nacido', ageRange: 'al nacer',  desc: 'Examen neonatal, BCG, HepB' },
    { id: 'C2',  label: '8 días',        ageRange: '8 días',    desc: 'Tamizaje neonatal' },
    { id: 'C3',  label: '1 mes',         ageRange: '1 mes',     desc: 'Lactancia, peso/talla' },
    { id: 'C4',  label: '2 meses',       ageRange: '2 meses',   desc: 'Pentavalente, Polio, Neumococo, Rotavirus' },
    { id: 'C5',  label: '4 meses',       ageRange: '4 meses',   desc: '2ª serie de vacunas' },
    { id: 'C6',  label: '6 meses',       ageRange: '6 meses',   desc: 'Pentavalente 3ª, Influenza' },
    { id: 'C7',  label: '9 meses',       ageRange: '9 meses',   desc: 'Desarrollo psicomotor' },
    { id: 'C8',  label: '12 meses',      ageRange: '12 meses',  desc: 'SRP + Varicela + HepA' },
    { id: 'C9',  label: '18 meses',      ageRange: '18 meses',  desc: 'DPT refuerzo, Fiebre Amarilla' },
    { id: 'C10', label: '2 años',        ageRange: '2 años',    desc: 'Crecimiento integral' },
    { id: 'C11', label: '3 años',        ageRange: '3 años',    desc: 'Desarrollo del lenguaje' },
    { id: 'C12', label: '5 años',        ageRange: '5 años',    desc: 'Ingreso escolar — refuerzos' },
  ],
}
