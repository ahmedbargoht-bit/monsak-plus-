-- ╔══════════════════════════════════════════════════════════════╗
-- ║   MANSEK PLUS — Supabase Schema                             ║
-- ║   الطحان للتمور | منسق بلس                                  ║
-- ║   انسخ كل الكود ده في Supabase SQL Editor واضغط Run        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── حضور ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  route       TEXT,
  grp         TEXT,
  date        TEXT,
  time_in     TEXT,
  time_out    TEXT,
  lat_in      TEXT,
  lng_in      TEXT,
  lat_out     TEXT,
  lng_out     TEXT,
  hours       NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── زيارات ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  grp           TEXT,
  route         TEXT,
  branch        TEXT,
  date          TEXT,
  time_in       TEXT,
  time_out      TEXT,
  lat           TEXT,
  lng           TEXT,
  client_type   TEXT,
  display_type  TEXT,
  shelf_total   NUMERIC DEFAULT 0,
  shelf_taken   NUMERIC DEFAULT 0,
  space_total   NUMERIC DEFAULT 0,
  space_used    NUMERIC DEFAULT 0,
  sku_on        NUMERIC DEFAULT 0,
  sku_stock     NUMERIC DEFAULT 0,
  missing_count NUMERIC DEFAULT 0,
  points        NUMERIC DEFAULT 0,
  coord_type    TEXT DEFAULT 'متحرك',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── أصناف ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  route         TEXT,
  branch        TEXT,
  fea           TEXT,
  cat           TEXT,
  grp           TEXT,
  snf           TEXT,
  shelf_qty     NUMERIC DEFAULT 0,
  stock_qty     NUMERIC DEFAULT 0,
  date_shelf    TEXT,
  months_shelf  TEXT,
  date_stock    TEXT,
  months_stock  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── نواقص ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missing (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  route       TEXT,
  branch      TEXT,
  fea         TEXT,
  grp         TEXT,
  snf         TEXT,
  reason      TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── طلبيات ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            BIGSERIAL PRIMARY KEY,
  from_name     TEXT,
  to_name       TEXT,
  to_route      TEXT,
  branch        TEXT,
  arrival_date  TEXT,
  note          TEXT,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── رسائل ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          BIGSERIAL PRIMARY KEY,
  from_name   TEXT,
  type        TEXT DEFAULT 'general',
  to_all      BOOLEAN DEFAULT FALSE,
  to_group    TEXT,
  to_rep      TEXT,
  message     TEXT,
  read_by     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── لوكيشن ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  route       TEXT,
  grp         TEXT,
  lat         TEXT,
  lng         TEXT,
  active      BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── عملاء (فروع) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id            BIGSERIAL PRIMARY KEY,
  branch_name   TEXT NOT NULL,
  route         TEXT,
  grp           TEXT,
  client_type   TEXT DEFAULT 'B',
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── إجازات ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holidays (
  id          BIGSERIAL PRIMARY KEY,
  date        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'رسمية',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security — اجعل الجداول عامة للقراءة والكتابة
-- ══════════════════════════════════════════════════════════════
ALTER TABLE attendance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE location    ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays    ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة والكتابة (anon key)
CREATE POLICY "public_all" ON attendance  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON visits      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON products    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON missing     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON orders      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON messages    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON location    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON branches    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON holidays    FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- بيانات تجريبية — إجازات رسمية
-- ══════════════════════════════════════════════════════════════
INSERT INTO holidays (date, name, type) VALUES
  ('2026-05-28', 'عيد الأضحى', 'دينية'),
  ('2026-05-29', 'عيد الأضحى (2)', 'دينية'),
  ('2026-05-30', 'عيد الأضحى (3)', 'دينية'),
  ('2026-07-23', 'ثورة 23 يوليو', 'رسمية'),
  ('2026-10-06', 'ذكرى حرب أكتوبر', 'رسمية')
ON CONFLICT (date) DO NOTHING;

-- ✅ تم إنشاء كل الجداول بنجاح
