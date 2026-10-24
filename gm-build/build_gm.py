# بناء gm-app.html من mansek-admin.html — نسخة طبق الأصل + دخول المدير العام + شكل موبايل
# الاستخدام: python3 build_gm.py <mansek-admin.html> <الناتج gm-app.html>
# محتاج جنبه: gm_mobile.html و gm_sw.js
import io, re, sys
src, out = sys.argv[1], sys.argv[2]
GM_PASS_DEFAULT = 'gm2026'  # باسورد المدير الافتراضي (لو مفيش باسورد محفوظ في Supabase)
s = io.open(src, encoding='utf-8').read()
import os
here = os.path.dirname(os.path.abspath(__file__))
layer = io.open(os.path.join(here, 'gm_mobile.html'), encoding='utf-8').read()

def rep(a, b, n=None):
    global s
    c = s.count(a)
    assert c > 0 and (n is None or c == n), (a[:70], c)
    s = s.replace(a, b)
    return c

# 1) الهيدر: اسم وأيقونة ومانيفست تطبيق المدير العام
rep('<meta name="theme-color" content="#4B3C1A"/>', '<meta name="theme-color" content="#3D2E0F"/>', 1)
rep('<meta name="apple-mobile-web-app-title" content="لوحة التحكم"/>', '<meta name="apple-mobile-web-app-title" content="مدير عام"/>', 1)
rep('<link rel="manifest" href="manifest.json"/>', '<link rel="manifest" href="manifest-gm.json"/>\n<link rel="icon" type="image/png" sizes="192x192" href="icon-gm-192.png"/>\n<link rel="icon" type="image/png" sizes="512x512" href="icon-gm-512.png"/>', 1)
rep('<link rel="apple-touch-icon" href="icon-192.png"/>', '<link rel="apple-touch-icon" href="icon-gm-192.png"/>', 1)
rep('<title>MT Admin</title>', '<title>المدير العام</title>', 1)
s = s.replace('<meta charset="UTF-8"/>', '<meta charset="UTF-8"/>\n<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>\n<meta http-equiv="Pragma" content="no-cache"/>\n<meta http-equiv="Expires" content="0"/>', 1)
s = s.replace('<!--\n', '<!-- gm-app — تطبيق المدير العام: نسخة من لوحة التحكم (مبنية تلقائياً من mansek-admin.html — ماتعدلش هنا، عدّل اللوحة وابني تاني)\n', 1)

# 2) الباسورد: كل أماكن التحقق/التغيير تستخدم حساب المدير العام (gm_admin / gm) بدل الأدمن
counts = {}
counts['obj'] = rep("{name:'admin',role:'admin'}", "{name:'gm_admin',role:'gm'}")
counts['url'] = rep("name=eq.admin&role=eq.admin", "name=eq.gm_admin&role=eq.gm")
counts['ins'] = rep("sbInsert('users',{name:'admin', role:'admin', pass_hash: newPass, level:'gm'})", "sbInsert('users',{name:'gm_admin', role:'gm', pass_hash: newPass, level:'gm'})", 1)
counts['ls'] = rep("'admin_pass_override'", "'gm_pass_override'")
rep("const ADMIN_PASS = 'admin2026';", "const ADMIN_PASS = '%s';" % GM_PASS_DEFAULT, 1)
left = [x for x in ("role:'admin'", "role=eq.admin", "admin_pass_override") if x in s]
assert not left, left

# 3) شاشة الدخول
rep('<input type="text" id="l-user" placeholder="admin" value="admin" readonly', '<input type="text" id="l-user" placeholder="المدير العام" value="المدير العام" readonly', 1)
rep('<i class="ti ti-login"></i> دخول إلى لوحة التحكم', '<i class="ti ti-login"></i> دخول — المدير العام', 1)

# 4) Service Worker بتاع تطبيق المدير العام (عشان التثبيت كأيقونة على الموبايل)
sw = io.open(os.path.join(here, 'gm_sw.js'), encoding='utf-8').read()
# 5) طبقة الموبايل + SW قبل </body> الأخيرة
k = s.rindex('</body>')
s = s[:k] + layer + '\n<script>\n' + sw + '\n</script>\n' + s[k:]
io.open(out, 'w', encoding='utf-8').write(s)
print('ok', counts)
