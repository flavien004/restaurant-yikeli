const CACHE_NAME = 'restochain-pwa-cache-v2';
const STATIC_ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-512x512.png'
];

// 1. Install event: pre-caches the static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: removes outdated caches immediately and claims clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Purging outdated PWA cache:', cacheName);
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

  // NEVER intercept or cache scripts, modules, Vite runtime, dev assets or APIs
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/src') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.pathname.includes('hot-update') ||
    url.hostname === 'localhost'
  ) {
    // Pure network pass-through for all code / modules
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

  // Static media and images: Stale While Revalidate
  if (
    req.destination === 'image' ||
    req.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2|woff)$/i)
  ) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(req)
            .then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
              }
            })
            .catch(() => {});
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
          .catch(() => {});
      })
    );
  }
});
