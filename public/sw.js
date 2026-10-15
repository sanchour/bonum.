/*
 * Bonum offline shell.
 * Data never lives here: axioms are in IndexedDB. This worker only keeps the app shell and its
 * static assets available offline, so the scriptorium opens in airplane mode.
 */
const VERSION = "bonum-shell-v1";
// Paths are resolved against the registration scope, so the worker works at /bonum/ on Pages and at / locally.
const BASE = new URL(self.registration ? self.registration.scope : self.location).pathname;
const SHELL = ["", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"].map((p) => BASE + p);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.includes("/_next/static/") ||
    url.pathname.includes("/icons/") ||
    /\.(?:woff2?|ttf|otf|png|svg|ico|webp)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, fall back to the cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(BASE, copy));
          return response;
        })
        .catch(() => caches.match(BASE).then((cached) => cached || Response.error())),
    );
    return;
  }

  // Hashed build assets and icons: cache first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
