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
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https')
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
// sendTestPush (v2.12.2) — natywny test powiadomień push
// ──────────────────────────────────────────────────────────────────────────
//
// PROBLEM: w aplikacji natywnej (Capacitor Android) webowy przycisk "Wyślij
// testowe" używał service workera (showNotification), który w Android WebView
// nie działa. User nie miał jak sprawdzić, czy powiadomienia push w ogóle
// dochodzą po wgraniu v48 (natywny @capacitor/push-notifications).
//
// FIX: callable CF która wysyła PRAWDZIWY push FCM do wszystkich tokenów
// zalogowanego usera — tą samą drogą co scheduleNotifications. Jeśli na
// telefonie pojawi się powiadomienie, cały pipeline (token → FCM → device)
// działa. Czyści też nieaktualne tokeny (jak scheduleNotifications).
//
// CALL FROM CLIENT (tylko na natywnym):
//   const fn = httpsCallable(functions, 'sendTestPush')
//   const { data } = await fn()  // { sent, failed, tokenCount }

exports.sendTestPush = onCall({
  region: 'europe-west3',
  timeoutSeconds: 30,
  memory: '256MiB',
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in to send a test push.')
  }
  const uid = request.auth.uid

  // Pobierz tokeny usera
  const tokensSnap = await db.collection('users').doc(uid).collection('tokens').get()
  const tokens = []
  tokensSnap.forEach(d => {
    const tk = d.data()?.token || d.id
    if (tk) tokens.push(tk)
  })

  if (tokens.length === 0) {
    // Brak tokenów = apka nie zarejestrowała push (brak zgody / nie natywna / nie wgrana v48)
    return { sent: 0, failed: 0, tokenCount: 0 }
  }

  const message = {
    notification: {
      title: 'Spokojny Rodzic — test',
      body: 'Powiadomienia działają! To jest testowe powiadomienie.',
    },
    data: { tag: 'test-push', url: '/babylog/' },
    tokens,
  }

  let sent = 0
  let failed = 0
  try {
    const response = await messaging.sendEachForMulticast(message)
    sent = response.successCount
    failed = response.failureCount
    console.log(`[sendTestPush] uid=${uid} success=${sent} fail=${failed}`)

    // Cleanup nieaktualnych tokenów (jak scheduleNotifications)
    if (response.failureCount > 0) {
      for (let j = 0; j < response.responses.length; j++) {
        const r = response.responses[j]
        if (!r.success && (
          r.error?.code === 'messaging/invalid-registration-token' ||
          r.error?.code === 'messaging/registration-token-not-registered'
        )) {
          await db.collection('users').doc(uid).collection('tokens').doc(tokens[j]).delete().catch(() => {})
        }
      }
    }
  } catch (err) {
    console.error('[sendTestPush] failed:', err)
    throw new HttpsError('internal', 'Failed to send test push.', err.message)
  }

  return { sent, failed, tokenCount: tokens.length }
})

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

// ──────────────────────────────────────────────────────────────────────────
// purchasePipelineHealth — diagnostic endpoint
// ──────────────────────────────────────────────────────────────────────────
//
// v2.11.14: Health check pipeline'u zakupów. Wywołuje się z curl z secretem:
//
//   curl -H "Authorization: Bearer $REVENUECAT_AUTH" \
//        https://europe-west3-babylog-3c1cc.cloudfunctions.net/purchasePipelineHealth
//
// Zwraca JSON:
//   {
//     ok: true/false,
//     checks: {
//       secret_configured: bool,
//       firestore_writable: bool,
//       last_rc_event_at: timestamp | null,
//       last_rc_event_type: string | null,
//       seen_event_count_24h: number,
//     }
//   }
//
// To pomoże szybko sprawdzić "czy webhook RC działa" bez grzebania w logach.
// Wymagana auth bo nie chcemy public diagnostic endpoint (XSS / scraping).

exports.purchasePipelineHealth = onRequest({
  secrets: [REVENUECAT_AUTH],
  invoker: 'public',
  timeoutSeconds: 30,
  memory: '256MiB',
}, async (req, res) => {
  const expectedAuth = `Bearer ${REVENUECAT_AUTH.value()}`
  if ((req.get('Authorization') || '') !== expectedAuth) {
    res.status(401).send('Unauthorized')
    return
  }

  const checks = {
    secret_configured: !!REVENUECAT_AUTH.value(),
    firestore_writable: false,
    last_rc_event_at: null,
    last_rc_event_type: null,
    seen_event_count_24h: 0,
  }

  // Sanity: write + delete do specjalnego doc'a
  try {
    const healthRef = admin.firestore().collection('_health').doc('purchase_pipeline')
    await healthRef.set({ pingAt: Date.now() }, { merge: true })
    checks.firestore_writable = true
  } catch (e) {
    console.error('[health] firestore write failed:', e)
  }

  // Sprawdź ostatnie RC eventy w Firestore — collection group query po
  // wszystkich users/{uid}/data/rc_event_* (idempotency stamps zapisywane
  // przez webhook). Nie indeksujemy ich, więc używamy collection groupy
  // i prostej iteracji po rosnącym czasie. Limit 100 dla bezpieczeństwa.
  try {
    const since24h = Date.now() - 24 * 60 * 60 * 1000
    const allUsers = await admin.firestore().collection('users').limit(50).get()
    let count24h = 0
    let latestAt = 0
    let latestType = null
    for (const userDoc of allUsers.docs) {
      const events = await userDoc.ref.collection('data')
        .where('value.processedAt', '>=', since24h)
        .limit(20)
        .get()
        .catch(() => ({ docs: [] }))
      for (const ev of events.docs) {
        const v = ev.data()?.value
        if (!v?.processedAt || !v?.type) continue
        if (!ev.id.startsWith('rc_event_')) continue
        count24h += 1
        if (v.processedAt > latestAt) {
          latestAt = v.processedAt
          latestType = v.type
        }
      }
    }
    checks.seen_event_count_24h = count24h
    checks.last_rc_event_at = latestAt || null
    checks.last_rc_event_type = latestType
  } catch (e) {
    console.error('[health] event scan failed:', e)
  }

  const ok = checks.secret_configured && checks.firestore_writable
  res.status(200).json({ ok, checks, ts: Date.now() })
})

// ──────────────────────────────────────────────────────────────────────────
// initTrial — server-side trial start (P0-1 fix)
// ──────────────────────────────────────────────────────────────────────────
//
// PROBLEM (audit P0-1, 2026-05-06):
//   Wcześniej (v2.11.20) trial start dla zalogowanych userów był wyliczany
//   z `auth.currentUser.metadata.creationTime`. To jest dobre anti-abuse
//   (immutable), ALE dla każdego usera, który ma istniejące Firebase Auth
//   account z innych projektów lub wcześniejszych testów, `creationTime`
//   może być dowolnie odległe w przeszłości. Skutek: user pobiera apkę
//   z Production, klika "Zaloguj przez Google", widzi `trialDaysLeft = 0`
//   i komunikat "kup Premium" zamiast 14d trialu.
//
// FIX:
//   Server-side init — przy pierwszym logowaniu user wywołuje tę CF.
//   - Jeśli `users/{uid}/data/trial_start` NIE istnieje → zapisujemy
//     `{ value: serverTimestamp() }` (idempotentnie).
//   - Jeśli już istnieje → zwracamy istniejącą wartość bez zmiany.
//
// ANTI-ABUSE:
//   - Tylko zalogowani userzy (request.auth required przez onCall).
//   - Server jest source of truth — client nie może zmanipulować daty.
//   - Idempotentne — wielokrotne wywołania nie cofają trialu.
//   - Firestore rules (v2.11.20) blokują client write na `trial_start` —
//     tylko Admin SDK (czyli ta CF) może zapisać.
//
// CALL FROM CLIENT:
//   const fn = httpsCallable(functions, 'initTrial')
//   const { data } = await fn()
//   // data: { trialStartMs: <number>, alreadyExisted: <boolean> }

exports.initTrial = onCall({
  region: 'europe-west3',
  timeoutSeconds: 30,
  memory: '256MiB',
}, async (request) => {
  // Wymaga zalogowanego usera
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in to init trial.')
  }

  const uid = request.auth.uid
  const trialRef = admin.firestore()
    .collection('users').doc(uid)
    .collection('data').doc('trial_start')

  try {
    const snap = await trialRef.get()
    if (snap.exists) {
      const existingValue = snap.data()?.value
      // Wartość może być Firestore Timestamp lub number (legacy data z client'a
      // sprzed v2.11.20). Normalizujemy do milliseconds.
      const ms = typeof existingValue === 'number'
        ? existingValue
        : (existingValue?.toMillis ? existingValue.toMillis() : Date.now())
      return { trialStartMs: ms, alreadyExisted: true }
    }

    // Doc nie istnieje — pierwszy raz user się loguje (lub sprzed v2.11.31)
    const now = Date.now()
    await trialRef.set({ value: now }, { merge: false })
    console.log(`[initTrial] created trial_start for uid=${uid} at ${now}`)
    return { trialStartMs: now, alreadyExisted: false }
  } catch (err) {
    console.error('[initTrial] failed:', err)
    throw new HttpsError('internal', 'Failed to init trial.', err.message)
  }
})
