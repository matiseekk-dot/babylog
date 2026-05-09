/**
 * EN locale = international fallback. Phase 2 (Q2 2026) split into:
 *   - en-US (CDC Recommended Immunization Schedule)
 *   - en-GB (NHS Routine Schedule)
 *
 * Aktualnie używamy CDC jako default dla EN — to jest najbardziej rozpoznawalne
 * dla anglojęzycznego usera (US/CA/AU). UK userzy widzą CDC schedule + disclaimer
 * "your local schedule may differ".
 *
 * Source: CDC https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html
 * Wersja: 2024 (United States)
 *
 * MUSI być zaktualizowane przez native US/UK pediatric review przed Phase 2 launch.
 */

export default {
  country: 'US',
  countryName: 'United States (default English)',
  scheduleName: 'CDC',
  scheduleNameFull: 'CDC Recommended Immunization Schedule',
  source: 'https://www.cdc.gov/vaccines/schedules/',
  sourceLabel: 'Centers for Disease Control and Prevention (CDC)',
  lastUpdated: '2024-01',

  schedule: [
    { ageMonths: 0,  name: 'Hepatitis B (HepB) — 1st dose',  type: 'mandatory', timing: 'within 24h of birth' },
    { ageMonths: 1,  name: 'Hepatitis B — 2nd dose',         type: 'mandatory' },
    { ageMonths: 2,  name: 'Rotavirus (RV) — 1st dose',      type: 'mandatory' },
    { ageMonths: 2,  name: 'DTaP (1st dose)',                type: 'mandatory' },
    { ageMonths: 2,  name: 'Hib (1st dose)',                 type: 'mandatory' },
    { ageMonths: 2,  name: 'Pneumococcal (PCV13) — 1st dose',type: 'mandatory' },
    { ageMonths: 2,  name: 'IPV (Polio) — 1st dose',         type: 'mandatory' },
    { ageMonths: 4,  name: 'DTaP (2nd) + Hib (2nd) + PCV (2nd) + IPV (2nd) + RV (2nd)', type: 'mandatory' },
    { ageMonths: 6,  name: 'DTaP (3rd) + Hib (3rd) + PCV (3rd) + RV (3rd)', type: 'mandatory' },
    { ageMonths: 6,  name: 'Hepatitis B — 3rd dose (6-18 months)', type: 'mandatory' },
    { ageMonths: 6,  name: 'IPV — 3rd dose (6-18 months)',  type: 'mandatory' },
    { ageMonths: 6,  name: 'Annual flu shot', type: 'recommended' },
    { ageMonths: 12, name: 'MMR — 1st dose (12-15 mo)',      type: 'mandatory' },
    { ageMonths: 12, name: 'Varicella — 1st dose (12-15 mo)',type: 'mandatory' },
    { ageMonths: 12, name: 'Hepatitis A — 1st dose',         type: 'mandatory' },
    { ageMonths: 15, name: 'DTaP — 4th + Hib — 4th + PCV — 4th (15-18 mo)', type: 'mandatory' },
    { ageMonths: 18, name: 'Hepatitis A — 2nd dose',         type: 'mandatory' },
    { ageMonths: 48, name: 'DTaP — 5th + IPV — 4th + MMR — 2nd + Varicella — 2nd (4-6 yrs)', type: 'mandatory' },
  ],

  reminderTextKey: 'vacc.reminder.en',
  disclaimerKey: 'vacc.disclaimer.en',
}
