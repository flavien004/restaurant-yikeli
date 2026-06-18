const CACHE_NAME = 'yikeli-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-512x512.png'
];

// 1. Install event: pre-caches the main app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: removes outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: handle offline routing & caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Guard clause for non-HTTP(S) schemas (such as chrome-extension, websocket, blob)
  if (!req.url.startsWith('http') && !req.url.startsWith('https')) {
    return;
  }

  const url = new URL(req.url);

  // Bypass service worker coaching for local dev socket or REST APIs 
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.includes('hot-update') || 
    (url.hostname === 'localhost' && url.port !== '3000')
  ) {
    return;
  }

  // Document Navigation: Network First fallback to Cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Other assets (images, fonts, scripts): Stale While Revalidate / Cache First
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to update the cache
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
            }
          })
          .catch(() => { /* Quietly swallow background update errors when offline */ });
        
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Serve fallback or fail gracefully
        });
    })
  );
});
