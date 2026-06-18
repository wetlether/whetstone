// Whetstone offline shell — cache-first so it works on a walk / at the DMV with no signal.
const C = 'whet-v6';
const ASSETS = ['./', 'index.html', 'items.js', 'manifest.json', 'icon.svg', 'score.html', 'score_data.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(C).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match('index.html'))));
});
