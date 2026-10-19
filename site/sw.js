// Offline support and self-updating. The worker caches the app shell when it
// is installed. After that:
// - the page itself is fetched from the network first, so a launch while the
//   phone is online always shows the newest deployed version; when the network
//   is off, or too slow to answer within NETWORK_TIMEOUT, the cached copy is
//   used instead;
// - the other files of the app are served from the cache at once and refreshed
//   in the background, so a changed icon or manifest arrives on the next launch;
// - the web fonts are kept from the first time they are fetched.
// Nothing here needs bumping when a new version is deployed.
const CACHE = 'strokerate-app';
const NETWORK_TIMEOUT = 2500;
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/icon.svg',
  'favicon.ico',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const fromCache = (req) => caches.match(req, { ignoreSearch: true });

// Fetch, and keep a copy in the cache when it succeeds.
async function fetchAndCache(req) {
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    const c = await caches.open(CACHE);
    c.put(req, res.clone());
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    // The page: network first, cache after a failure or NETWORK_TIMEOUT. A slow
    // fetch carries on in the background and still refreshes the cache.
    const network = fetchAndCache(req).catch(() => undefined);
    e.waitUntil(network);
    e.respondWith((async () => {
      const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT, undefined));
      const res = await Promise.race([network, timeout]);
      if (res && res.ok) return res;
      return (await fromCache(req)) || (await fromCache('./')) || (await network) || Response.error();
    })());
    return;
  }

  if (new URL(req.url).origin === location.origin) {
    // Our own files: cache first, refreshed in the background.
    const fresh = fetchAndCache(req).catch(() => undefined);
    e.waitUntil(fresh);
    e.respondWith(fromCache(req).then((hit) => hit || fresh.then((res) => res || Response.error())));
    return;
  }

  // Other origins (the web fonts): cache first.
  e.respondWith(fromCache(req).then((hit) => hit || fetchAndCache(req)));
});
