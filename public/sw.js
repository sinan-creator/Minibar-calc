/* Elektromarla Minibar Savings Calculator – offline cache for the static export.
 * Bump CACHE on each deploy; activate() purges older caches. */
const CACHE = "elektromarla-minibar-v2";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];
const SHELL_PATHS = new Set(["/", "/index.html"]);

/** Only successful, same-origin, non-redirected responses may enter the cache. */
const cacheable = (response) => response && response.ok && response.type === "basic" && !response.redirected;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Network first so new deployments land; cached shell when offline.
    // Only the real shell page is ever stored, never a 404, redirect or captive-portal response.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cacheable(response) && SHELL_PATHS.has(url.pathname)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/").then((hit) => hit || caches.match("/index.html") || Response.error())),
    );
    return;
  }

  const store = (response) => {
    if (cacheable(response)) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  };

  if (url.pathname.startsWith("/_next/static/")) {
    // Content-hashed, immutable: cache first.
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then(store)));
    return;
  }

  // Everything else (manifest, icons): network first, cache as offline fallback.
  event.respondWith(fetch(request).then(store).catch(() => caches.match(request).then((hit) => hit || Response.error())));
});
