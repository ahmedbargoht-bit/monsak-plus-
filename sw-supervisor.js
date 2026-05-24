// sw-supervisor.js — Service Worker للمشرف بلس
const CACHE_NAME = 'supervisor-plus-v1';
const STATIC_ASSETS = [
  './mansek-supervisor.html',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
];

// تثبيت الـ Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('Cache addAll error (non-critical):', err);
      });
    })
  );
  self.skipWaiting();
});

// تفعيل الـ Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// استراتيجية Network First لـ Supabase، Cache First للباقي
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase — دايماً من الشبكة
  if(url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // الملف الرئيسي — Network First
  if(url.pathname.includes('mansek-supervisor.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // باقي الموارد — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
