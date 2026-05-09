/**
 * México — Esquema Nacional de Vacunación (CENSIA / Cartilla Nacional de Salud).
 *
 * Source: Centro Nacional para la Salud de la Infancia y la Adolescencia (CENSIA),
 * Secretaría de Salud de México.
 * https://www.gob.mx/salud/censia
 *
 * Cartilla Nacional de Salud (Niños y Niñas de 0 a 9 años) — esquema oficial.
 * Updated: 2024.
 */

export default {
  country: 'MX',
  countryName: 'México',
  scheduleName: 'Cartilla Nacional CENSIA',
  scheduleNameFull: 'Esquema Nacional de Vacunación (CENSIA / Secretaría de Salud)',
  source: 'https://www.gob.mx/salud/censia',
  sourceLabel: 'CENSIA / Secretaría de Salud',
  lastUpdated: '2024',

  schedule: [
    { ageMonths: 0, name: 'BCG (tuberculosis) — dosis única',                 type: 'mandatory', timing: 'al nacer' },
    { ageMonths: 0, name: 'Hepatitis B — 1ª dosis',                            type: 'mandatory', timing: 'al nacer' },

    { ageMonths: 2, name: 'Pentavalente acelular (DTPa+Hib+IPV+HepB) — 1ª',    type: 'mandatory' },
    { ageMonths: 2, name: 'Rotavirus — 1ª dosis',                              type: 'mandatory' },
    { ageMonths: 2, name: 'Neumococo conjugada — 1ª dosis',                    type: 'mandatory' },

    { ageMonths: 4, name: 'Pentavalente acelular — 2ª',                        type: 'mandatory' },
    { ageMonths: 4, name: 'Rotavirus — 2ª dosis',                              type: 'mandatory' },
    { ageMonths: 4, name: 'Neumococo conjugada — 2ª dosis',                    type: 'mandatory' },

    { ageMonths: 6, name: 'Pentavalente acelular — 3ª',                        type: 'mandatory' },
    { ageMonths: 6, name: 'Hepatitis B — 2ª dosis',                            type: 'mandatory' },
    { ageMonths: 6, name: 'Influenza estacional — 1ª dosis (anual)',           type: 'mandatory', timing: 'cada año en temporada' },

    { ageMonths: 7, name: 'Influenza estacional — 2ª dosis',                   type: 'mandatory' },

    { ageMonths: 12, name: 'SRP (Sarampión-Rubéola-Parotiditis) — 1ª dosis',   type: 'mandatory' },
    { ageMonths: 12, name: 'Neumococo conjugada — refuerzo',                   type: 'mandatory' },

    { ageMonths: 18, name: 'Pentavalente acelular — 4ª (refuerzo)',            type: 'mandatory' },
    { ageMonths: 18, name: 'Hepatitis A — 1ª dosis (recomendada)',             type: 'recommended' },

    { ageMonths: 48, name: 'DPT (refuerzo) — 4 años',                          type: 'mandatory' },
    { ageMonths: 48, name: 'SRP — 2ª dosis (refuerzo)',                        type: 'mandatory' },

    { ageMonths: 72, name: 'SR (Sarampión-Rubéola) — 6 años',                  type: 'mandatory' },
  ],

  reminderTextKey: 'vacc.reminder.es',
  disclaimerKey: 'vacc.disclaimer.es',

  // Citas de control (Cartilla Nacional)
  uUntersuchungen: [
    { id: 'C1',  label: 'Recién nacido',  ageRange: 'al nacer',     desc: 'Tamiz neonatal, BCG, HepB' },
    { id: 'C2',  label: '7-28 días',      ageRange: '7-28 días',    desc: 'Primera consulta, peso/talla' },
    { id: 'C3',  label: '2 meses',        ageRange: '2 meses',      desc: 'Consulta + Pentavalente, Rotavirus, Neumococo' },
    { id: 'C4',  label: '4 meses',        ageRange: '4 meses',      desc: 'Consulta + 2ª serie de vacunas' },
    { id: 'C5',  label: '6 meses',        ageRange: '6 meses',      desc: 'Inicio alimentación, Pentavalente 3ª, Influenza' },
    { id: 'C6',  label: '9 meses',        ageRange: '9 meses',      desc: 'Desarrollo psicomotor' },
    { id: 'C7',  label: '12 meses',       ageRange: '12 meses',     desc: 'SRP + Neumococo refuerzo' },
    { id: 'C8',  label: '18 meses',       ageRange: '18 meses',     desc: 'Pentavalente refuerzo, HepA' },
    { id: 'C9',  label: '2 años',         ageRange: '2 años',       desc: 'Revisión integral' },
    { id: 'C10', label: '3 años',         ageRange: '3 años',       desc: 'Desarrollo del lenguaje' },
    { id: 'C11', label: '4 años',         ageRange: '4 años',       desc: 'DPT refuerzo, SRP refuerzo' },
    { id: 'C12', label: '6 años',         ageRange: '6 años',       desc: 'SR + revisión preescolar' },
  ],
}
