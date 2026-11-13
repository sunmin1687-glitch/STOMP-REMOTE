// Stomp Remote service worker.
// Network first: when online you always get the newest version from GitHub;
// the cached copy is only used when the network is unavailable.
const CACHE = 'stomp-remote-v13';
const CORE = [
  './stomp-remote.html',
  './usb-test.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  // 같은 사이트 파일은 항상 서버에 새 버전이 있는지 확인 (GitHub Pages의 10분 캐시 무시)
  const net = sameOrigin ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  event.respondWith(
    net
      .then((res) => {
        if (res.ok && sameOrigin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
