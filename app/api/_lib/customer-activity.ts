import { env } from "@/db/runtime";

type ActivityItem = { name: string; slug: string; size: string; color: string; quantity: number; unitPrice: number };

export async function recordCartActivity(customerId: number, cartId: number, eventType: "bag_updated" | "checkout_started") {
  const items = await env.DB.prepare(`SELECT p.name,p.slug,v.size,v.color,ci.quantity,coalesce(v.price,p.price) unit_price
    FROM cart_items ci JOIN product_variants v ON v.id=ci.variant_id JOIN products p ON p.id=v.product_id
    WHERE ci.cart_id=? ORDER BY ci.created_at DESC`).bind(cartId).all<ActivityItem>();
  const details = JSON.stringify({
    items: items.results.map((item) => ({ name: item.name, slug: item.slug, size: item.size, color: item.color, quantity: Number(item.quantity), unitPrice: Number(item.unit_price) })),
    total: items.results.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0),
  });
  await env.DB.prepare("INSERT INTO customer_activity_events(customer_id,cart_id,event_type,details) VALUES (?,?,?,?::jsonb)")
    .bind(customerId, cartId, eventType, details).run();
}

export async function recordOrderActivity(customerId: number, orderId: number) {
  const items = await env.DB.prepare("SELECT product_name name,product_slug slug,size,color,quantity,unit_price FROM order_items WHERE order_id=? ORDER BY id")
    .bind(orderId).all<ActivityItem>();
  const total = items.results.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  await env.DB.prepare("INSERT INTO customer_activity_events(customer_id,event_type,details) VALUES (?, 'order_placed', ?::jsonb)")
    .bind(customerId, JSON.stringify({ orderId, items: items.results, total })).run();
}
