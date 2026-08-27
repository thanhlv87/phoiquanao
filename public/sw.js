// Đổi số này mỗi khi sửa chiến lược cache: activate sẽ dọn sạch cache cũ.
const CACHE_NAME = 'fashion-mix-v3';

// Vỏ app: đủ để mở được ứng dụng khi mất mạng.
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

// Font chữ: cache được thì tốt, hỏng cũng không chặn cài đặt.
const OPTIONAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
];

/**
 * Chỉ những file Vite sinh ra kèm hash trong tên mới được cache vĩnh viễn.
 *
 * Đây là chỗ trước đây gây lỗi "CSS cũ vẫn hiện": cache-first áp cho mọi file
 * tĩnh, nên `/index.css` (tên cố định, nội dung đổi mỗi lần sửa Tailwind) bị
 * khoá lại ở bản đầu tiên và không bao giờ được nạp lại. File có hash thì đổi
 * nội dung là đổi luôn tên, nên không bao giờ vướng chuyện đó.
 */
const isHashedAsset = (url) =>
  url.pathname.startsWith('/assets/') && /-[A-Za-z0-9_-]{8,}\.[a-z]+$/.test(url.pathname);

const isFontAsset = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

/** Trả cache ngay cho nhanh, đồng thời tải bản mới về cho lần sau. */
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.all(
        OPTIONAL_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn('SW: bỏ qua asset ngoài', url, e))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      // Chiếm quyền ngay thay vì đợi đóng hết tab: bản SW cũ mà còn sống thì
      // vẫn tiếp tục trả file cũ cho tới lần mở app sau.
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Firebase và các API khác luôn cần mạng.
  if (url.hostname.includes('googleapis') || url.hostname.includes('firebase')) {
    if (!isFontAsset(url)) return;
  }

  // Điều hướng trang: ưu tiên mạng. Bản build sinh tên file có hash, nếu trả
  // index.html cũ từ cache thì nó sẽ trỏ tới bundle đã bị xóa -> màn hình trắng.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'))
          );
        })
    );
    return;
  }

  // File có hash: bất biến, cache-first là an toàn tuyệt đối.
  if (url.origin === self.location.origin && isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Manifest, icon, font: tên cố định nhưng nội dung có thể đổi -> luôn hiện
  // được ngay khi offline, và tự làm mới ở nền.
  if ((url.origin === self.location.origin && APP_SHELL.includes(url.pathname)) || isFontAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Mọi thứ còn lại (kể cả file tên cố định của server dev) để trình duyệt tự
  // lo. Thà tải lại còn hơn phục vụ nội dung cũ mà không có cách nào gỡ.
});
