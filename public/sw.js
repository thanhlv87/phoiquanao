
const CACHE_NAME = 'fashion-mix-v2';

// Asset cùng origin: bắt buộc phải cache được, thiếu là hỏng app.
const LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Asset bên thứ ba: cache nếu được, hỏng cũng không được chặn quá trình install.
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(LOCAL_ASSETS);
      await Promise.all(
        EXTERNAL_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn('SW: bỏ qua asset ngoài', url, e))
        )
      );
    })
  );
  self.skipWaiting();
});

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
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu API của Firebase và Gemini (cần mạng)
  if (event.request.url.includes('googleapis') || event.request.url.includes('firebase')) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  // Điều hướng trang: ưu tiên mạng. Bản build sinh tên file có hash, nếu trả
  // index.html cũ từ cache thì nó sẽ trỏ tới bundle đã bị xóa -> màn hình trắng.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(event.request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'))
          );
        })
    );
    return;
  }

  // Asset tĩnh (tên có hash, bất biến): ưu tiên cache.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Lưu cache các asset tĩnh mới nếu cần
          if (fetchResponse.status === 200) {
             cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    })
  );
});
