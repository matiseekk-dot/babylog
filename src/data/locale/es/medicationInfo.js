/**
 * España — información de las fichas técnicas (CIMA / AEMPS).
 *
 * Source: Ficha técnica y prospecto publicados por la AEMPS (Agencia Española
 * de Medicamentos y Productos Sanitarios) en el Centro de Información
 * online de Medicamentos (CIMA).
 *
 * https://cima.aemps.es/cima
 *
 * UWAGA: TY tylko prezentujesz publiczne fakty z fichy. NIE wyliczasz
 * indywidualnej dawki — zostawiamy to dla Pediatry.
 */

export default {
  country: 'ES',
  source: 'Ficha técnica / Prospecto',
  sourceLabel: 'AEMPS / CIMA',
  sourceUrl: 'https://cima.aemps.es/cima',

  paracetamol: {
    name: 'Paracetamol',
    brands: ['Apiretal', 'Termalgin', 'Gelocatil', 'Efferalgan', 'Paracetamol Cinfa'],
    minAge: 'desde el nacimiento (lactantes < 3 meses solo bajo supervisión médica)',
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 60,
    contraindications: ['insuficiencia hepática grave', 'alergia al paracetamol'],
  },

  ibuprofen: {
    name: 'Ibuprofeno',
    brands: ['Dalsy', 'Junifen', 'Espidifen', 'Neobrufen', 'Ibuprofeno Cinfa'],
    minAge: 'a partir de los 3 meses (generalmente > 5 kg de peso corporal)',
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    maxDailyMgPerKg: 30,
    contraindications: [
      'deshidratación / disminución de la diuresis',
      'vómitos / diarrea',
      'asma bronquial',
      'varicela (mayor riesgo de infección)',
      'enfermedad renal',
    ],
  },
}
