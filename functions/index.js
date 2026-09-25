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
const { DEFAULT_TIME_ZONE, isValidTimeZone, localToTimestamp, localDateHour } = require('./time')
const { DEFAULT_LOCALE, normalizeLocale, medPushText, dailySummaryText } = require('./messages')

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

    // 2. Wspólne konto: partner trzyma tokeny pod swoim uid, a leki dziecka są
    // u właściciela. Grupujemy tokeny po uid z danymi, żeby każdy lek dał
    // jedno powiadomienie na każde urządzenie obojga rodziców. Link liczy się
    // tylko gdy potwierdza go też strona właściciela (partners/{uid}).
    const groups = {}      // dataUid → tokens
    const tokenOwner = {}  // token → uid, pod którym leży (do sprzątania)
    const dataUidOf = {}   // uid → dataUid (podsumowanie dnia liczy z danych dziecka)
    for (const [uid, tokens] of Object.entries(userTokens)) {
      let dataUid = uid
      try {
        const ownerUid = await getLinkedOwnerUid(uid)
        if (ownerUid && (await partnersOf(ownerUid).doc(uid).get()).exists) dataUid = ownerUid
      } catch (err) {
        console.error(`[scheduleNotifications] link check failed for ${uid}:`, err)
      }
      tokens.forEach(tk => { tokenOwner[tk] = uid })
      dataUidOf[uid] = dataUid
      groups[dataUid] = (groups[dataUid] || []).concat(tokens)
    }

    // 3. Iteracja po grupach
    for (const [dataUid, tokens] of Object.entries(groups)) {
      try {
        processed++
        const sentNotifications = await processUser(dataUid, tokens, tokenOwner)
        pushed += sentNotifications
      } catch (err) {
        errors++
        console.error(`[scheduleNotifications] Error for user ${dataUid}:`, err)
      }
    }

    // 4. Podsumowanie dnia — ustawienie osobiste, więc per użytkownik i tylko
    // na jego urządzenia (nie do partnera), z danych dziecka (dataUid).
    for (const [uid, tokens] of Object.entries(userTokens)) {
      try {
        pushed += await processDailySummary(uid, dataUidOf[uid] || uid, tokens, tokenOwner)
      } catch (err) {
        errors++
        console.error(`[scheduleNotifications] daily summary failed for ${uid}:`, err)
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
 * @param {string} uid - user ID (właściciel danych dziecka)
 * @param {string[]} tokens - lista FCM tokenów (urządzenia usera i partnerów)
 * @param {Object<string,string>} tokenOwner - token → uid, pod którym token leży
 * @returns {number} liczba wysłanych notyfikacji
 */
async function processUser(uid, tokens, tokenOwner = {}) {
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

  const timeZone = await getUserTimeZone(dataCollection)
  const locale = await getUserLocale(dataCollection)

  for (const profile of profiles) {
    const profileId = profile.id
    if (!profileId) continue

    sent += await processFeedReminder(dataCollection, profileId, uid, tokens, tokenOwner)

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

      // Wyliczenie kiedy lek przestaje działać (godzina w strefie rodzica)
      const fireAt = computeFireAt(log.date, log.time, interval, timeZone)
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
      // v2.16.4: w języku apki (functions/messages.js), wcześniej zawsze PL.
      const { title, body } = medPushText(locale, log.med, log.time)

      try {
        sent += await sendToTokens(uid, tokens, tokenOwner, {
          title, body, tag: `med-${log.id}`, url: '/babylog/?tab=meds',
        }, `med=${log.med}`)

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
 * v2.16.3: godzina liczona w strefie rodzica (wcześniej w UTC serwera —
 * push przychodził 2 h za późno latem w Polsce). Patrz functions/time.js.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @param {number} intervalMin - czas działania w minutach
 * @param {string} timeZone - strefa IANA z users/{uid}/data/timezone
 * @returns {number|null} unix timestamp ms, lub null jeśli format błędny
 */
function computeFireAt(date, time, intervalMin, timeZone = DEFAULT_TIME_ZONE) {
  const ts = localToTimestamp(date, time, timeZone)
  return ts === null ? null : ts + intervalMin * 60 * 1000
}

/** Strefa czasowa zapisywana przez apkę (App.jsx), domyślnie Europe/Warsaw. */
async function getUserTimeZone(dataCollection) {
  try {
    const tz = (await dataCollection.doc('timezone').get()).data()?.value
    return isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

/** Język apki (App.jsx zapisuje data/app_locale), domyślnie polski. */
async function getUserLocale(dataCollection) {
  try {
    return normalizeLocale((await dataCollection.doc('app_locale').get()).data()?.value)
  } catch {
    return DEFAULT_LOCALE
  }
}

/**
 * Wieczorne podsumowanie dnia (v2.16.4).
 *
 * Ustawienie users/{uid}/data/daily_summary = { value: { hour } } (osobiste —
 * partner ma własne). O tej godzinie w strefie użytkownika wysyłamy liczbę
 * karmień, łączny sen i pieluchy z dzisiaj dla każdego dziecka z danych
 * dataUid. Raz dziennie — data wysyłki w daily_summary_sent. Pusty dzień:
 * nic nie wysyłamy (bez poganiania).
 */
async function processDailySummary(uid, dataUid, tokens, tokenOwner) {
  const own = db.collection('users').doc(uid).collection('data')
  const hour = (await own.doc('daily_summary').get()).data()?.value?.hour
  if (!Number.isInteger(hour)) return 0

  const timeZone = await getUserTimeZone(own)
  const { date, hour: nowHour } = localDateHour(Date.now(), timeZone)
  if (nowHour !== hour) return 0

  const sentRef = own.doc('daily_summary_sent')
  if ((await sentRef.get()).data()?.value === date) return 0

  const data = db.collection('users').doc(dataUid).collection('data')
  const profiles = (await data.doc('profiles').get()).data()?.value
  if (!Array.isArray(profiles) || profiles.length === 0) return 0

  const todays = async key => {
    const list = (await data.doc(key).get()).data()?.value
    return Array.isArray(list) ? list.filter(e => e?.date === date) : []
  }
  const kids = []
  for (const p of profiles.slice(0, 5)) {
    if (!p?.id) continue
    const [feeds, sleeps, diapers] = await Promise.all([
      todays(`feed_${p.id}`), todays(`sleep_${p.id}`), todays(`diaper_${p.id}`),
    ])
    kids.push({
      name: String(p.name || '').slice(0, 40),
      feeds: feeds.length,
      sleepMin: sleeps.reduce((sum, s) => sum + (Number(s.durationMin) || 0), 0),
      diapers: diapers.length,
      toiletMode: p.toiletMode,
    })
  }

  // Oznacz dzień także przy pustym — inaczej liczylibyśmy co 5 min przez godzinę.
  await sentRef.set({ value: date })
  const text = dailySummaryText(await getUserLocale(own), kids)
  if (!text) return 0

  return await sendToTokens(uid, tokens, tokenOwner, {
    ...text, tag: `summary-${date}`, url: '/babylog/?tab=today',
  }, 'daily-summary')
}

/**
 * Push do wszystkich urządzeń (rodzic + partnerzy) + sprzątanie martwych tokenów.
 * @returns {number} liczba dostarczonych
 */
async function sendToTokens(uid, tokens, tokenOwner, { title, body, tag, url }, label = '') {
  const response = await messaging.sendEachForMulticast({
    notification: { title, body },
    data: { tag, url },
    // v2.12.4: wymuszamy wyświetlenie na pasku (jak w sendTestPush).
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        defaultSound: true,
        priority: 'max',
        visibility: 'public',
        notificationCount: 1,
      },
    },
    tokens,
  })
  console.log(
    `[processUser] uid=${uid} ${label} ` +
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
        const holder = tokenOwner[badToken] || uid
        await db.collection('users').doc(holder).collection('tokens').doc(badToken).delete()
        console.log(`[processUser] removed invalid token for uid=${uid}`)
      }
    }
  }
  return response.successCount
}

/**
 * Przypomnienie o karmieniu (v2.16.3).
 *
 * Apka po wpisie karmienia zapisuje users/{uid}/data/reminder_feed_{profileId}
 * = { value: { fireAt, title, body, notified } } — fireAt jako timestamp
 * (bez stref), tytuł i treść już w języku apki. Jedno przypomnienie na
 * dziecko; kolejne karmienie je nadpisuje. Wysyłamy w oknie 60 min po fireAt.
 */
async function processFeedReminder(dataCollection, profileId, uid, tokens, tokenOwner) {
  const ref = dataCollection.doc(`reminder_feed_${profileId}`)
  const reminder = (await ref.get()).data()?.value
  if (!reminder || reminder.notified || typeof reminder.fireAt !== 'number') return 0

  const minutesAfter = (Date.now() - reminder.fireAt) / 60000
  if (minutesAfter < 0 || minutesAfter > 60) return 0

  const text = v => String(v || '').slice(0, 200)
  try {
    const sent = await sendToTokens(uid, tokens, tokenOwner, {
      title: text(reminder.title) || 'Spokojny Rodzic',
      body: text(reminder.body),
      tag: `feed-${profileId}`,
      url: '/babylog/?tab=feed',
    }, 'feed-reminder')
    await ref.set({ value: { ...reminder, notified: true, notifiedAt: Date.now() } })
    return sent
  } catch (err) {
    console.error('[processFeedReminder] send failed:', err)
    return 0
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
    // v2.12.4: wymuszamy wyświetlenie na pasku Androida. Bez tego bloku push
    // bywał "cichy" (sent=1, ale nic na pasku). priority:high + notification
    // priority/visibility/sound → system pokazuje heads-up + dźwięk.
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        defaultSound: true,
        priority: 'max',
        visibility: 'public',
        notificationCount: 1,
      },
    },
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
//   - NON_RENEWING_PURCHASE → premium_purchased = true (plan dożywotni)
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
    // Zakup jednorazowy (plan dożywotni) — RC nie wysyła dla niego INITIAL_PURCHASE.
    case 'NON_RENEWING_PURCHASE':
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

// ──────────────────────────────────────────────────────────────────────────
// Wspólne konto dla rodziców (v2.15.0, Premium)
// ──────────────────────────────────────────────────────────────────────────
//
// Właściciel danych + do MAX_PARTNERS partnerów. Partner czyta i zapisuje dane
// dziecka pod users/{ownerUid}/data/* — reguły Firestore wpuszczają go, gdy
// istnieje users/{ownerUid}/partners/{partnerUid}. U partnera dokument
// users/{partnerUid}/data/linked_owner mówi apce, czyje dane pokazać.
// Oba dokumenty zapisują wyłącznie te funkcje (Admin SDK).
//
// Rozłączenie ustawia linked_owner na { value: null } zamiast kasować dokument:
// useFirestore celowo nie nadpisuje stanu, gdy dokument znika, więc usunięcie
// zostawiłoby partnera w cache nadal "połączonego".
//
// Komunikaty HttpsError to kody błędów tłumaczone po stronie apki
// (partner.error.<kod> w i18n.js).

const crypto = require('crypto')

const MAX_PARTNERS = 3
const INVITE_TTL_MS = 48 * 60 * 60 * 1000
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // bez 0/O/1/I
const TRIAL_MS = 14 * 24 * 60 * 60 * 1000

function userData(uid) {
  return db.collection('users').doc(uid).collection('data')
}

function partnersOf(uid) {
  return db.collection('users').doc(uid).collection('partners')
}

async function getLinkedOwnerUid(uid) {
  const snap = await userData(uid).doc('linked_owner').get()
  return snap.exists ? (snap.data()?.value?.ownerUid || null) : null
}

async function hasPremium(uid) {
  const [purchased, trial] = await Promise.all([
    userData(uid).doc('premium_purchased').get(),
    userData(uid).doc('trial_start').get(),
  ])
  if (purchased.exists && purchased.data()?.value === true) return true
  const start = trial.exists ? trial.data()?.value : null
  return typeof start === 'number' && Date.now() < start + TRIAL_MS
}

function displayName(auth) {
  return auth.token?.name || auth.token?.email || null
}

function randomInviteCode() {
  let code = ''
  for (let i = 0; i < 6; i++) code += INVITE_ALPHABET[crypto.randomInt(INVITE_ALPHABET.length)]
  return code
}

const partnerFnOptions = { region: 'europe-west3', timeoutSeconds: 30, memory: '256MiB' }

exports.createPartnerInvite = onCall(partnerFnOptions, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'not-signed-in')
  const uid = request.auth.uid

  if (await getLinkedOwnerUid(uid)) throw new HttpsError('failed-precondition', 'is-partner')
  if (!(await hasPremium(uid))) throw new HttpsError('permission-denied', 'not-premium')
  const partners = await partnersOf(uid).get()
  if (partners.size >= MAX_PARTNERS) throw new HttpsError('failed-precondition', 'too-many-partners')

  const now = Date.now()
  const invite = {
    ownerUid: uid,
    ownerName: displayName(request.auth),
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomInviteCode()
    try {
      await db.collection('partner_invites').doc(code).create(invite)
      return { code, expiresAt: invite.expiresAt }
    } catch (err) {
      if (err.code !== 6) throw err  // 6 = ALREADY_EXISTS → losuj ponownie
    }
  }
  throw new HttpsError('internal', 'code-collision')
})

exports.acceptPartnerInvite = onCall(partnerFnOptions, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'not-signed-in')
  const uid = request.auth.uid
  const code = String(request.data?.code || '').trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new HttpsError('invalid-argument', 'invite-not-found')

  const inviteRef = db.collection('partner_invites').doc(code)
  const ownerName = await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef)
    if (!inviteSnap.exists) throw new HttpsError('not-found', 'invite-not-found')
    const invite = inviteSnap.data()
    if (invite.expiresAt < Date.now()) throw new HttpsError('failed-precondition', 'invite-expired')
    if (invite.ownerUid === uid) throw new HttpsError('failed-precondition', 'own-invite')
    const ownerUid = invite.ownerUid

    const [myLink, myPartners, ownerLink, ownerPartners] = await Promise.all([
      tx.get(userData(uid).doc('linked_owner')),
      tx.get(partnersOf(uid).limit(1)),
      tx.get(userData(ownerUid).doc('linked_owner')),
      tx.get(partnersOf(ownerUid)),
    ])
    if (myLink.exists && myLink.data()?.value?.ownerUid) {
      throw new HttpsError('failed-precondition', 'already-linked')
    }
    if (!myPartners.empty) throw new HttpsError('failed-precondition', 'has-partners')
    // Właściciel sam został w międzyczasie partnerem kogoś innego — kod nieważny.
    if (ownerLink.exists && ownerLink.data()?.value?.ownerUid) {
      throw new HttpsError('not-found', 'invite-not-found')
    }
    if (ownerPartners.size >= MAX_PARTNERS) {
      throw new HttpsError('failed-precondition', 'too-many-partners')
    }

    const now = Date.now()
    tx.set(partnersOf(ownerUid).doc(uid), {
      name: displayName(request.auth),
      email: request.auth.token?.email || null,
      linkedAt: now,
    })
    tx.set(userData(uid).doc('linked_owner'), {
      value: { ownerUid, ownerName: invite.ownerName || null, linkedAt: now },
    })
    tx.delete(inviteRef)
    return invite.ownerName || null
  })

  console.log(`[acceptPartnerInvite] uid=${uid} linked via code`)
  return { ownerName }
})

exports.removePartnerLink = onCall(partnerFnOptions, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'not-signed-in')
  const uid = request.auth.uid
  const partnerUid = request.data?.partnerUid
  const batch = db.batch()

  if (partnerUid) {
    // Właściciel usuwa partnera
    if (typeof partnerUid !== 'string' || !/^[\w-]{1,128}$/.test(partnerUid)) {
      throw new HttpsError('invalid-argument', 'bad-partner')
    }
    const partnerRef = partnersOf(uid).doc(partnerUid)
    if (!(await partnerRef.get()).exists) return { ok: true }
    batch.delete(partnerRef)
    if ((await getLinkedOwnerUid(partnerUid)) === uid) {
      batch.set(userData(partnerUid).doc('linked_owner'), { value: null })
    }
  } else {
    // Partner opuszcza wspólne konto
    const ownerUid = await getLinkedOwnerUid(uid)
    if (ownerUid) batch.delete(partnersOf(ownerUid).doc(uid))
    batch.set(userData(uid).doc('linked_owner'), { value: null })
  }

  await batch.commit()
  return { ok: true }
})
