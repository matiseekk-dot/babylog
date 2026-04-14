// BabyLog Service Worker
// Obsługuje: push notifications, scheduled reminders, offline cache

const CACHE = 'babylog-v1'

// ── Install & Cache ───────────────────────────────────────────────────────────

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
    tag: data.tag || 'babylog',
    renotify: true,
    data: { url: data.url || '/babylog/' },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'BabyLog', options)
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

// ── Scheduled Reminders via periodicsync (fallback: message from app) ─────────

self.addEventListener('periodicsync', e => {
  if (e.tag === 'med-reminder-check') {
    e.waitUntil(checkMedReminders())
  }
})

// Wiadomość z aplikacji — zaplanuj lokalne przypomnienie
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_MED_REMINDER') {
    scheduleMedReminder(e.data.payload)
  }
  if (e.data?.type === 'CANCEL_MED_REMINDER') {
    cancelMedReminder(e.data.tag)
  }
})

// ── Lokalne przypomnienia (setTimeout-based) ──────────────────────────────────
// Przechowujemy pending timers w pamięci SW

const pendingTimers = new Map()

function scheduleMedReminder({ tag, title, body, delayMs }) {
  if (pendingTimers.has(tag)) {
    clearTimeout(pendingTimers.get(tag))
  }
  const timerId = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: '/babylog/icon-192.png',
      badge: '/babylog/icon-72.png',
      tag,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/babylog/' },
    })
    pendingTimers.delete(tag)
  }, delayMs)
  pendingTimers.set(tag, timerId)
}

function cancelMedReminder(tag) {
  if (pendingTimers.has(tag)) {
    clearTimeout(pendingTimers.get(tag))
    pendingTimers.delete(tag)
  }
}

async function checkMedReminders() {
  // Periodic sync fallback — SW sprawdza localStorage przez clients
  const allClients = await clients.matchAll()
  allClients.forEach(client => {
    client.postMessage({ type: 'CHECK_MED_REMINDERS' })
  })
}
