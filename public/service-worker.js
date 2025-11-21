const CACHE_NAME = 'outfit-logger-v1';
const RUNTIME_CACHE = 'outfit-logger-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.href.includes('firebasestorage.googleapis.com')) {
    return;
  }

  // Handle Firebase Storage images with cache-first strategy
  if (url.href.includes('firebasestorage.googleapis.com')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            // Cache the image for offline use
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return offline placeholder if available
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#e2e8f0"/><text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-size="20">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.includes('/api') || url.href.includes('firestore.googleapis.com') || url.href.includes('gemini')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            if (response.ok && request.method === 'GET') {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle offline status
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
