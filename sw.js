const CACHE_NAME = 'csxet-pwa-v3';
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
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
