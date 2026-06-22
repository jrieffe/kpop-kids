const CACHE = 'kpop-kids-v1';

const STATIC_FILES = [
  './kpop_kids_interativo.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: cache core files immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   • Local files     → cache-first (fast offline)
//   • Wikipedia/CDN   → network-first, cache fallback (photos & fonts work offline after first load)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isLocal = url.hostname === 'localhost' || url.protocol === 'file:';

  if (isLocal) {
    // Cache-first for local HTML/assets
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
  } else {
    // Network-first for CDN / Wikipedia (cache on success)
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
  }
});
