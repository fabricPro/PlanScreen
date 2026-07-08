// NDP — minimal service worker (kütüphanesiz).
// - Navigasyon: network-first, çevrimdışıysa cache'lenmiş index.html.
// - Aynı-köken GET varlıklar: cache-first + arka planda tazele.
// - /api/*: her zaman ağ (asla cache'lenmez).
const CACHE = "ndp-v1";
const SHELL = "/index.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Sadece GET ve aynı köken; /api asla cache'lenmez.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigasyon istekleri (SPA): önce ağ, olmazsa kabuk.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(SHELL, res.clone()));
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  // Varlıklar: cache-first, yoksa ağdan al ve cache'le.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const kopya = res.clone();
            caches.open(CACHE).then((c) => c.put(req, kopya));
          }
          return res;
        }),
    ),
  );
});
