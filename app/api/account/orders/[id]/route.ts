import { env } from "cloudflare:workers";
import { requireApiCustomer } from "../../../_lib/account";

type Row = Record<string, unknown>;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid order." }, { status: 400 });
  const order = await env.DB.prepare(`SELECT id,status,shipping_status,payment_status,payment_method,total_amount,payable_amount,subtotal_amount,discount_amount,shipping_amount,
    tracking_id,courier,tracking_url,estimated_delivery_at,customer_message,created_at,confirmed_at,shipped_at,delivered_at,cancelled_at,refunded_at,shipping_address
    FROM orders WHERE id=? AND customer_id=?`).bind(id, customer.id).first<Row>();
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  const [items, timeline] = await Promise.all([
    env.DB.prepare(`SELECT i.product_slug,i.product_name,i.unit_price,i.quantity,i.size,i.color,i.variant_id,
      (SELECT url FROM product_images pi JOIN products p ON p.id=pi.product_id WHERE p.slug=i.product_slug ORDER BY pi.sort_order,pi.id LIMIT 1) image_url
      FROM order_items i WHERE i.order_id=? ORDER BY i.id`).bind(id).all<Row>(),
    env.DB.prepare("SELECT id,event_type,public_title,public_description,created_at FROM order_timeline WHERE order_id=? ORDER BY created_at,id").bind(id).all<Row>(),
  ]);
  let shippingAddress: unknown = {};
  try { shippingAddress = JSON.parse(String(order.shipping_address || "{}")); } catch { /* legacy address remains private but safely blank on parse failure */ }
  const origin = new URL(request.url).origin;
  return Response.json({ order: { ...order, shipping_address: shippingAddress, items: items.results.map((item) => ({ ...item, image_url: item.image_url ? (String(item.image_url).startsWith("http") ? item.image_url : `${origin}${item.image_url}`) : null })), timeline: timeline.results } });
}

/** Customers may cancel only before fulfilment reaches Packed. Inventory is
 * claimed for restoration atomically, so repeat requests cannot add it twice. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const id = Number((await context.params).id);
  const body = await request.json() as { action?: string; reason?: string };
  if (!Number.isInteger(id) || body.action !== "cancel") return Response.json({ error: "Invalid order request." }, { status: 400 });
  const reason = String(body.reason || "Customer requested cancellation.").trim().slice(0, 600);
  const claim = await env.DB.prepare(`UPDATE orders SET status='cancelled',shipping_status='cancelled',cancelled_at=unixepoch(),cancellation_reason=?,inventory_restored_at=unixepoch()
    WHERE id=? AND customer_id=? AND inventory_restored_at IS NULL AND status IN ('pending','awaiting_payment','confirmed','processing')`).bind(reason, id, customer.id).run();
  if (Number(claim.meta.changes || 0) !== 1) return Response.json({ error: "This order can no longer be cancelled online." }, { status: 409 });
  const items = await env.DB.prepare("SELECT variant_id,quantity FROM order_items WHERE order_id=? AND variant_id IS NOT NULL").bind(id).all<{ variant_id: number; quantity: number }>();
  await env.DB.batch([
    ...items.results.flatMap((item) => [
      env.DB.prepare("UPDATE product_variants SET stock=stock+? WHERE id=?").bind(item.quantity, item.variant_id),
      env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES (?,?,?,?)").bind(item.variant_id, item.quantity, `Order #${id} customer cancellation restoration`, `customer:${customer.email}`),
    ]),
    env.DB.prepare("INSERT INTO order_status_history(order_id,status,note,actor_email) VALUES (?,?,?,?)").bind(id, "CANCELLED", reason, customer.email),
    env.DB.prepare("INSERT INTO order_timeline(order_id,event_type,public_title,public_description,actor_email) VALUES (?,?,?,?,?)").bind(id, "cancellation", "Order cancelled", reason, customer.email),
    env.DB.prepare("INSERT INTO audit_logs(admin_email,action,resource,resource_id,detail) VALUES (?,?,?,?,?)").bind(`customer:${customer.email}`, "customer_order_cancellation", "orders", String(id), JSON.stringify({ reason })),
  ]);
  return Response.json({ cancelled: true });
}
