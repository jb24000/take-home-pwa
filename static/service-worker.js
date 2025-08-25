/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/', // Flask serves index
  '/static/manifest.json',
  '/static/css/styles.css',
  '/static/js/app.js',
  '/static/js/pwa.js',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/maskable-192.png',
  '/static/icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('static-') && k !== STATIC_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Strategy: 
// - HTML & static: cache-first (fast/offline)
// - API POST /api/calc: network-first with no caching (dynamic)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/api/calc') {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ ok:false, error:'offline' }), {status:503, headers:{'Content-Type':'application/json'}}))
    );
    return;
  }

  if (request.method === 'GET') {
    // Cache-first for same-origin GET
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          // only cache basic, same-origin, successful responses
          if (res.ok && res.type === 'basic' && url.origin === self.location.origin) {
            const resClone = res.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, resClone));
          }
          return res;
        }).catch(() => {
          // Fallback for HTML navigation requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          return new Response('', {status: 504});
        });
      })
    );
  }
});
