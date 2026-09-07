// Service worker for offline caching and resilient app delivery.
const CACHE_NAME = 'saas-cache-v2026-07-30-1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/frontend/styles/main.css',
  '/frontend/manifest.webmanifest',
  '/frontend/mockData.js',
  '/frontend/router.js',
  '/frontend/utils/db.js',
  '/frontend/utils/api.js',
  '/frontend/utils/helpers.js',
  '/frontend/components.js',
  '/frontend/pages/mainsite.js',
  '/frontend/pages/login.js',
  '/frontend/pages/register.js',
  '/frontend/pages/dashboard.js',
  '/frontend/pages/aufgaben.js',
  '/frontend/pages/noten.js',
  '/frontend/pages/kalender.js',
  '/frontend/pages/tests.js',
  '/frontend/pages/ai.js',
  '/frontend/pages/profil.js',
  '/frontend/pages/abo.js',
  '/frontend/pages/statistiken.js',
  '/frontend/pages/goals.js',
  '/frontend/pages.js',
  '/frontend/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.searchParams.has('v')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }

  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok && requestUrl.origin === self.location.origin) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
        }
        return networkResponse;
      }).catch(() => caches.match('/index.html') || new Response('Offline - Keine Verbindung', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain' })
      }));
    })
  );
});
