// Badania w ciąży o przebiegu fizjologicznym według polskiego standardu
// organizacyjnego opieki okołoporodowej: tekst jednolity, obwieszczenie Ministra
// Zdrowia z 18 sierpnia 2026 r. (Dz.U. 2026 poz. 1140), z badaniami dodanymi
// rozporządzeniem z 23 października 2025 r. (Dz.U. 2025 poz. 1525, od maja 2026).
//
// Jedno źródło dla aplikacji (tryb ciąży), strony skudev.pl (artykuł i plik
// .ics) i ściągawki PDF. Kopia w skudev-landing/_tools/content/exams-pl.mjs:
// zmieniaj w obu miejscach. Treść medyczna: przed zmianą sprawdź z położną.
//
// label/short: skrót do ściągawki PDF (scripts/build-pregnancy-cheatsheet.mjs).
// startWeek/endWeek: pełne tygodnie (24 = 24+0). Zgodnie z praktyką: badanie
// "od 11. do 14. tygodnia" zaczyna się od 11+0 (np. USG 1. trymestru),
// "od 24. do 28." od 24+0 (test obciążenia glukozą).

export const EXAMS_SOURCE = 'Standard organizacyjny opieki okołoporodowej, tekst jednolity: Dz.U. 2026 poz. 1140'

export const EXAM_PERIODS = [
  {
    id: 'w0',
    label: 'Do 10. tyg.',
    short: 'grupa krwi i Rh, przeciwciała, morfologia i ferrytyna, mocz, cytologia, glukoza na czczo, VDRL, HIV, HCV, toksoplazmoza, TSH, HBs, stomatolog',
    startWeek: 0, endWeek: 10,
    when: 'Do 10. tygodnia albo na pierwszej wizycie',
    tests: [
      'Grupa krwi i Rh, jeśli nie masz potwierdzonego wyniku',
      'Przeciwciała odpornościowe (przeciw krwinkom czerwonym)',
      'Morfologia krwi i ferrytyna',
      'Badanie ogólne moczu',
      'Cytologia, jeśli nie była robiona w ciągu 12 miesięcy przed ciążą',
      'Glukoza na czczo, a przy czynnikach ryzyka cukrzycy ciążowej test obciążenia glukozą',
      'VDRL (kiła)',
      'HIV i HCV',
      'Toksoplazmoza IgG i IgM, jeśli nie masz wyniku IgG sprzed ciąży',
      'TSH',
      'Antygen HBs',
      'Kontrola u stomatologa',
    ],
  },
  {
    id: 'w11',
    label: '11. do 14. tyg.',
    short: 'USG 1. trymestru, ocena nastroju',
    startWeek: 11, endWeek: 14,
    when: 'Od 11. do 14. tygodnia',
    tests: [
      'USG pierwszego trymestru (według zaleceń PTGiP)',
      'Ocena nastroju i ryzyka depresji',
    ],
  },
  {
    id: 'w15',
    label: '15. do 20. tyg.',
    short: 'morfologia, mocz',
    startWeek: 15, endWeek: 20,
    when: 'Od 15. do 20. tygodnia',
    tests: ['Morfologia krwi', 'Badanie ogólne moczu'],
  },
  {
    id: 'w18',
    label: '18. do 22. tyg.',
    short: 'USG połówkowe',
    startWeek: 18, endWeek: 22,
    when: 'Od 18. do 22. tygodnia',
    tests: ['USG połówkowe (według zaleceń PTGiP)'],
  },
  {
    id: 'w21',
    label: '21. do 26. tyg.',
    short: 'mocz, toksoplazmoza (gdy wcześniej ujemna)',
    startWeek: 21, endWeek: 26,
    when: 'Od 21. do 26. tygodnia',
    tests: [
      'Badanie ogólne moczu',
      'Toksoplazmoza IgG i IgM, jeśli w 1. trymestrze wynik był ujemny',
    ],
  },
  {
    id: 'w24',
    label: '24. do 28. tyg.',
    short: 'test obciążenia glukozą 75 g, przeciwciała anty-D przy Rh ujemnym',
    startWeek: 24, endWeek: 28,
    when: 'Od 24. do 28. tygodnia',
    tests: [
      'Test obciążenia 75 g glukozy: pomiar na czczo, po 1 i po 2 godzinach',
      'Przeciwciała anty-D, jeśli masz Rh ujemne',
    ],
  },
  {
    id: 'w27',
    label: '27. do 32. tyg.',
    short: 'morfologia, mocz, USG 3. trymestru, immunoglobulina anty-D od 28. do 30. tyg., jeśli wskazana',
    startWeek: 27, endWeek: 32,
    when: 'Od 27. do 32. tygodnia',
    tests: [
      'Morfologia krwi',
      'Badanie ogólne moczu',
      'USG trzeciego trymestru (według zaleceń PTGiP)',
      'Immunoglobulina anty-D od 28. do 30. tygodnia, jeśli lekarz uzna, że jest wskazana',
    ],
  },
  {
    id: 'w33',
    label: '33. do 37. tyg.',
    short: 'morfologia, mocz, HBs, HIV, posiew GBS (35. do 37. tyg.), konsultacja anestezjologiczna',
    startWeek: 33, endWeek: 37,
    when: 'Od 33. do 37. tygodnia',
    tests: [
      'Morfologia krwi',
      'Badanie ogólne moczu',
      'Antygen HBs',
      'HIV',
      'Posiew z pochwy i odbytu w kierunku paciorkowców GBS (od 35. do 37. tygodnia)',
      'VDRL i HCV, jeśli ryzyko zakażenia jest zwiększone',
      'Konsultacja anestezjologiczna, jeśli chcesz znieczulenia regionalnego do porodu',
      'Ocena nastroju i ryzyka depresji',
    ],
  },
  {
    id: 'w38',
    label: '38. do 39. tyg.',
    short: 'morfologia, mocz',
    startWeek: 38, endWeek: 39,
    when: 'Od 38. do 39. tygodnia',
    tests: [
      'Badanie ogólne moczu',
      'Morfologia krwi',
      'Konsultacja anestezjologiczna, jeśli nie było jej wcześniej',
    ],
  },
  {
    id: 'w40',
    label: 'Po 40. tyg.',
    short: 'KTG i USG co 7 dni, ustalenie przyjęcia do szpitala',
    startWeek: 40, endWeek: 42,
    when: 'Zaraz po 40. tygodniu',
    tests: [
      'KTG i USG, a przy dobrych wynikach kolejne co 7 dni',
      'Ustalenie daty przyjęcia do szpitala, tak by poród odbył się przed końcem 42. tygodnia',
    ],
  },
]

export const EXAM_VISITS_NOTE = 'W ciąży o prawidłowym przebiegu wizyta u lekarza albo położnej jest nie rzadziej niż co 4 tygodnie. Lekarz może zlecić więcej badań, jeśli wymaga tego Twój stan zdrowia.'
