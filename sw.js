// مندوب بيع بلس — Service Worker v1.0
const CACHE_NAME = 'mandob-v1';
const STATIC_ASSETS = [
  '/monsak-plus-/sales-rep.html',
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - Network first, cache fallback
self.addEventListener('fetch', e => {
  // Skip non-GET and Supabase API calls
  if (e.request.method !== 'GET' || e.request.url.includes('supabase.co')) return;
  
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
