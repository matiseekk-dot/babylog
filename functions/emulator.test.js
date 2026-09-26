// Test integracyjny powiadomień na emulatorze Firestore (bez wysyłki push).
//
// Uruchom (emulator firestore na 127.0.0.1:8080):
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --test functions/emulator.test.js
// Bez FIRESTORE_EMULATOR_HOST testy są pomijane — nigdy nie dotykają produkcji.

const test = require('node:test')
const assert = require('node:assert')

const ON_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST
if (ON_EMULATOR) {
  process.env.GCLOUD_PROJECT = 'demo-babylog-test'
  process.env.BABYLOG_FUNCTIONS_TEST = '1'
}

const skip = !ON_EMULATOR && 'brak FIRESTORE_EMULATOR_HOST'
const fns = ON_EMULATOR ? require('./index') : null
const admin = ON_EMULATOR ? require('firebase-admin') : null
const { localDateHour } = require('./time')

const sent = []
if (ON_EMULATOR) {
  fns.__test.messaging.sendEachForMulticast = async (msg) => {
    sent.push(msg)
    return { successCount: msg.tokens.length, failureCount: 0, responses: msg.tokens.map(() => ({ success: true })) }
  }
}

const TZ = 'Europe/Warsaw'
function localParts(ts) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(ts)).map(x => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

async function put(uid, key, value) {
  await admin.firestore().doc(`users/${uid}/data/${key}`).set({ value })
}
async function get(uid, key) {
  return (await admin.firestore().doc(`users/${uid}/data/${key}`).get()).data()?.value
}

test('lek: push po niemiecku o właściwej godzinie, lista zachowana', { skip }, async () => {
  sent.length = 0
  const uid = `u-med-${Date.now()}`
  // Paracetamol: 360 min. Podany 370 min temu (czas lokalny Warszawy) → 10 min po terminie.
  const given = localParts(Date.now() - 370 * 60000)
  const recent = localParts(Date.now() - 30 * 60000)
  await put(uid, 'profiles', [{ id: 'p1', name: 'Lena' }])
  await put(uid, 'timezone', TZ)
  await put(uid, 'app_locale', 'de')
  await put(uid, 'meds_p1', [
    { id: 'm2', med: 'Ibuprofen', date: recent.date, time: recent.time },
    { id: 'm1', med: 'Paracetamol', date: given.date, time: given.time },
  ])

  const n = await fns.__test.processUser(uid, ['tokA', 'tokB'], {})
  assert.strictEqual(n, 2)                       // jeden lek × dwa urządzenia
  assert.strictEqual(sent.length, 1)
  assert.match(sent[0].notification.title, /Paracetamol/)
  assert.match(sent[0].notification.body, /Beipackzettel/)
  assert.strictEqual(sent[0].data.url, '/babylog/?tab=meds')

  const meds = await get(uid, 'meds_p1')
  assert.strictEqual(meds.length, 2)
  assert.strictEqual(meds.find(m => m.id === 'm1').notified, true)
  assert.strictEqual(meds.find(m => m.id === 'm2').notified, undefined)

  // Drugie przejście crona — już bez push.
  assert.strictEqual(await fns.__test.processUser(uid, ['tokA'], {}), 0)
})

test('przypomnienie o karmieniu: push raz, oznaczone jako wysłane', { skip }, async () => {
  sent.length = 0
  const uid = `u-feed-${Date.now()}`
  await put(uid, 'profiles', [{ id: 'p1', name: 'Zosia' }])
  await put(uid, 'reminder_feed_p1', {
    fireAt: Date.now() - 2 * 60000, feedTs: Date.now() - 182 * 60000, intervalMin: 180,
    title: 'Czas na karmienie? 🍼', body: 'Zosia: ostatnie karmienie o 14:30.', notified: false,
  })
  assert.strictEqual(await fns.__test.processUser(uid, ['tokA'], {}), 1)
  assert.strictEqual(sent[0].notification.body, 'Zosia: ostatnie karmienie o 14:30.')
  assert.strictEqual(sent[0].data.url, '/babylog/?tab=feed')
  const r = await get(uid, 'reminder_feed_p1')
  assert.strictEqual(r.notified, true)
  assert.strictEqual(r.intervalMin, 180)       // zostaje — partner może przesunąć przypomnienie
  assert.strictEqual(await fns.__test.processUser(uid, ['tokA'], {}), 0)
})

test('podsumowanie dnia: z danych dziecka, raz dziennie, tylko o wybranej godzinie', { skip }, async () => {
  sent.length = 0
  const owner = `u-own-${Date.now()}`
  const partner = `u-par-${Date.now()}`
  const { date, hour } = localDateHour(Date.now(), TZ)
  await put(owner, 'profiles', [{ id: 'p1', name: 'Zosia', toiletMode: 'diapers' }])
  await put(owner, 'feed_p1', [{ id: 'a', date }, { id: 'b', date }, { id: 'c', date: '2020-01-01' }])
  await put(owner, 'sleep_p1', [{ id: 's', date, durationMin: 90 }])
  await put(owner, 'diaper_p1', [{ id: 'd', date }])
  await put(partner, 'timezone', TZ)
  await put(partner, 'app_locale', 'pl')

  // Inna godzina → nic.
  await put(partner, 'daily_summary', { hour: (hour + 1) % 24 })
  assert.strictEqual(await fns.__test.processDailySummary(partner, owner, ['tokP'], {}), 0)

  await put(partner, 'daily_summary', { hour })
  assert.strictEqual(await fns.__test.processDailySummary(partner, owner, ['tokP'], {}), 1)
  assert.strictEqual(sent[0].notification.title, 'Podsumowanie dnia: Zosia')
  assert.strictEqual(sent[0].notification.body, 'Karmienia: 2 · Sen: 1 h 30 min · Pieluchy: 1')
  assert.deepStrictEqual(sent[0].tokens, ['tokP'])

  // Drugi raz tego samego dnia → nic.
  assert.strictEqual(await fns.__test.processDailySummary(partner, owner, ['tokP'], {}), 0)
})
