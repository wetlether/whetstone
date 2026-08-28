// Whetstone offline shell. Online requests refresh the offline copy so a missed
// release bump cannot strand a phone on old lessons indefinitely.
const C = 'whet-v12';
const ASSETS = ['./', 'index.html', 'items.js', 'manifest.json', 'icon.svg', 'score.html', 'score_data.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => {
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(caches.open(C).then(c => c.put(e.request, copy)));
    }
    return res;
  }).catch(async () => {
    const hit = await caches.match(e.request);
    return hit || caches.match('index.html');
  }));
});
