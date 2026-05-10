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

// ─── DE: STIKO / DGKJ Fieber-Leitlinie ───────────────────────────────────────

export const TEMPERATURE_REFERENCE_DE = [
  { ageRange: 'Unter 3 Monaten', threshold: '≥ 38,0°C',     note: 'Jedes Fieber bei Säuglingen <3 Mon. ist eine Schwelle für eine dringende medizinische Untersuchung.' },
  { ageRange: '3–6 Monate',       threshold: '≥ 38,0°C',     note: 'Schwelle für Kinderarzt-Konsultation; individuelle Beurteilung.' },
  { ageRange: '6+ Monate',        threshold: '38,5–39,0°C', note: 'Hohes Fieber. DGKJ-Leitlinie empfiehlt Antipyretika zur Verbesserung des Komforts.' },
  { ageRange: '6+ Monate',        threshold: '≥ 39,0°C',     note: 'Schwelle für Kinderarzt-Konsultation.' },
  { ageRange: 'Jedes Alter',      threshold: '≥ 40,5°C',     note: 'Schwelle für dringende medizinische Untersuchung, altersunabhängig.' },
]
export const WARNING_SIGNS_DE = [
  { icon: '🩺', title: 'Säugling unter 3 Monaten mit Fieber ≥38°C',           detail: 'Die DGKJ-Leitlinie indiziert eine dringende Krankenhausuntersuchung, unabhängig von anderen Symptomen.' },
  { icon: '🌡️', title: 'Temperatur ≥40,5°C in jedem Alter',                    detail: 'Schwelle für dringende medizinische Untersuchung laut DGKJ/AWMF.' },
  { icon: '😴', title: 'Apathie, Schwierigkeit beim Wecken, fehlende Reaktion', detail: 'Warnzeichen laut DGKJ/AWMF-Leitlinien.' },
  { icon: '🫁', title: 'Atemnot, Pfeifen, Zyanose',                              detail: 'Warnzeichen — dringende medizinische Untersuchung.' },
  { icon: '🔴', title: 'Krampfanfälle, Nackensteifigkeit, nicht-wegdrückbarer Hautausschlag', detail: 'Mögliche ZNS-Infektion oder Sepsis — Notfallversorgung.' },
  { icon: '💧', title: 'Dehydratationszeichen: trockene Windeln >6h, keine Tränen, eingefallene Fontanelle', detail: 'Indikation für medizinische Untersuchung, besonders bei Säuglingen.' },
  { icon: '🤮', title: 'Anhaltendes Erbrechen, Durchfall >24h bei Säuglingen', detail: 'Dehydratationsrisiko — Kinderarzt-Konsultation.' },
  { icon: '⏱️', title: 'Fieber >72h bei Kindern >6 Monate',                    detail: 'DGKJ-Leitlinie indiziert Kinderarzt-Konsultation.' },
]
export const EMERGENCY_INFO_DE = {
  primary: { number: '112', label: 'Notrufnummer (EU)' },
  notes: [
    'Die 112 verbindet Sie mit dem nächsten Disponenten (Rettungsdienst, Feuerwehr, Polizei).',
    'Für Nicht-Notfälle erreichen Sie den kassenärztlichen Bereitschaftsdienst unter 116 117.',
  ],
}

// ─── FR: SFP / HAS recommandations ───────────────────────────────────────────

export const TEMPERATURE_REFERENCE_FR = [
  { ageRange: 'Moins de 3 mois', threshold: '≥ 38,0°C',     note: 'Toute fièvre chez un nourrisson <3 mois est un seuil d\'évaluation médicale urgente.' },
  { ageRange: '3–6 mois',         threshold: '≥ 38,0°C',     note: 'Seuil de consultation pédiatrique ; évaluation individuelle.' },
  { ageRange: '6+ mois',          threshold: '38,5–39,0°C', note: 'Fièvre élevée. Les recommandations SFP/HAS suggèrent des antipyrétiques pour le confort.' },
  { ageRange: '6+ mois',          threshold: '≥ 39,0°C',     note: 'Seuil de consultation pédiatrique.' },
  { ageRange: 'Tout âge',         threshold: '≥ 40,5°C',     note: 'Seuil d\'évaluation médicale urgente, quel que soit l\'âge.' },
]
export const WARNING_SIGNS_FR = [
  { icon: '🩺', title: 'Nourrisson de moins de 3 mois avec fièvre ≥38°C',       detail: 'Les recommandations SFP indiquent une consultation hospitalière urgente, indépendamment d\'autres symptômes.' },
  { icon: '🌡️', title: 'Température ≥40,5°C à tout âge',                       detail: 'Seuil d\'évaluation médicale urgente selon SFP/HAS.' },
  { icon: '😴', title: 'Apathie, difficulté à réveiller, absence de réaction', detail: 'Signe d\'alerte indiqué dans les recommandations SFP/HAS.' },
  { icon: '🫁', title: 'Difficulté respiratoire, sifflements, cyanose',         detail: 'Signe d\'alerte — évaluation médicale urgente.' },
  { icon: '🔴', title: 'Convulsions, raideur de la nuque, éruption qui ne disparaît pas à la pression', detail: 'Possible infection du SNC ou sepsis — urgences.' },
  { icon: '💧', title: 'Déshydratation : couches sèches >6h, pas de larmes, fontanelle enfoncée', detail: 'Indication d\'évaluation médicale, surtout chez le nourrisson.' },
  { icon: '🤮', title: 'Vomissements persistants, diarrhée >24h chez un nourrisson', detail: 'Risque de déshydratation — consultation pédiatrique.' },
  { icon: '⏱️', title: 'Fièvre >72h chez un enfant >6 mois',                    detail: 'Les recommandations SFP indiquent une consultation pédiatrique.' },
]
export const EMERGENCY_INFO_FR = {
  primary: { number: '15 / 112', label: 'SAMU / Numéro d\'urgence (UE)' },
  notes: [
    'Le 15 est le SAMU (urgences médicales). Le 112 est le numéro d\'urgence européen (toutes urgences).',
    'Pour les conseils médicaux non urgents, contactez votre pédiatre ou le 116 117 (permanence de soins).',
  ],
}

// ─── ES: AEP recomendaciones ─────────────────────────────────────────────────

export const TEMPERATURE_REFERENCE_ES = [
  { ageRange: 'Menos de 3 meses', threshold: '≥ 38,0°C',     note: 'Cualquier fiebre en un lactante <3 meses es un umbral de evaluación médica urgente.' },
  { ageRange: '3–6 meses',         threshold: '≥ 38,0°C',     note: 'Umbral de consulta pediátrica; evaluación individual.' },
  { ageRange: '6+ meses',          threshold: '38,5–39,0°C', note: 'Fiebre alta. Las recomendaciones de la AEP sugieren antipiréticos para el confort.' },
  { ageRange: '6+ meses',          threshold: '≥ 39,0°C',     note: 'Umbral de consulta pediátrica.' },
  { ageRange: 'Cualquier edad',    threshold: '≥ 40,5°C',     note: 'Umbral de evaluación médica urgente, independientemente de la edad.' },
]
export const WARNING_SIGNS_ES = [
  { icon: '🩺', title: 'Lactante menor de 3 meses con fiebre ≥38°C',           detail: 'Las recomendaciones AEP indican consulta hospitalaria urgente, sin importar otros síntomas.' },
  { icon: '🌡️', title: 'Temperatura ≥40,5°C a cualquier edad',                  detail: 'Umbral de evaluación médica urgente según AEP.' },
  { icon: '😴', title: 'Apatía, dificultad para despertar, falta de respuesta', detail: 'Señal de alarma indicada en las recomendaciones AEP.' },
  { icon: '🫁', title: 'Dificultad respiratoria, sibilancias, cianosis',        detail: 'Señal de alarma — evaluación médica urgente.' },
  { icon: '🔴', title: 'Convulsiones, rigidez de nuca, erupción que no desaparece a la presión', detail: 'Posible infección del SNC o sepsis — urgencias.' },
  { icon: '💧', title: 'Deshidratación: pañales secos >6h, sin lágrimas, fontanela hundida', detail: 'Indicación de evaluación médica, especialmente en lactantes.' },
  { icon: '🤮', title: 'Vómitos persistentes, diarrea >24h en lactantes',       detail: 'Riesgo de deshidratación — consulta pediátrica.' },
  { icon: '⏱️', title: 'Fiebre >72h en niños >6 meses',                          detail: 'Las recomendaciones AEP indican consulta pediátrica.' },
]
export const EMERGENCY_INFO_ES = {
  primary: { number: '112 / 061', label: 'Emergencias (UE) / Urgencias sanitarias' },
  notes: [
    'El 112 conecta con el despachador más cercano (sanitarias, bomberos, policía). El 061 es específico para urgencias sanitarias en España.',
    'Para consultas no urgentes, contacta con tu pediatra o centro de salud.',
  ],
}

export function getReferenceTables(locale) {
  const map = {
    pl: { temperature: TEMPERATURE_REFERENCE_PL, warningSigns: WARNING_SIGNS_PL, emergency: EMERGENCY_INFO_PL },
    en: { temperature: TEMPERATURE_REFERENCE_EN, warningSigns: WARNING_SIGNS_EN, emergency: EMERGENCY_INFO_EN },
    de: { temperature: TEMPERATURE_REFERENCE_DE, warningSigns: WARNING_SIGNS_DE, emergency: EMERGENCY_INFO_DE },
    fr: { temperature: TEMPERATURE_REFERENCE_FR, warningSigns: WARNING_SIGNS_FR, emergency: EMERGENCY_INFO_FR },
    es: { temperature: TEMPERATURE_REFERENCE_ES, warningSigns: WARNING_SIGNS_ES, emergency: EMERGENCY_INFO_ES },
  }
  return map[locale] || map.pl
}
