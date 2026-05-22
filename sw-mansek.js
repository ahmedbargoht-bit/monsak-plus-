// ══════════════════════════════════════════════════════════════
// sw-mansek.js — Service Worker
// منظومة الطحان للتمور — منسق بلس + مشرف بلس
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'mansek-v1';
const OFFLINE_QUEUE_KEY = 'mansek-offline-queue';

// الملفات اللي هتتحفظ للأوفلاين
const STATIC_ASSETS = [
  './mansek-app.html',
  './mansek-supervisor.html',
  './mansek-admin.html',
  './manifest-mansek.json',
  './manifest-supervisor.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // نحاول نحفظ كل الملفات — لو أي ملف فشل مش مشكلة
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => console.warn('SW: فشل تحميل', url))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // طلبات Supabase — Network First مع حفظ في Queue لو أوفلاين
  if (url.hostname.includes('supabase.co')) {
    // POST/PATCH/DELETE — حفظ في الـ Queue لو أوفلاين
    if (['POST', 'PATCH', 'DELETE'].includes(event.request.method)) {
      event.respondWith(
        fetch(event.request.clone()).catch(async () => {
          // حفظ الطلب في IndexedDB Queue
          await saveToOfflineQueue(event.request.clone());
          return new Response(
            JSON.stringify({ offline: true, queued: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }

    // GET من Supabase — Network First
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response('[]', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // الملفات الستاتيك — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // حفظ في الكاش لو ناجح
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // لو HTML مطلوب وأوفلاين — ارجع الـ app من الكاش
        if (event.request.destination === 'document') {
          return caches.match('./mansek-app.html');
        }
      });
    })
  );
});

// ── Background Sync ───────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(flushOfflineQueue());
  }
});

// ── Offline Queue — IndexedDB ─────────────────────────────────
async function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('mansek-queue', 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('queue', {
        keyPath: 'id',
        autoIncrement: true
      });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function saveToOfflineQueue(request) {
  try {
    const body = await request.text();
    const db   = await openQueueDB();
    const tx   = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').add({
      url:     request.url,
      method:  request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      savedAt: new Date().toISOString()
    });
    // إشعار التطبيق
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'QUEUED', url: request.url }));
  } catch (e) {
    console.warn('SW: فشل حفظ الطلب في Queue', e);
  }
}

async function flushOfflineQueue() {
  try {
    const db      = await openQueueDB();
    const tx      = db.transaction('queue', 'readwrite');
    const store   = tx.objectStore('queue');
    const all     = await new Promise((res, rej) => {
      const r = store.getAll();
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });

    let successCount = 0;
    for (const item of all) {
      try {
        const resp = await fetch(item.url, {
          method:  item.method,
          headers: item.headers,
          body:    item.method !== 'GET' ? item.body : undefined
        });
        if (resp.ok) {
          store.delete(item.id);
          successCount++;
        }
      } catch (e) {
        // لسه أوفلاين — ابقى في الـ queue
      }
    }

    // إشعار التطبيق بعدد المزامَن
    if (successCount > 0) {
      const clients = await self.clients.matchAll();
      clients.forEach(c => c.postMessage({
        type:  'SYNCED',
        count: successCount
      }));
    }
  } catch (e) {
    console.warn('SW: فشل رفع الـ Queue', e);
  }
}

// ── Push Notifications (مستقبلاً) ────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'منسق بلس', {
        body: data.body || '',
        icon: './icon-192.png',
        badge: './icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        data: data
      })
    );
  } catch (e) {}
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length) return clients[0].focus();
      return self.clients.openWindow('./mansek-app.html');
    })
  );
});
