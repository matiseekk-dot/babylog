// Spokojny Rodzic — Service Worker v2
//
// Push notifications + lokalne przypomnienia o lekach.
//
// ARCHITEKTURA PRZYPOMNIEŃ (v2.7.5):
//
// Problem: setTimeout w SW nie przetrwa zamknięcia apki — przeglądarka
// usypia/zabija SW po ~30s bezczynności. Wcześniej apka korzystała z setTimeout
// w pamięci procesu SW i to było główne źródło tego, że notyfikacje nigdy
// nie przychodziły.
//
// Rozwiązanie: persystentna kolejka w Cache API — przy każdym wakeup SW
// (przez push, periodicsync, lub message z apki) sprawdzamy które reminders
// są overdue i pokazujemy notyfikację.
//
// Kolejka ma format: { tag, title, body, fireAt: <timestamp ms> }
// Tag jest deterministyczny (med-reminder-<logId>) więc edycja wpisu
// nadpisuje poprzednią pozycję.
//
// LIMITACJA: jeśli przeglądarka jest całkowicie zamknięta i SW śpi,
// notyfikacja może się spóźnić do momentu, aż coś obudzi SW. Pełną
// niezawodność daje tylko FCM z serwera — TODO na v1.1.

const QUEUE_CACHE = 'spokojny-rodzic-reminders-v1'
const QUEUE_KEY = '/__reminder_queue__'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const options = {
    body: data.body || '',
    icon: data.icon || '/babylog/icon-192.png',
    badge: '/babylog/icon-72.png',
    tag: data.tag || 'spokojny-rodzic',
    renotify: true,
    data: { url: data.url || '/babylog/' },
    actions: data.actions || [],
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

// ── Reminder queue: messages z apki ──────────────────────────────────────────

self.addEventListener('message', e => {
  const { type, payload, tag } = e.data || {}
  if (type === 'SCHEDULE_MED_REMINDER') {
    e.waitUntil(upsertReminder(payload))
  } else if (type === 'CANCEL_MED_REMINDER') {
    e.waitUntil(cancelReminder(tag || payload?.tag))
  } else if (type === 'CHECK_REMINDERS_NOW') {
    e.waitUntil(flushDue())
  } else if (type === 'TEST_NOTIFICATION') {
    // Test button w Settings
    e.waitUntil(self.registration.showNotification(payload?.title || 'Spokojny Rodzic', {
      body: payload?.body || 'Test',
      icon: '/babylog/icon-192.png',
      badge: '/babylog/icon-72.png',
      tag: 'test-notification',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/babylog/' },
    }))
  }
})

self.addEventListener('periodicsync', e => {
  if (e.tag === 'med-reminder-check') {
    e.waitUntil(flushDue())
  }
})

// ─── implementacja kolejki przez Cache API ───────────────────────────────────

async function readQueue() {
  try {
    const cache = await caches.open(QUEUE_CACHE)
    const res = await cache.match(QUEUE_KEY)
    if (!res) return []
    const txt = await res.text()
    const parsed = JSON.parse(txt)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

async function writeQueue(queue) {
  try {
    const cache = await caches.open(QUEUE_CACHE)
    await cache.put(QUEUE_KEY, new Response(JSON.stringify(queue), {
      headers: { 'Content-Type': 'application/json' }
    }))
  } catch (e) {
    // brak miejsca / quota — fallback to nothing
  }
}

async function upsertReminder({ tag, title, body, fireAt }) {
  if (!tag || !fireAt) return
  const queue = await readQueue()
  const filtered = queue.filter(r => r.tag !== tag)
  filtered.push({ tag, title, body, fireAt })
  await writeQueue(filtered)
  // Sprawdź od razu — jeśli fireAt już minął, dostarcz natychmiast.
  await flushDue()
}

async function cancelReminder(tag) {
  if (!tag) return
  const queue = await readQueue()
  await writeQueue(queue.filter(r => r.tag !== tag))
}

async function flushDue() {
  const queue = await readQueue()
  const now = Date.now()
  const due = queue.filter(r => r.fireAt <= now)
  const remaining = queue.filter(r => r.fireAt > now)

  for (const r of due) {
    await self.registration.showNotification(r.title || 'Spokojny Rodzic', {
      body: r.body || '',
      icon: '/babylog/icon-192.png',
      badge: '/babylog/icon-72.png',
      tag: r.tag,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/babylog/' },
    })
  }

  if (due.length > 0) {
    await writeQueue(remaining)
  }
}
