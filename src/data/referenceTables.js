/**
 * referenceTables.js — STATYCZNE tabele referencyjne PTP/AAP.
 *
 * KLUCZOWA ZASADA MDR EXIT (v2.10.5):
 *
 * Te tabele są STATYCZNE. NIE są "evaluated" w stosunku do danych dziecka.
 * Apka NIE podświetla wiersza "ten jest dla twojego dziecka". Apka NIE
 * generuje "twoje dziecko jest w grupie X".
 *
 * Apka pokazuje tę tabelę tak, jak wikipedia pokazuje artykuł: jako
 * surowy content, dostępny do przeczytania. To jest information surface,
 * nie clinical decision support.
 *
 * Cytowanie:
 *   - Polskie progi: KOMPAS GORĄCZKA (Polskie Towarzystwo Pediatryczne, PTP/PTMR)
 *   - Angielskie progi: AAP 2021 Clinical Practice Guideline for Febrile Infants
 */

// ─── TEMPERATURY WG WIEKU (PTP / AAP) ──────────────────────────────────────────

export const TEMPERATURE_REFERENCE_PL = [
  {
    ageRange: 'Poniżej 3 miesięcy',
    threshold: '≥ 38,0°C',
    note: 'Każda gorączka u niemowlęcia <3 mies. jest progiem pilnej oceny medycznej.',
  },
  {
    ageRange: '3–6 miesięcy',
    threshold: '≥ 38,0°C',
    note: 'Próg konsultacji pediatrycznej; ocena indywidualna.',
  },
  {
    ageRange: '6+ miesięcy',
    threshold: '38,5–39,0°C',
    note: 'Wysoka gorączka. PTP zaleca antypiretyki w celu poprawy komfortu.',
  },
  {
    ageRange: '6+ miesięcy',
    threshold: '≥ 39,0°C',
    note: 'Próg konsultacji pediatrycznej.',
  },
  {
    ageRange: 'Każdy wiek',
    threshold: '≥ 40,5°C',
    note: 'Próg pilnej oceny medycznej, niezależnie od wieku.',
  },
]

export const TEMPERATURE_REFERENCE_EN = [
  {
    ageRange: 'Under 3 months',
    threshold: '≥ 38.0°C / 100.4°F',
    note: 'Any fever in an infant <3 months is a threshold for urgent medical evaluation.',
  },
  {
    ageRange: '3–6 months',
    threshold: '≥ 38.0°C / 100.4°F',
    note: 'Threshold for pediatric consultation; individual assessment.',
  },
  {
    ageRange: '6+ months',
    threshold: '38.5–39.0°C / 101.3–102.2°F',
    note: 'High fever. AAP guidelines suggest antipyretics for comfort.',
  },
  {
    ageRange: '6+ months',
    threshold: '≥ 39.0°C / 102.2°F',
    note: 'Threshold for pediatric consultation.',
  },
  {
    ageRange: 'Any age',
    threshold: '≥ 40.5°C / 105°F',
    note: 'Threshold for urgent medical evaluation, regardless of age.',
  },
]

// ─── WARNING SIGNS — KIEDY SZUKAĆ POMOCY ─────────────────────────────────────

export const WARNING_SIGNS_PL = [
  {
    icon: '🩺',
    title: 'Niemowlę poniżej 3 miesięcy z gorączką ≥38°C',
    detail: 'PTP/AAP wskazują pilną wizytę szpitalną, niezależnie od innych objawów.',
  },
  {
    icon: '🌡️',
    title: 'Temperatura ≥40,5°C w każdym wieku',
    detail: 'Próg pilnej oceny medycznej wg literatury (PTP, KOMPAS GORĄCZKA).',
  },
  {
    icon: '😴',
    title: 'Apatia, trudność w wybudzeniu, brak reakcji',
    detail: 'Sygnał ostrzegawczy wskazany w wytycznych PTP/AAP.',
  },
  {
    icon: '🫁',
    title: 'Trudności w oddychaniu, świszczący oddech, sinica',
    detail: 'Sygnał ostrzegawczy — pilna ocena medyczna.',
  },
  {
    icon: '🔴',
    title: 'Drgawki, sztywność karku, plamy nieblednące przy ucisku',
    detail: 'Możliwe objawy zakażenia OUN lub posocznicy — pilna pomoc.',
  },
  {
    icon: '💧',
    title: 'Oznaki odwodnienia: suche pieluchy >6h, brak łez, zapadnięte ciemiączko',
    detail: 'Wskazanie do oceny medycznej, szczególnie u niemowląt.',
  },
  {
    icon: '🤮',
    title: 'Uporczywe wymioty, biegunka >24h u niemowlęcia',
    detail: 'Ryzyko odwodnienia — konsultacja pediatryczna.',
  },
  {
    icon: '⏱️',
    title: 'Gorączka utrzymująca się >72h u dziecka >6 mies.',
    detail: 'PTP/AAP zalecają konsultację pediatryczną.',
  },
]

export const WARNING_SIGNS_EN = [
  {
    icon: '🩺',
    title: 'Infant under 3 months with fever ≥38°C',
    detail: 'AAP guidelines indicate urgent hospital evaluation, regardless of other symptoms.',
  },
  {
    icon: '🌡️',
    title: 'Temperature ≥40.5°C / 105°F at any age',
    detail: 'AAP threshold for urgent medical evaluation.',
  },
  {
    icon: '😴',
    title: 'Lethargy, difficulty waking, unresponsiveness',
    detail: 'Warning sign noted in AAP/Mayo Clinic guidelines.',
  },
  {
    icon: '🫁',
    title: 'Breathing difficulty, wheezing, cyanosis',
    detail: 'Warning sign — urgent medical evaluation.',
  },
  {
    icon: '🔴',
    title: 'Seizures, neck stiffness, non-blanching rash',
    detail: 'Possible CNS infection or sepsis — urgent care.',
  },
  {
    icon: '💧',
    title: 'Dehydration signs: dry diapers >6h, no tears, sunken fontanelle',
    detail: 'Indication for medical evaluation, especially in infants.',
  },
  {
    icon: '🤮',
    title: 'Persistent vomiting, diarrhea >24h in an infant',
    detail: 'Risk of dehydration — pediatric consultation.',
  },
  {
    icon: '⏱️',
    title: 'Fever lasting >72h in a child >6 months',
    detail: 'AAP guidelines indicate pediatric consultation.',
  },
]

// ─── EMERGENCY NUMBERS ───────────────────────────────────────────────────────

export const EMERGENCY_INFO_PL = {
  primary: { number: '112', label: 'Numer alarmowy (UE)' },
  notes: [
    'Numer 112 łączy z najbliższym dyspozytorem pomocy (pogotowie ratunkowe, straż pożarna, policja).',
    'W razie wątpliwości skontaktuj się z lekarzem pediatrą lub nocną pomocą lekarską.',
  ],
}

export const EMERGENCY_INFO_EN = {
  primary: { number: '112', label: 'Emergency number (EU)' },
  notes: [
    'Number 112 connects you to the nearest dispatcher (medical, fire, police).',
    'For non-emergency concerns, contact your pediatrician or after-hours pediatric line.',
  ],
}

export function getReferenceTables(locale) {
  if (locale === 'en') {
    return {
      temperature: TEMPERATURE_REFERENCE_EN,
      warningSigns: WARNING_SIGNS_EN,
      emergency: EMERGENCY_INFO_EN,
    }
  }
  return {
    temperature: TEMPERATURE_REFERENCE_PL,
    warningSigns: WARNING_SIGNS_PL,
    emergency: EMERGENCY_INFO_PL,
  }
}
