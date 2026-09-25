// Uruchom: node functions/time.test.js (bez zależności — node:test).
const test = require('node:test')
const assert = require('node:assert')
const { localToTimestamp, isValidTimeZone, localDateHour } = require('./time')
const { medPushText, dailySummaryText } = require('./messages')

test('localDateHour: dzień i godzina u rodzica', () => {
  // 22:30 UTC 25.09 = 00:30 26.09 w Warszawie (CEST)
  assert.deepStrictEqual(localDateHour(Date.UTC(2026, 8, 25, 22, 30), 'Europe/Warsaw'), { date: '2026-09-26', hour: 0 })
  assert.deepStrictEqual(localDateHour(Date.UTC(2026, 8, 25, 18, 5), 'Europe/Warsaw'), { date: '2026-09-25', hour: 20 })
  assert.deepStrictEqual(localDateHour(Date.UTC(2026, 8, 26, 0, 5), 'America/New_York'), { date: '2026-09-25', hour: 20 })
})

test('push o lekach w języku apki, nieznany → polski', () => {
  assert.match(medPushText('de', 'Paracetamol', '14:00').body, /Beipackzettel/)
  assert.match(medPushText('xx', 'Ibuprofen', '09:00').title, /^Minął odstęp/)
})

test('podsumowanie dnia: jedno dziecko, kilkoro, pusty dzień', () => {
  const one = dailySummaryText('pl', [{ name: 'Zosia', feeds: 8, sleepMin: 680, diapers: 6 }])
  assert.deepStrictEqual(one, { title: 'Podsumowanie dnia — Zosia', body: 'Karmienia: 8 · Sen: 11 h 20 min · Pieluchy: 6' })
  const two = dailySummaryText('en', [
    { name: 'Emma', feeds: 5, sleepMin: 0, diapers: 0 },
    { name: 'Leo', feeds: 0, sleepMin: 45, diapers: 3, toiletMode: 'potty' },
  ])
  assert.strictEqual(two.body, 'Emma: Feedings: 5\nLeo: Sleep: 45 min · Toilet: 3')
  assert.strictEqual(dailySummaryText('pl', [{ name: 'Zosia', feeds: 0, sleepMin: 0, diapers: 0 }]), null)
})

test('Warszawa latem: 14:00 lokalnie = 12:00 UTC', () => {
  assert.strictEqual(localToTimestamp('2026-09-25', '14:00', 'Europe/Warsaw'), Date.UTC(2026, 8, 25, 12, 0))
})

test('Warszawa zimą: 14:00 lokalnie = 13:00 UTC', () => {
  assert.strictEqual(localToTimestamp('2026-12-01', '14:00', 'Europe/Warsaw'), Date.UTC(2026, 11, 1, 13, 0))
})

test('Nowy Jork i Londyn', () => {
  assert.strictEqual(localToTimestamp('2026-07-01', '08:30', 'America/New_York'), Date.UTC(2026, 6, 1, 12, 30))
  assert.strictEqual(localToTimestamp('2026-01-15', '08:30', 'Europe/London'), Date.UTC(2026, 0, 15, 8, 30))
})

test('dzień zmiany czasu (Warszawa, 25.10.2026) — godzina po zmianie', () => {
  assert.strictEqual(localToTimestamp('2026-10-25', '12:00', 'Europe/Warsaw'), Date.UTC(2026, 9, 25, 11, 0))
})

test('zła strefa → Europe/Warsaw, zły format → null', () => {
  assert.strictEqual(localToTimestamp('2026-09-25', '14:00', 'Nie/Strefa'), Date.UTC(2026, 8, 25, 12, 0))
  assert.strictEqual(localToTimestamp('25.09.2026', '14:00'), null)
  assert.strictEqual(localToTimestamp('2026-09-25', ''), null)
  assert.strictEqual(isValidTimeZone('Europe/Warsaw'), true)
  assert.strictEqual(isValidTimeZone(''), false)
})
