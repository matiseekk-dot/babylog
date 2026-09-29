// Uruchom: node --test functions/revenuecat.test.js (bez zależności — node:test).
const test = require('node:test')
const assert = require('node:assert')
const { entitlementActive, fetchEntitlementActive, transferUserIds, ENTITLEMENT } = require('./revenuecat')

const NOW = Date.UTC(2026, 8, 29, 12, 0)
const sub = ent => ({ entitlements: ent ? { [ENTITLEMENT]: ent } : {} })

test('plan dożywotni zostaje mimo wygaśnięcia starej subskrypcji', () => {
  assert.strictEqual(entitlementActive(sub({ expires_date: null, product_identifier: 'spokojny_rodzic_premium_lifetime' }), NOW), true)
})

test('subskrypcja: aktywna w przyszłości, wygasła lub kończąca się za chwilę', () => {
  assert.strictEqual(entitlementActive(sub({ expires_date: '2026-10-29T12:00:00Z' }), NOW), true)
  assert.strictEqual(entitlementActive(sub({ expires_date: '2026-09-29T11:00:00Z' }), NOW), false)
  assert.strictEqual(entitlementActive(sub({ expires_date: '2026-09-29T12:03:00Z' }), NOW), false)
  assert.strictEqual(entitlementActive(sub(null), NOW), false)
})

test('fetchEntitlementActive: odpowiedź RC i błąd', async () => {
  const ok = async () => ({ ok: true, json: async () => ({ subscriber: sub({ expires_date: null }) }) })
  assert.strictEqual(await fetchEntitlementActive('uid1', ok), true)
  const down = async () => ({ ok: false, status: 503 })
  await assert.rejects(fetchEntitlementActive('uid1', down), /RC 503/)
  const empty = async () => ({ ok: true, json: async () => ({}) })
  await assert.rejects(fetchEntitlementActive('uid1', empty))
})

test('TRANSFER: tylko UID-y Firebase, bez duplikatów', () => {
  assert.deepStrictEqual(
    transferUserIds({ transferred_from: ['$RCAnonymousID:abc', 'oldUid123'], transferred_to: ['newUid456', 'newUid456'] }),
    ['oldUid123', 'newUid456'])
  assert.deepStrictEqual(transferUserIds({}), [])
})
