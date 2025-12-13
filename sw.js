self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('sw-static'));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isTile = /tile\.openstreetmap\.org\/.+\.(png|jpg|jpeg|webp)$/.test(url.href);
  if (isTile) {
    event.respondWith(
      caches.open('osm-tiles').then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || fetch(req);
        }
      })
    );
  }
});

