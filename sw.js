const CACHE_NAME = 'csxet-pwa-v10';
const BASE = new URL('./', self.registration.scope);
const APP_SHELL = [
  new URL('./', BASE).href,
  new URL('index.html', BASE).href,
  new URL('manifest.json', BASE).href,
  new URL('icons/icon-192-v2.png', BASE).href,
  new URL('icons/icon-512-v2.png', BASE).href,
  new URL('icons/apple-touch-icon-v2.png', BASE).href
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // لا نتدخل بطلبات المواقع الأخرى (Supabase, خطوط, تحليلات) حتى ما نبطّئها
  if (url.origin !== self.location.origin) return;

  // الصفحات: الشبكة أولاً (تصل التحديثات) مع نسخة احتياطية للعمل بدون انترنت
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match(new URL('index.html', BASE).href)))
    );
    return;
  }

  // الأيقونات والملفات الثابتة: من الكاش فوراً وتتحدّث بالخلفية
  event.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
