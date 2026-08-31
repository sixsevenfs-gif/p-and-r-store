-- Additive order-operations fields; existing order history remains intact.
ALTER TABLE orders ADD COLUMN confirmed_at INTEGER;
ALTER TABLE orders ADD COLUMN confirmed_by TEXT;
ALTER TABLE orders ADD COLUMN shipped_at INTEGER;
ALTER TABLE orders ADD COLUMN delivered_at INTEGER;
ALTER TABLE orders ADD COLUMN estimated_delivery_at INTEGER;
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
ALTER TABLE orders ADD COLUMN customer_message TEXT;
ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN inventory_restored_at INTEGER;
ALTER TABLE orders ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none';

CREATE TABLE order_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  event_type TEXT NOT NULL,
  public_title TEXT NOT NULL,
  public_description TEXT NOT NULL DEFAULT '',
  internal_description TEXT NOT NULL DEFAULT '',
  actor_email TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX order_timeline_order_idx ON order_timeline(order_id,created_at);

-- Preserve legacy orders while giving customers and operators a safe initial
-- tracking event. This does not alter or remove the older status history.
INSERT INTO order_timeline(order_id,event_type,public_title,public_description,created_at)
SELECT id, 'legacy_backfill',
  CASE status
    WHEN 'delivered' THEN 'Delivered'
    WHEN 'shipped' THEN 'Order shipped'
    WHEN 'cancelled' THEN 'Order cancelled'
    WHEN 'returned' THEN 'Return completed'
    WHEN 'confirmed' THEN 'Order confirmed'
    ELSE 'Order placed'
  END,
  'Order history is available here.', created_at
FROM orders
WHERE NOT EXISTS (SELECT 1 FROM order_timeline t WHERE t.order_id=orders.id);
