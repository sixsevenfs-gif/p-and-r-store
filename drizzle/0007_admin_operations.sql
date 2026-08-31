-- Operational fields used by the admin product, coupon, media and content controls.
-- This migration only extends existing records; it does not reset or seed data.
ALTER TABLE products ADD COLUMN audience TEXT NOT NULL DEFAULT 'unisex';
ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'apparel';
ALTER TABLE products ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN cost_price INTEGER;
ALTER TABLE products ADD COLUMN tax_status TEXT NOT NULL DEFAULT 'taxable';

ALTER TABLE collections ADD COLUMN audience TEXT NOT NULL DEFAULT 'unisex';
ALTER TABLE collections ADD COLUMN featured INTEGER NOT NULL DEFAULT false;

ALTER TABLE coupons ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE coupons ADD COLUMN first_order_only INTEGER NOT NULL DEFAULT false;
ALTER TABLE coupons ADD COLUMN payment_methods TEXT NOT NULL DEFAULT '[]';

ALTER TABLE orders ADD COLUMN courier TEXT;

CREATE TABLE media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX media_assets_created_idx ON media_assets(created_at DESC);

CREATE TABLE customer_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX customer_notes_customer_idx ON customer_notes(customer_id,created_at DESC);
