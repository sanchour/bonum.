/* Bonum Service Worker — Auto-updating PWA cache */
const CACHE = 'bonum-1tufopi';
const PRECACHE = ["./","index.html","manifest.webmanifest","favicon.svg","icons.svg","assets/index-Cysk23aP.js","assets/index-CQ0HNFdM.css"];
const MATCH = { ignoreSearch: true, ignoreVary: true };
const SHELL = () => new URL('index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bonum-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App shell: network first with 1.5s timeout, so new updates load immediately
  if (request.mode === 'navigate') {
    const network = fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(SHELL(), copy));
      }
      return response;
    });
    const networkOrNothing = network.catch(() => undefined);
    const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
    event.respondWith(
      Promise.race([networkOrNothing, timeout]).then(
        (response) => response || caches.match(SHELL(), MATCH).then((cached) => cached || network)
      )
    );
    return;
  }

  // Static assets: cache first (content-hashed), then network fallback
  event.respondWith(
    caches.match(request, MATCH).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
