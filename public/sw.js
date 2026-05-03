// Spokojny Rodzic — Service Worker v6 (v2.11.5: dodany app-shell cache + fetch handler)
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
//
// v2.11.5 — App-shell caching:
// Dodany fetch handler ze strategią network-first dla strony głównej, cache-first
// dla statycznych zasobów (assets/*, icons, manifest). To daje:
//   1. Lighthouse PWA score: pass
//   2. Szybszy load przy powtórnych wizytach
//   3. Podstawowe offline support — jeśli userka ma utracone połączenie w
//      trakcie sesji, apka nie crashuje a oferuje to co już ściągnięte.
// Cache versioning: zmiana SHELL_CACHE invaliduje wszystko (np. przy nowym
// release). Bezpieczne — Firebase data nadal pochodzi z sieci, tylko app-shell
// (HTML/JS/CSS/assets) jest cache'owany.

const SHELL_CACHE = 'babylog-shell-v6'
const SHELL_FILES = [
  '/babylog/',
  '/babylog/manifest.json',
  '/babylog/icon-192.png',
  '/babylog/icon-512.png',
  '/babylog/icon-72.png',
  '/babylog/icon-96.png',
]

// v2.9.1: single source of truth dla interwałów leków.
// importScripts() ładuje plik synchronicznie podczas registracji SW —
// self.MED_INTERVALS jest dostępne natychmiast we wszystkich event handlerach.
// Synchronizacja z src/data/medIntervals.json + functions/medIntervals.json
// jest weryfikowana przez src/data/medIntervals.test.js.
try {
  importScripts('/babylog/medIntervals.constants.js')
} catch (e) {
  // Defensywnie — jeśli plik się nie załaduje, SW dalej działa, tylko
  // bez notyfikacji o lekach. Lepiej niż crash całego SW.
  console.error('[SW] medIntervals.constants.js load failed:', e)
  self.MED_INTERVALS = {}
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL_FILES))
      .catch(err => console.warn('[SW] shell cache prefill failed:', err))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Wyczyść stare cache versions (każdy bump SHELL_CACHE invalidate'uje stary)
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('babylog-shell-') && k !== SHELL_CACHE)
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

// ── Fetch handler — network-first dla nawigacji, cache-first dla statyki ────
//
// Strategy:
//   1. Firebase / Firestore / RevenueCat API — bypass cache (zawsze sieć).
//   2. App-shell HTML (navigation request) — network-first z fallback do cache.
//   3. Statyczne assety (.js/.css/.png/.svg/.woff itd.) — cache-first z update
//      w tle (stale-while-revalidate-lite).
self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 1. Bypass dla third-party API (Firebase, RC, Sentry, recaptcha)
  if (!url.origin.includes(self.location.origin) ||
      url.pathname.includes('/google.firestore') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.includes('recaptcha') ||
      url.pathname.includes('firestore')) {
    return // pozwól browserowi obsłużyć normalnie
  }

  // 2. Navigation request — HTML — network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Update cache w tle
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(SHELL_CACHE).then(c => c.put(req, clone)).catch(() => {})
          }
          return res
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/babylog/')))
    )
    return
  }

  // 3. Statyczne assety — cache-first
  if (req.url.match(/\.(js|css|png|svg|jpg|jpeg|webp|woff2?|ttf|json)$/)) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(SHELL_CACHE).then(c => c.put(req, clone)).catch(() => {})
          }
          return res
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }
  // Wszystko inne — domyślnie sieć
})

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

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  if (type === 'CHECK_MED_REMINDERS') {
    event.waitUntil(checkMedReminders(payload || {}))
  } else if (type === 'TEST_NOTIFICATION') {
    // event.waitUntil ZAWSZE — bez tego SW może być zamknięty zanim
    // notyfikacja zostanie wyświetlona (TWA Android jest na to wrażliwe).
    event.waitUntil(
      self.registration.showNotification(payload?.title || 'Spokojny Rodzic', {
        body: payload?.body || 'Test',
        icon: '/babylog/icon-192.png',
        badge: '/babylog/icon-72.png',
        tag: 'test-notification',
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: { url: '/babylog/' },
      }).then(() => {
        // Powiadom klientów że notyfikacja została pokazana — do logów
        self.clients.matchAll().then(clients => {
          clients.forEach(c => c.postMessage({ type: 'NOTIFICATION_SHOWN', tag: 'test' }))
        })
      }).catch(err => {
        // Powiadom klientów o błędzie — apka może to pokazać w UI
        self.clients.matchAll().then(clients => {
          clients.forEach(c => c.postMessage({
            type: 'NOTIFICATION_ERROR',
            tag: 'test',
            error: err.message || String(err)
          }))
        })
      })
    )
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

// v2.9.1: MED_DURATION (lokalny hardcode) usunięty. Wartości pochodzą z
// self.MED_INTERVALS, załadowane przez importScripts() na górze pliku
// z public/medIntervals.constants.js. Single source of truth zsynchronizowany
// z src/data/medIntervals.json.

function getDurationMin(medName) {
  const lc = (medName || '').toLowerCase()
  const intervals = self.MED_INTERVALS || {}
  for (const [name, mins] of Object.entries(intervals)) {
    if (lc.includes(name)) return mins
  }
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
