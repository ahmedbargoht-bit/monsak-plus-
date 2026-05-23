// sw-mansek.js — Service Worker
// النسخة بتتغير كل رفع عشان يتحدث فوراً
const CACHE_VERSION = 'mansek-v' + Date.now();
const STATIC_CACHE = 'mansek-static-v3';

// الملفات اللي بتتحفظ في cache (الـ HTML والـ CSS بس)
const STATIC_FILES = [
  './mansek-app.html',
];

// ══ Install ══════════════════════════════════════════════════
self.addEventListener('install', e => {
  // تثبيت فوري بدون انتظار
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES))
  );
});

// ══ Activate ═════════════════════════════════════════════════
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ══ Fetch ════════════════════════════════════════════════════
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Supabase — دايماً من الشبكة، مش من الـ cache
  if (url.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Google Fonts و CDN — من الشبكة
  if (url.includes('fonts.googleapis') || url.includes('cdn.jsdelivr') || url.includes('cdnjs')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // الملفات الثابتة — Network First (شبكة أولاً، cache احتياطي)
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // حدّث الـ cache بالنسخة الجديدة
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// ══ Background Sync — رفع البيانات المحفوظة أوفلاين ═══════════
self.addEventListener('sync', e => {
  if (e.tag === 'flush-offline-queue') {
    e.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'FLUSH_QUEUE' }));
}

// ══ Push Notifications ═══════════════════════════════════════
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'منسق بلس', {
      body: data.body || 'إشعار جديد',
      icon: './icons/icon-192.png',
      badge: './icons/icon-96.png',
      dir: 'rtl',
      lang: 'ar'
    })
  );
});
