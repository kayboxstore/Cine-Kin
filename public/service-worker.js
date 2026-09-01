const CACHE_NAME = "cine-kin-shell-v2";
const OFFLINE_SHELL = "/index.html";
const PRECACHE = [OFFLINE_SHELL, "/manifest.json", "/favicon-192.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(names =>
        Promise.all(
          names
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
  );
  self.clients.claim();
});

async function networkFirst(request, fallback) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(fallback, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(fallback)) ??
      new Response("Hors ligne", { status: 503 })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigations must see the latest deployment. The cached shell is used only
  // when the network is genuinely unavailable.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, OFFLINE_SHELL));
    return;
  }

  // Vite assets are content-hashed and therefore safe to cache immutably.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
  }
});
