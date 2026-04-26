// Spokojny Rodzic — interwały leków dla Service Workera
//
// ⚠️  TEN PLIK MUSI BYĆ ZSYNCHRONIZOWANY z src/data/medIntervals.json.
//
// Jest osobnym plikiem, bo Service Worker jest serwowany jako static asset
// (nie przechodzi przez Vite bundle) i nie umie zaimportować JSON-a w sposób,
// który działałby konsekwentnie we wszystkich przeglądarkach. Zamiast tego
// SW ładuje ten plik przez importScripts() i odczytuje globalne self.MED_INTERVALS.
//
// Test src/data/medIntervals.test.js parsuje ten plik i porównuje wartości
// z canonical JSON-em — fail-uje przy rozjeździe. Zawsze uruchom `npm test`
// przed deployem.

self.MED_INTERVALS = {
  paracetamol: 360,
  panadol:     360,
  apap:        360,
  ibuprofen:   480,
  ibuprom:     480,
  nurofen:     480,
}

self.MED_INTERVALS_VERSION = 1
