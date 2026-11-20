// Notera service worker. Deliberately small: it never caches pages, API responses or files,
// so students always see current content. It only (1) shows a friendly page when offline and
// (2) keeps the site's fingerprinted JS/CSS so repeat visits use less data.
const STATIC = "notera-static-v1";
const OFFLINE = "notera-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE).then((c) => c.add(new Request("/offline", { cache: "reload" }))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== OFFLINE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    if (url.pathname.startsWith("/admin")) return; // never interfere with the admin area
    event.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
  }
});
