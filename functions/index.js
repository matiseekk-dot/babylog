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
const { setGlobalOptions } = require('firebase-functions/v2')
const admin = require('firebase-admin')

admin.initializeApp()
setGlobalOptions({ region: 'europe-west3' }) // Frankfurt — najbliżej Polski

const db = admin.firestore()
const messaging = admin.messaging()

// Czas działania leków w minutach (zgodnie z ulotkami SmPC)
const MED_INTERVALS = {
  'paracetamol': 4 * 60,  // 4h
  'ibuprofen':   6 * 60,  // 6h
  'panadol':     4 * 60,
  'apap':        4 * 60,
  'ibuprom':     6 * 60,
  'nurofen':     6 * 60,
}

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
      const title = `Lek przestaje działać: ${log.med}`
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
