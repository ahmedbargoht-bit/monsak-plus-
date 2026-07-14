// المدير العام (gm-app) — Service Worker
// v1 — 2026-07-13: الملف ده كان ناقص تماماً من الأول (التطبيق مالوش أي service worker رغم وجود
// manifest-gm.json وأيقونة مضبوطة) — وده سبب رئيسي إن أيقونة GM مش بتظهر لما يتثبت التطبيق على
// الموبايل: من غير SW شغال بيقدم الأصول، المتصفح مش بيعتبر التطبيق "قابل للتثبيت" (installable)
// بشكل كامل فبيرجع لأيقونة افتراضية/سكرين شوت بدل أيقونة الطحان.

const CACHE_VERSION = 'gm-v1-2026-07-13';
const ASSETS = [
  './gm-app.html',
  './icon-gm-192.png',
  './icon-gm-512.png',
  './manifest-gm.json'
];

// ── التثبيت: كاش أساسي بس + تفعيل فوري بدون انتظار إغلاق كل التابات ──
// ملحوظة: بنكاش كل أصل لوحده مع catch بدل addAll الجماعي، عشان لو ملف واحد ناقص
// أو 404 (زي نسيان رفعه) التثبيت كله ميفشلش ويسبب حلقة تحميل/تحديث متكررة على الصفحة.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c =>
      Promise.all(ASSETS.map(url => c.add(url).catch(err => console.warn('SW: تعذر كاش', url, err))))
    )
  );
  self.skipWaiting();
});

// ── التفعيل: امسح أي كاش قديم من نسخ سابقة + خد التحكم فوراً في كل الصفحات المفتوحة ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── الجلب: Network-first دايماً — لو النت شغال ياخد آخر نسخة، ولو النت واقع يرجع للكاش كحل أخير ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('googleapis.com')) return;
  if (e.request.url.includes('cdnjs.cloudflare.com')) return;
  if (e.request.url.includes('jsdelivr.net')) return;

  e.respondWith(
    fetch(e.request, {cache: 'no-store'})
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── استقبال أمر تخطي الانتظار (لو الصفحة طلبت تحديث فوري) ──
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
