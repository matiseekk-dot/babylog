// Uruchom: node functions/time.test.js (bez zależności — node:test).
const test = require('node:test')
const assert = require('node:assert')
const { localToTimestamp, isValidTimeZone } = require('./time')

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
