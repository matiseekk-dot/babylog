// Spokojny Rodzic — Service Worker v3
//
// WZORZEC PS5 VAULT — uproszczony i niezawodny:
//
// Zamiast próbować schedulować notyfikacje w tle (co nie działa — przeglądarka
// usypia SW i timery znikają), apka przy każdym otwarciu wysyła do SW listę
// wpisów leków + obecny czas, a SW iteruje po nich, sprawdza które przekroczyły
// próg (minął odstęp między dawkami), i pokazuje notyfikację dla każdego.
//
// Cache "shown" zapobiega pokazywaniu tej samej notyfikacji dwa razy w ciągu
// godziny.
//
// LIMITACJA: notyfikacje pokazują się TYLKO gdy user otworzy apkę.
// Jeśli apka jest zamknięta, użytkownik nic nie dostanie — ale to jest
// uczciwe i przewidywalne, nie jak wcześniejszy "może działa, może nie".
//
// Dla 100% niezawodności w tle wymagany byłby FCM (push z serwera) — TODO.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// ── Push (gdyby kiedyś FCM) ──────────────────────────────────────────────────

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const options = {
    body: data.body || '',
    icon: data.icon || '/babylog/icon-192.png',
    badge: '/babylog/icon-72.png',
    tag: data.tag || 'spokojny-rodzic',
    renotify: true,
    data: { url: data.url || '/babylog/' },
    vibrate: [200, 100, 200],
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Spokojny Rodzic', options)
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/babylog/'
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes('/babylog/') && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

// ── Główna logika: sprawdzaj wpisy leków on-demand ──────────────────────────

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {}

  if (type === 'CHECK_MED_REMINDERS') {
    await checkMedReminders(payload || {})
  } else if (type === 'TEST_NOTIFICATION') {
    await self.registration.showNotification(payload?.title || 'Spokojny Rodzic', {
      body: payload?.body || 'Test',
      icon: '/babylog/icon-192.png',
      badge: '/babylog/icon-72.png',
      tag: 'test-notification',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/babylog/' },
    })
  }
})

// payload = { logs: [{id, med, dose, date, time}], locale, strings: {title, body} }
async function checkMedReminders({ logs = [], locale = 'pl', strings = {} }) {
  const now = Date.now()

  for (const log of logs) {
    const dur = getDurationMin(log.med)
    if (!dur) continue

    const fireAt = fireAtTimestamp(log.date, log.time, dur)
    if (fireAt === null) continue

    // Pokazujemy gdy fireAt już minął, ale nie dawniej niż 6h temu
    const minsAgo = Math.floor((now - fireAt) / 60000)
    if (minsAgo < 0) continue          // jeszcze nie czas
    if (minsAgo > 360) continue        // zbyt dawno — nie spamuj

    // Hour bucket: jeśli user otworzy apkę 5× w ciągu godziny, dostanie 1 notyfikację
    const hourBucket = Math.floor(now / (60 * 60 * 1000))
    const tag = `med-${log.id}-${hourBucket}`
    if (await wasShown(tag)) continue

    const hours = Math.floor(dur / 60)
    const dose = log.dose ? ` (${log.dose})` : ''
    const title = strings.title || (locale === 'en'
      ? 'Interval between doses has passed 💊'
      : 'Minął odstęp między dawkami 💊')
    const body = (strings.body || (locale === 'en'
      ? '{med}{dose} — {hours}h since last dose. Only give the next dose if needed, following the medicine leaflet.'
      : '{med}{dose} — minęło {hours}h od ostatniej dawki. Kolejną podaj tylko jeśli potrzebna, zgodnie z ulotką leku.'))
      .replace('{med}', log.med || '')
      .replace('{dose}', dose)
      .replace('{hours}', hours)

    await self.registration.showNotification(title, {
      body,
      icon: '/babylog/icon-192.png',
      badge: '/babylog/icon-72.png',
      tag,
      renotify: false,
      vibrate: [200, 100, 200],
      data: { url: '/babylog/' },
    })

    await markShown(tag)
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────

const MED_DURATION = {
  paracetamol: 360,  // 6h
  ibuprofen:   480,  // 8h
}

function getDurationMin(medName) {
  const lc = (medName || '').toLowerCase()
  if (lc.includes('paracetamol')) return MED_DURATION.paracetamol
  if (lc.includes('ibuprofen'))   return MED_DURATION.ibuprofen
  return null
}

function fireAtTimestamp(dateStr, timeStr, durationMin) {
  if (!dateStr || !timeStr) return null
  const ref = new Date(dateStr + 'T00:00:00')
  const [h, m] = timeStr.split(':').map(Number)
  ref.setHours(h, m, 0, 0)
  return ref.getTime() + durationMin * 60000
}

// "Shown notifications" cache — żeby jedna nie wyskakiwała 5×.
const SHOWN_CACHE = 'spokojny-rodzic-shown-v1'

async function wasShown(tag) {
  try {
    const cache = await caches.open(SHOWN_CACHE)
    const r = await cache.match('/__shown__/' + tag)
    return !!r
  } catch {
    return false
  }
}

async function markShown(tag) {
  try {
    const cache = await caches.open(SHOWN_CACHE)
    await cache.put('/__shown__/' + tag, new Response('1'))
    cleanupShownCache()
  } catch {}
}

async function cleanupShownCache() {
  try {
    const cache = await caches.open(SHOWN_CACHE)
    const keys = await cache.keys()
    const currentBucket = Math.floor(Date.now() / (60 * 60 * 1000))
    for (const req of keys) {
      const match = req.url.match(/-(\d+)$/)
      if (match) {
        const bucket = parseInt(match[1], 10)
        if (currentBucket - bucket > 24) {
          await cache.delete(req)
        }
      }
    }
  } catch {}
}
