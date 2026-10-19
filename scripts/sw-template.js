// Generated at build time. Cache only explicitly listed application assets.
const prefix = `internlog-shell:${self.registration.scope}:`;
const cacheName = `${prefix}__VERSION__`;
const assets = __ASSETS__;
const urls = assets.map(
  (asset) => new URL(asset, self.registration.scope).href,
);
const shell = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(urls);
      // Do not skip waiting: keep old pages and their assets on the same revision.
    })(),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(prefix) && key !== cacheName)
          await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname))
    return;
  const key =
    request.mode === 'navigate' &&
    url.pathname === scope.pathname &&
    !url.search
      ? shell
      : request.url;
  if (!urls.includes(key)) return;
  event.respondWith(
    (async () => {
      const cached = await (await caches.open(cacheName)).match(key);
      return cached ?? fetch(request);
    })(),
  );
});
