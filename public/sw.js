/* SolveEverything service worker — versioned, explicit cache strategies.
 *
 *  App shell (navigations)  → network-first, fall back to cached shell, then offline.html
 *  Static assets (_next/*)  → cache-first + stale-while-revalidate in the background
 *  Formula catalogue (JSON) → stale-while-revalidate with a 24 h TTL
 *  Other GET                → network-first with cache fallback
 *
 * Bump CACHE_VERSION on every release; old caches are removed on activate.
 */
const CACHE_VERSION = 'v5.0.0';
const SHELL_CACHE = `se-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `se-assets-${CACHE_VERSION}`;
const DATA_CACHE = `se-data-${CACHE_VERSION}`;
const DATA_TTL_MS = 24 * 60 * 60 * 1000;

const scopeUrl = new URL('./', self.location);
const SHELL_URLS = [
  './',
  './search/',
  './share/',
  './categories/',
  './tools/',
  './tools/units/',
  './tools/chemistry/',
  './tools/graph/',
  './tools/matrix/',
  './tools/statistics/',
  './tools/assistant/',
  './tools/cas/',
  './tools/pipeline/',
  './tools/graph3d/',
  './tools/check-work/',
  './tools/iran/',
  './tools/formula-builder/',
  './tools/simulator/',
  './practice/',
  './learn/',
  './workspace/',
  './periodic-table/',
  './constants/',
  './history/',
  './settings/',
  './manifest.webmanifest',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
].map((path) => new URL(path, scopeUrl).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(
        SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) await cache.put(url, response);
          } catch {
            /* an offline install must not fail the whole service worker */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('se-') && ![SHELL_CACHE, ASSET_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isSameOrigin = (url) => url.origin === self.location.origin;
const isStaticAsset = (url) =>
  url.pathname.includes('/_next/static/') ||
  /\.(?:js|css|woff2?|png|svg|jpg|jpeg|webp|ico)$/.test(url.pathname);
const isData = (url) => /\.json$/.test(url.pathname);

async function putInCache(cacheName, request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch {
    /* quota errors are non-fatal */
  }
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    void putInCache(cacheName, request, response);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title><body style="background:#000;color:#e4e1e6;font-family:system-ui;display:grid;place-items:center;min-height:100vh">آفلاین هستید / You are offline</body>',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }
}

async function staleWhileRevalidate(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set('x-se-cached-at', String(Date.now()));
        const body = await response.clone().blob();
        await cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    if (ttlMs) {
      const cachedAt = Number(cached.headers.get('x-se-cached-at') || 0);
      if (Date.now() - cachedAt > ttlMs) {
        const fresh = await refresh;
        if (fresh) return fresh;
      }
    }
    return cached;
  }
  const fresh = await refresh;
  if (fresh) return fresh;
  return new Response(JSON.stringify({ error: 'offline', cached: false }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  });
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request)
      .then((response) => putInCache(cacheName, request, response))
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    void putInCache(cacheName, request, response);
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          void putInCache(SHELL_CACHE, request, response);
          return response;
        } catch {
          const cached = (await caches.match(request)) || (await caches.match(new URL('./', scopeUrl).toString()));
          if (cached) return cached;
          const offline = await caches.match(new URL('./offline.html', scopeUrl).toString());
          if (offline) return offline;
          return new Response('آفلاین هستید / You are offline', {
            status: 503,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }
      })(),
    );
    return;
  }

  if (isData(url)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE, DATA_TTL_MS));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, ASSET_CACHE));
});
