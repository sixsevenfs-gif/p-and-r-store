-- Runtime commerce foundation. Amounts are stored in paise.
ALTER TABLE products ADD COLUMN short_description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN new_arrival INTEGER NOT NULL DEFAULT false;
ALTER TABLE product_variants ADD COLUMN reserved_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN price INTEGER;
ALTER TABLE product_variants ADD COLUMN active INTEGER NOT NULL DEFAULT true;
ALTER TABLE order_items ADD COLUMN color TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN variant_id INTEGER REFERENCES product_variants(id);
ALTER TABLE orders ADD COLUMN shipping_address TEXT NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN coupon_code TEXT;

CREATE TABLE carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL UNIQUE REFERENCES customers(id),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(cart_id, variant_id)
);
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value INTEGER NOT NULL,
  minimum_order INTEGER NOT NULL DEFAULT 0,
  maximum_discount INTEGER,
  starts_at INTEGER,
  ends_at INTEGER,
  usage_limit INTEGER,
  per_customer_limit INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
);
CREATE TABLE coupon_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  discount_amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  actor_email TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX carts_customer_idx ON carts(customer_id);
CREATE INDEX cart_items_cart_idx ON cart_items(cart_id);
CREATE INDEX payments_order_idx ON payments(order_id);
CREATE INDEX coupon_usage_customer_idx ON coupon_usages(coupon_id, customer_id);
CREATE INDEX order_history_order_idx ON order_status_history(order_id, created_at);
CREATE INDEX reviews_product_idx ON reviews(product_id, status);
CREATE INDEX products_catalog_idx ON products(status, category);
