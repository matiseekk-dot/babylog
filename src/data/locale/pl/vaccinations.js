/**
 * Polski Program Szczepień Ochronnych (PSO) — obowiązkowy harmonogram.
 *
 * Źródło: https://www.gov.pl/web/zdrowie/program-szczepien-ochronnych-na-rok-2025
 * Wersja: PSO 2025 (Komunikat Głównego Inspektora Sanitarnego, październik 2024)
 *
 * UWAGA prawna: TY tylko prezentujesz oficjalny państwowy harmonogram.
 * NIE rekomendujesz konkretnemu dziecku konkretnego szczepienia. User
 * musi skonsultować z pediatrą — to jest cytat z dokumentu publicznego.
 *
 * Format:
 *   { ageMonths, name, type: 'mandatory'|'recommended', source }
 */

export default {
  country: 'PL',
  countryName: 'Polska',
  scheduleName: 'PSO',
  scheduleNameFull: 'Program Szczepień Ochronnych',
  source: 'https://www.gov.pl/web/zdrowie/program-szczepien-ochronnych',
  sourceLabel: 'Ministerstwo Zdrowia / GIS',
  lastUpdated: '2025-01',

  // Statyczny harmonogram szczepień obowiązkowych (uproszczony — pełna lista
  // w PSO ma >30 pozycji w pierwszych 2 latach. Pokazujemy najważniejsze
  // milestones gdzie rodzic ma zorganizować wizytę).
  schedule: [
    { ageMonths: 0,  name: 'BCG (gruźlica)', type: 'mandatory', timing: 'do 24h po urodzeniu' },
    { ageMonths: 0,  name: 'WZW B (szczepienie I)', type: 'mandatory', timing: 'do 24h po urodzeniu' },
    { ageMonths: 2,  name: 'DTP (błonica/tężec/krztusiec) I', type: 'mandatory' },
    { ageMonths: 2,  name: 'IPV (polio) I', type: 'mandatory' },
    { ageMonths: 2,  name: 'Hib (Haemophilus influenzae) I', type: 'mandatory' },
    { ageMonths: 2,  name: 'WZW B II', type: 'mandatory' },
    { ageMonths: 2,  name: 'PCV (pneumokoki) I', type: 'mandatory' },
    { ageMonths: 4,  name: 'DTP II + IPV II + Hib II + PCV II', type: 'mandatory' },
    { ageMonths: 6,  name: 'DTP III + IPV III + Hib III', type: 'mandatory' },
    { ageMonths: 7,  name: 'WZW B III', type: 'mandatory' },
    { ageMonths: 13, name: 'MMR (odra/świnka/różyczka) I', type: 'mandatory' },
    { ageMonths: 13, name: 'PCV booster', type: 'mandatory' },
    { ageMonths: 16, name: 'DTPa booster + Hib booster + IPV booster', type: 'mandatory' },
    { ageMonths: 24, name: 'Ospa wietrzna (zalecane od 9 mies.)', type: 'recommended' },
    { ageMonths: 60, name: 'MMR II', type: 'mandatory' },
    { ageMonths: 72, name: 'DTPa-IPV booster (przed szkołą)', type: 'mandatory' },
  ],

  // Format wzmianki w UI: "Twoje dziecko ma X miesięcy. Zaplanowane: ..."
  reminderTextKey: 'vacc.reminder.pl',

  // Disclaimer obowiązkowy — wyświetlany pod każdą informacją.
  disclaimerKey: 'vacc.disclaimer.pl',
}
