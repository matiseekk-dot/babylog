/**
 * Cloud Functions for Spokojny Rodzic
 * ====================================
 *
 * scheduleNotifications — uruchamia się co 5 minut.
 *
 * Algorytm:
 * 1. Iteruje po wszystkich userach którzy mają zapisane FCM tokeny
 * 2. Pobiera ostatnie wpisy leków z medications/{userId}/items
 * 3. Sprawdza które przekroczyły próg (interval z bazy leków)
 * 4. Wysyła FCM push do wszystkich tokenów usera
 * 5. Oznacza wpis jako "notified" żeby nie wysłać dwa razy
 *
 * Bezpieczeństwo:
 * - Free tier wystarczy do ~2000 userów (2M wywołań/mc, my robimy
 *   12 wywołań/h × 24 × 30 = 8640 invocations/mc na samego cron'a + iteracja)
 * - Każdy invocation iteruje po wszystkich userach — to OK dla < 10k userów
 * - Powyżej tego trzeba refactor na queue/batch
 */

const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { setGlobalOptions } = require('firebase-functions/v2')
const admin = require('firebase-admin')
const medIntervalsData = require('./medIntervals.json')

admin.initializeApp()
setGlobalOptions({ region: 'europe-west3' }) // Frankfurt — najbliżej Polski

// v2.10.0: Secret Manager dla RevenueCat webhook auth.
// Wartość ustawiana lokalnie przez:
//   firebase functions:secrets:set REVENUECAT_AUTH
// Sekret nigdy nie jest hard-coded ani commitowany do repo.
// Funkcja revenueCatWebhook deklaruje że go używa (parametr secrets:[]
// w jej config) i przy starcie Firebase wstrzykuje wartość do process.env.
const REVENUECAT_AUTH = defineSecret('REVENUECAT_AUTH')

const db = admin.firestore()
const messaging = admin.messaging()

// v2.9.1: single source of truth — functions/medIntervals.json (kopia
// src/data/medIntervals.json, weryfikowana przez src/data/medIntervals.test.js).
// Wartości reprezentują "lek przestaje działać" / koniec konserwatywnego
// odstępu między dawkami — celowo wyższe niż minimalne ChPL odstępy
// (paracetamol 4h, ibuprofen 6h), żeby push nigdy nie sugerował podania
// wcześniej niż dopuszcza ulotka.
const MED_INTERVALS = medIntervalsData.intervals

function getMedInterval(medName) {
  if (!medName) return null
  const key = medName.toLowerCase().trim()
  for (const [name, mins] of Object.entries(MED_INTERVALS)) {
    if (key.includes(name)) return mins
  }
  return null // unknown med — nie pokazujemy
}

/**
 * Scheduled function — co 5 minut sprawdza wszystkie pending leki.
 *
 * Strategia: iteruje po userach którzy MAJĄ zapisane FCM tokeny (czyli
 * faktycznie używają apki + dali zgodę na powiadomienia). Userzy bez
 * tokenów są pomijani (mniej iteracji = niższy koszt).
 */
exports.scheduleNotifications = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Europe/Warsaw',
    timeoutSeconds: 540,
    memory: '256MiB',
  },
  async () => {
    const startTime = Date.now()
    let processed = 0
    let pushed = 0
    let errors = 0

    // 1. Pobranie wszystkich userów którzy mają tokeny
    const tokensSnap = await db.collectionGroup('tokens').get()
    const userTokens = {} // userId → [tokens]

    tokensSnap.forEach(docSnap => {
      const path = docSnap.ref.path // users/{uid}/tokens/{token}
      const parts = path.split('/')
      if (parts.length !== 4 || parts[0] !== 'users' || parts[2] !== 'tokens') return
      const uid = parts[1]
      const token = docSnap.data().token
      if (!token) return
      if (!userTokens[uid]) userTokens[uid] = []
      userTokens[uid].push(token)
    })

    console.log(`[scheduleNotifications] Found ${Object.keys(userTokens).length} users with tokens`)

    // 2. Iteracja po userach
    for (const [uid, tokens] of Object.entries(userTokens)) {
      try {
        processed++
        const sentNotifications = await processUser(uid, tokens)
        pushed += sentNotifications
      } catch (err) {
        errors++
        console.error(`[scheduleNotifications] Error for user ${uid}:`, err)
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[scheduleNotifications] Done. processed=${processed} pushed=${pushed} ` +
      `errors=${errors} duration=${duration}ms`
    )
  }
)

/**
 * Sprawdza pending leki dla jednego usera i wysyła push jeśli któryś dojrzał.
 *
 * @param {string} uid - user ID
 * @param {string[]} tokens - lista FCM tokenów (urządzenia usera)
 * @returns {number} liczba wysłanych notyfikacji
 */
async function processUser(uid, tokens) {
  let sent = 0

  // Apka zapisuje wszystkie dane pod users/{uid}/data/{klucz}
  // Profile są pod kluczem 'profiles' (lista profili dziecka)
  // Leki są pod kluczem 'meds_<profileId>' (lista wpisów per profil)
  // Każdy dokument ma format { value: [...array of items] }

  const dataCollection = db.collection('users').doc(uid).collection('data')

  // Pobranie listy profili
  const profilesDoc = await dataCollection.doc('profiles').get()
  if (!profilesDoc.exists) return 0
  const profiles = profilesDoc.data()?.value || []
  if (!Array.isArray(profiles) || profiles.length === 0) return 0

  for (const profile of profiles) {
    const profileId = profile.id
    if (!profileId) continue

    // Pobranie wpisów leków dla tego profilu
    const medsDoc = await dataCollection.doc(`meds_${profileId}`).get()
    if (!medsDoc.exists) continue
    const meds = medsDoc.data()?.value || []
    if (!Array.isArray(meds) || meds.length === 0) continue

    // Przetworzenie ostatnich 10 wpisów (starsze i tak wygasły dawno)
    const recent = meds.slice(0, 10)
    const updatedMeds = [...meds]
    let medsModified = false

    for (let i = 0; i < recent.length; i++) {
      const log = recent[i]
      // Skip jeśli już powiadomiony
      if (log.notified === true) continue

      const interval = getMedInterval(log.med)
      if (!interval) continue

      // Wyliczenie kiedy lek przestaje działać
      const fireAt = computeFireAt(log.date, log.time, interval)
      if (fireAt === null) continue

      const now = Date.now()
      // Powiadom jeśli mija od fireAt 0-60 min (window)
      const minutesAfter = (now - fireAt) / 60000
      if (minutesAfter < 0 || minutesAfter > 60) continue

      // Wyślij push do wszystkich tokenów
      // v2.9.1: title zmieniony z "Lek przestaje działać: {med}" na neutralny.
      // Stara fraza sugerowała implicit "lek przestał działać → podaj kolejną
      // dawkę", co jest medical advice. Nowa fraza neutralnie informuje że
      // minął bezpieczny odstęp; decyzja o podaniu kolejnej dawki jest
      // explicit przekazana userowi w body.
      const title = `Minął odstęp od ostatniej dawki ${log.med}`
      const body = `Podałeś/-aś o ${log.time}. Sprawdź czy potrzebna kolejna dawka (zgodnie z ulotką).`

      const message = {
        notification: { title, body },
        data: {
          tag: `med-${log.id}`,
          url: '/babylog/?tab=meds',
        },
        tokens: tokens,
      }

      try {
        const response = await messaging.sendEachForMulticast(message)
        sent += response.successCount
        console.log(
          `[processUser] uid=${uid} med=${log.med} ` +
          `success=${response.successCount} fail=${response.failureCount}`
        )

        // Cleanup nieprawidłowych tokenów (np. user odinstalował apkę)
        if (response.failureCount > 0) {
          for (let j = 0; j < response.responses.length; j++) {
            const r = response.responses[j]
            if (!r.success && (
              r.error?.code === 'messaging/invalid-registration-token' ||
              r.error?.code === 'messaging/registration-token-not-registered'
            )) {
              const badToken = tokens[j]
              await db.collection('users').doc(uid).collection('tokens').doc(badToken).delete()
              console.log(`[processUser] removed invalid token for uid=${uid}`)
            }
          }
        }

        // Mark as notified — modyfikujemy lokalnie i zapiszemy raz na końcu
        updatedMeds[i] = { ...log, notified: true, notifiedAt: Date.now() }
        medsModified = true
      } catch (err) {
        console.error(`[processUser] sendEachForMulticast failed:`, err)
      }
    }

    // Jeśli oznaczyliśmy coś jako notified, zapisz z powrotem cały array
    if (medsModified) {
      await dataCollection.doc(`meds_${profileId}`).set({ value: updatedMeds }, { merge: true })
    }
  }

  return sent
}

/**
 * Wyliczenie timestamp kiedy lek przestaje działać.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @param {number} intervalMin - czas działania w minutach
 * @returns {number|null} unix timestamp ms, lub null jeśli format błędny
 */
function computeFireAt(date, time, intervalMin) {
  if (!date || !time) return null
  try {
    const dt = new Date(`${date}T${time}:00`)
    if (isNaN(dt.getTime())) return null
    return dt.getTime() + intervalMin * 60 * 1000
  } catch {
    return null
  }
}

// ──────────────────────────────────────────────────────────────────────────
// revenueCatWebhook (v2.10.0)
// ──────────────────────────────────────────────────────────────────────────
//
// Server-side weryfikacja statusu Premium. Punkt końcowy POST który
// RevenueCat (configured w Dashboard → Integrations → Webhooks) woła
// po każdej zmianie subskrypcji usera.
//
// Flow:
//   1. RevenueCat woła https://europe-west3-babylog-3c1cc.cloudfunctions.net/revenueCatWebhook
//      z header `Authorization: Bearer <secret>` i JSON body
//   2. Funkcja weryfikuje secret (z Firebase Secret Manager — nie z kodu)
//   3. Parsuje event type i app_user_id (= Firebase UID)
//   4. Pisze przez Admin SDK do users/{uid}/data/premium_purchased
//      (Firestore rules blokują write z client — tylko Admin może)
//
// Eventy obsługiwane (z https://www.revenuecat.com/docs/webhooks):
//   - INITIAL_PURCHASE  → premium_purchased = true
//   - RENEWAL           → premium_purchased = true (re-affirm)
//   - CANCELLATION      → no-op (subskrypcja jest aktywna do końca okresu)
//   - EXPIRATION        → premium_purchased = false
//   - BILLING_ISSUE     → no-op (RC sam ponawia, expiruje przy ostatecznym fail)
//   - PRODUCT_CHANGE    → re-affirm (np. zmiana monthly→yearly)
//   - REFUND            → premium_purchased = false (rzadkie)
//   - SUBSCRIPTION_EXTENDED → premium_purchased = true
//   - UNCANCELLATION    → premium_purchased = true (user odwołał kasowanie)
//   - TRANSFER          → no-op (nie używamy multi-platform transfer)
//
// Zapisuje też metadane (premium_meta) do późniejszego diagnostyki:
//   { last_event, last_event_at, expires_at, product_id, store }
//
// Idempotency: każdy event ma `event.id` z RC. Zapisujemy do
// users/{uid}/data/processed_rc_events i ignorujemy jeśli już był.

exports.revenueCatWebhook = onRequest({
  // Secret jest zadeklarowany — Firebase nie pozwoli odpalić funkcji bez
  // wcześniejszego `firebase functions:secrets:set REVENUECAT_AUTH`.
  secrets: [REVENUECAT_AUTH],
  // CORS: webhook woła tylko serwer RevenueCat, więc CORS nie jest istotny.
  // Ale musimy mieć invoker public — RC nie autentykuje się przez Firebase IAM.
  invoker: 'public',
  // Timeout: RC retry wynosi do ~3min na request. 60s spokojnie wystarczy.
  timeoutSeconds: 60,
  // Memory: minimal — to tylko zapis do Firestore.
  memory: '256MiB',
}, async (req, res) => {
  // Tylko POST
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  // Weryfikacja secret w nagłówku Authorization.
  // RC pozwala wpisać dowolny header w Dashboard. Konwencja: "Bearer <secret>".
  const expectedAuth = `Bearer ${REVENUECAT_AUTH.value()}`
  const receivedAuth = req.get('Authorization') || ''
  if (receivedAuth !== expectedAuth) {
    console.warn('[rc-webhook] auth fail')
    res.status(401).send('Unauthorized')
    return
  }

  const body = req.body || {}
  const event = body.event
  if (!event || !event.type || !event.app_user_id) {
    console.warn('[rc-webhook] malformed body', JSON.stringify(body).slice(0, 500))
    res.status(400).send('Bad request')
    return
  }

  const eventId = event.id
  const eventType = event.type
  const uid = event.app_user_id
  const expiresAtMs = event.expiration_at_ms || null
  const productId = event.product_id || null
  const store = event.store || null

  console.log(`[rc-webhook] ${eventType} uid=${uid} eventId=${eventId} product=${productId}`)

  const userDataRef = admin.firestore()
    .collection('users').doc(uid)
    .collection('data')

  // Idempotency check
  if (eventId) {
    const eventDoc = await userDataRef.doc(`rc_event_${eventId}`).get()
    if (eventDoc.exists) {
      console.log(`[rc-webhook] duplicate eventId=${eventId} — skip`)
      res.status(200).send('OK (duplicate)')
      return
    }
  }

  // Decyzja: aktywować, deaktywować, czy nie ruszać premium_purchased
  let action = null  // 'grant' | 'revoke' | null
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'SUBSCRIPTION_EXTENDED':
    case 'UNCANCELLATION':
      action = 'grant'
      break
    case 'EXPIRATION':
    case 'REFUND':
      action = 'revoke'
      break
    case 'CANCELLATION':
    case 'BILLING_ISSUE':
    case 'TRANSFER':
    case 'TEST':
    default:
      action = null
      break
  }

  // Atomic write: premium_purchased + premium_meta + idempotency stamp
  const batch = admin.firestore().batch()
  if (action === 'grant') {
    batch.set(userDataRef.doc('premium_purchased'), { value: true }, { merge: true })
  } else if (action === 'revoke') {
    batch.set(userDataRef.doc('premium_purchased'), { value: false }, { merge: true })
  }
  batch.set(userDataRef.doc('premium_meta'), {
    value: {
      last_event: eventType,
      last_event_at: Date.now(),
      expires_at: expiresAtMs,
      product_id: productId,
      store,
    },
  }, { merge: true })
  if (eventId) {
    batch.set(userDataRef.doc(`rc_event_${eventId}`), {
      value: { type: eventType, processedAt: Date.now() },
    })
  }
  await batch.commit()

  res.status(200).send('OK')
})
