CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sku TEXT NOT NULL UNIQUE,
  collection_ids TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  UNIQUE(product_id, size, color)
);
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  image_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  reason TEXT NOT NULL,
  image_urls TEXT NOT NULL DEFAULT '[]',
  decision_status TEXT NOT NULL DEFAULT 'requested',
  pickup_status TEXT NOT NULL DEFAULT 'pending',
  refund_status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS discounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  starts_at INTEGER,
  ends_at INTEGER,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  minimum_order INTEGER NOT NULL DEFAULT 0,
  target_type TEXT NOT NULL DEFAULT 'all',
  target_ids TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_reference TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  processed_at INTEGER
);
CREATE TABLE IF NOT EXISTS content_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT NOT NULL UNIQUE,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS order_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS admin_roles (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'viewer',
  permissions TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS variants_product_idx ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS inventory_movements_variant_idx ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS returns_status_idx ON returns(decision_status);
CREATE INDEX IF NOT EXISTS discounts_code_idx ON discounts(code);
CREATE INDEX IF NOT EXISTS audit_resource_idx ON audit_logs(resource, created_at);
ALTER TABLE orders ADD COLUMN shipping_status TEXT NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE orders ADD COLUMN tracking_id TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN internal_status TEXT NOT NULL DEFAULT 'open';
