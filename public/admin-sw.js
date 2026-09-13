// Service worker du dashboard admin SMART.ECO — uniquement pour recevoir les
// notifications Web Push (pas de cache/offline, ce n'est pas son rôle ici).

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'SMART.ECO Admin', {
      body: data.body || '',
      icon: '/admin-icons/icon-192.png',
      badge: '/admin-icons/icon-192.png',
      data: { url: data.url || '/admin' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/admin'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes('/admin'))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
