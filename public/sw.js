// Service Worker for handling notifications
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);
  
  const data = event.data?.json() || {};
  const title = data.title || 'New Message';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default',
    ...data.options,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();
  
  // Focus on the app window or open it
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
