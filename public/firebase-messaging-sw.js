// Firebase Messaging Service Worker
// =====================================
// Firebase wymaga osobnego SW pod /firebase-messaging-sw.js (na poziomie root domeny).
// Ten plik OBSŁUGUJE TYLKO push messages od Firebase. Inne event handlers
// (cache, fetch, custom messages) zostają w głównym sw.js.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            "AIzaSyBDpM68v2BAdMX3sxcMe6ypnOIoNMR2Z4w",
  authDomain:        "babylog-3c1cc.firebaseapp.com",
  projectId:         "babylog-3c1cc",
  storageBucket:     "babylog-3c1cc.firebasestorage.app",
  messagingSenderId: "955437303426",
  appId:             "1:955437303426:web:fbb2637420255e5561969b",
})

const messaging = firebase.messaging()

// Background message handler — gdy apka zamknięta lub w tle, push przychodzi tutaj
messaging.onBackgroundMessage((payload) => {
  const { notification, data } = payload

  const title = notification?.title || 'Spokojny Rodzic'
  const options = {
    body: notification?.body || '',
    icon: '/babylog/icon-192.png',
    badge: '/babylog/icon-72.png',
    tag: data?.tag || 'fcm-background',
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: { url: data?.url || '/babylog/' },
  }

  return self.registration.showNotification(title, options)
})

// Click handler — otwiera apkę przy tapnięciu w notyfikację
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/babylog/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      const existing = list.find(c => c.url.includes('/babylog/') && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
