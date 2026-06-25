// mansek-admin Service Worker v1.0
const CACHE_NAME = 'mansek-admin-v1';
const STATIC_ASSETS = [
  '/monsak-plus-/mansek-admin.html',
];

// عند التثبيت — كاش الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// عند التفعيل — امسح الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// عند الطلب — Network First (عشان البيانات دايماً تكون محدثة)
self.addEventListener('fetch', e => {
  // تجاهل طلبات Supabase — دايماً من الشبكة
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // لو نجح — خزّنه في الكاش
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // لو فشل الشبكة — رجّع من الكاش
        return caches.match(e.request);
      })
  );
});
