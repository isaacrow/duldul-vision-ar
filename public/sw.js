/**
 * دلدل (Duldul Navigation) - Service Worker Cache Buster & Uninstaller
 * Immediately purges all stale caches and unregisters itself so all clients get the latest update instantly.
 */
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Zero fetch interception. Let the browser handle all networking natively.
