import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

type Row = Record<string, unknown>;
const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);
const fulfillmentLabels: Record<string, string> = {
  pending: "Order placed", confirmed: "Order confirmed", processing: "Order is being prepared", packed: "Order packed",
  ready_to_ship: "Ready to ship", shipped: "Order shipped", out_for_delivery: "Out for delivery", delivered: "Delivered",
  cancelled: "Order cancelled", return_requested: "Return requested", returned: "Return completed", refunded: "Refund completed",
};
const nextStatuses: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"], awaiting_payment: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"], packed: ["ready_to_ship"], ready_to_ship: ["shipped"], shipped: ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered", "returned"], delivered: ["return_requested"], return_requested: ["returned", "refunded"], returned: ["refunded"],
};
const paymentStatuses = new Set(["pending", "paid", "failed", "cod_due", "refund_pending", "partially_refunded", "refunded"]);

async function audit(email: string, action: string, orderId: number, detail: unknown) {
  await env.DB.prepare("INSERT INTO audit_logs(admin_email,action,resource,resource_id,detail) VALUES (?,?,?,?,?)")
    .bind(email, action, "orders", String(orderId), JSON.stringify(detail)).run();
}

function address(value: unknown) {
  try { return JSON.parse(String(value || "{}")) as Record<string, string>; } catch { return {}; }
}

async function detailFor(orderId: number, request: Request) {
  const order = await env.DB.prepare(`SELECT o.*,c.first_name,c.last_name,c.email,c.phone,c.address customer_address,c.city customer_city,c.pin_code customer_pin_code
    FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.id=?`).bind(orderId).first<Row>();
  if (!order) return null;
  const [items, timeline, notes, payments] = await Promise.all([
    env.DB.prepare(`SELECT i.*,v.sku variant_sku,p.sku product_sku,(SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order,id LIMIT 1) image_url
      FROM order_items i LEFT JOIN product_variants v ON v.id=i.variant_id LEFT JOIN products p ON p.slug=i.product_slug WHERE i.order_id=? ORDER BY i.id`).bind(orderId).all<Row>(),
    env.DB.prepare("SELECT id,event_type,public_title,public_description,internal_description,actor_email,created_at FROM order_timeline WHERE order_id=? ORDER BY created_at,id").bind(orderId).all<Row>(),
    env.DB.prepare("SELECT id,note,admin_email,created_at FROM order_notes WHERE order_id=? ORDER BY created_at,id DESC").bind(orderId).all<Row>(),
    env.DB.prepare("SELECT id,provider,gateway_order_id,gateway_payment_id,amount,currency,status,failure_reason,created_at,updated_at FROM payments WHERE order_id=? ORDER BY id DESC").bind(orderId).all<Row>(),
  ]);
  const origin = new URL(request.url).origin;
  return { ...order, shipping_address: address(order.shipping_address), items: items.results.map((item) => ({ ...item, image_url: item.image_url ? (String(item.image_url).startsWith("http") ? item.image_url : `${origin}${item.image_url}`) : null })), timeline: timeline.results, notes: notes.results, payments: payments.results };
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const url = new URL(request.url), id = Number(url.searchParams.get("id"));
  if (Number.isInteger(id) && id > 0) {
    const data = await detailFor(id, request);
    return data ? Response.json({ order: data }) : Response.json({ error: "Order not found." }, { status: 404 });
  }
  const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 30)));
  const q = clean(url.searchParams.get("q"), 100), status = clean(url.searchParams.get("status"), 40), payment = clean(url.searchParams.get("payment"), 40);
  const conditions: string[] = [], params: unknown[] = [];
  if (q) { conditions.push("(CAST(o.id AS TEXT) LIKE ? OR lower(c.email) LIKE ? OR lower(c.first_name || ' ' || c.last_name) LIKE ? OR lower(o.tracking_id) LIKE ?)"); params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`); }
  if (status) { conditions.push("o.status=?"); params.push(status); }
  if (payment) { conditions.push("o.payment_status=?"); params.push(payment); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows, count] = await Promise.all([
    env.DB.prepare(`SELECT o.id,o.status,o.shipping_status,o.payment_status,o.payment_method,o.total_amount,o.payable_amount,o.tracking_id,o.courier,o.created_at,c.first_name,c.last_name,c.email,c.phone,
      count(i.id) item_count,sum(i.quantity) unit_count FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN order_items i ON i.order_id=o.id ${where}
      GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).bind(...params, limit, (page - 1) * limit).all<Row>(),
    env.DB.prepare(`SELECT count(*) count FROM orders o JOIN customers c ON c.id=o.customer_id ${where}`).bind(...params).first<{ count: number }>(),
  ]);
  return Response.json({ data: rows.results, page, limit, total: Number(count?.count || 0) });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const orderId = Number(body.id);
  if (!Number.isInteger(orderId) || orderId < 1) return Response.json({ error: "A valid order is required." }, { status: 400 });
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(orderId).first<Row>();
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  const action = clean(body.action, 40);
  const note = clean(body.internalNote, 1000), customerMessage = clean(body.customerMessage, 1000);
  const writes: D1PreparedStatement[] = [];
  const appendEvent = (type: string, publicTitle: string, publicDescription = "", internalDescription = "") => {
    writes.push(env.DB.prepare("INSERT INTO order_timeline(order_id,event_type,public_title,public_description,internal_description,actor_email) VALUES (?,?,?,?,?,?)")
      .bind(orderId, type, publicTitle, publicDescription, internalDescription, admin.email));
  };
  if (note) writes.push(env.DB.prepare("INSERT INTO order_notes(order_id,note,admin_email) VALUES (?,?,?)").bind(orderId, note, admin.email));
  if (customerMessage) appendEvent("customer_update", "Update from P&R", customerMessage, note);

  if (action === "status") {
    const next = clean(body.status, 40).toLowerCase(), current = clean(order.status, 40).toLowerCase();
    if (!nextStatuses[current]?.includes(next)) return Response.json({ error: `Cannot move an order from ${current || "its current status"} to ${next || "that status"}.` }, { status: 409 });
    const courier = clean(body.courier || order.courier, 100), trackingId = clean(body.trackingId || order.tracking_id, 120);
    if (next === "shipped" && courier.toLowerCase() !== "local delivery" && courier.toLowerCase() !== "local" && !trackingId) return Response.json({ error: "A courier and tracking/AWB number are required before shipping." }, { status: 400 });
    const shipping = next === "confirmed" ? "processing" : next === "processing" ? "processing" : next === "packed" ? "packed" : next === "ready_to_ship" ? "ready_to_ship" : next === "shipped" ? "shipped" : next === "out_for_delivery" ? "out_for_delivery" : next === "delivered" ? "delivered" : next === "cancelled" ? "cancelled" : next === "returned" ? "returned" : String(order.shipping_status || "unfulfilled");
    const reason = clean(body.reason, 600);
    if (next === "cancelled" && !reason) return Response.json({ error: "A cancellation reason is required." }, { status: 400 });
    const updates = ["status=?", "shipping_status=?", "courier=?", "tracking_id=?", "tracking_url=?", "estimated_delivery_at=?"];
    const values: unknown[] = [next, shipping, courier || null, trackingId || null, clean(body.trackingUrl || order.tracking_url, 500) || null, body.estimatedDeliveryAt ? Math.floor(new Date(String(body.estimatedDeliveryAt)).getTime() / 1000) : order.estimated_delivery_at || null];
    if (next === "confirmed") { updates.push("confirmed_at=unixepoch()", "confirmed_by=?"); values.push(admin.email); }
    if (next === "shipped") updates.push("shipped_at=unixepoch()");
    if (next === "delivered") updates.push("delivered_at=unixepoch()");
    if (next === "cancelled") { updates.push("cancelled_at=unixepoch()", "cancellation_reason=?"); values.push(reason); }
    if (next === "refunded") updates.push("refunded_at=unixepoch()", "refund_status='refunded'", "payment_status='refunded'");
    writes.push(env.DB.prepare(`UPDATE orders SET ${updates.join(",")} WHERE id=?`).bind(...values, orderId));
    writes.push(env.DB.prepare("INSERT INTO order_status_history(order_id,status,note,actor_email) VALUES (?,?,?,?)").bind(orderId, next.toUpperCase(), reason || note || "Updated by admin", admin.email));
    appendEvent("fulfillment", fulfillmentLabels[next] || next, customerMessage || (next === "shipped" && trackingId ? `Tracking number: ${trackingId}` : ""), reason || note);
    if (next === "cancelled" && !order.inventory_restored_at) {
      const lines = await env.DB.prepare("SELECT variant_id,quantity FROM order_items WHERE order_id=? AND variant_id IS NOT NULL").bind(orderId).all<{ variant_id: number; quantity: number }>();
      for (const line of lines.results) {
        writes.push(env.DB.prepare("UPDATE product_variants SET stock=stock+? WHERE id=?").bind(line.quantity, line.variant_id));
        writes.push(env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES (?,?,?,?)").bind(line.variant_id, line.quantity, `Order #${orderId} cancellation restoration`, admin.email));
      }
      writes.push(env.DB.prepare("UPDATE orders SET inventory_restored_at=unixepoch() WHERE id=? AND inventory_restored_at IS NULL").bind(orderId));
    }
    await env.DB.batch(writes); await audit(admin.email, "order_status", orderId, { from: current, to: next, stockRestored: next === "cancelled" && !order.inventory_restored_at });
  } else if (action === "payment") {
    const status = clean(body.paymentStatus, 40).toLowerCase();
    if (!paymentStatuses.has(status)) return Response.json({ error: "Invalid payment status." }, { status: 400 });
    writes.push(env.DB.prepare("UPDATE orders SET payment_status=?,refund_status=? WHERE id=?").bind(status, status.includes("refund") ? status : order.refund_status || "none", orderId));
    writes.push(env.DB.prepare("UPDATE payments SET status=?,updated_at=unixepoch() WHERE id=(SELECT id FROM payments WHERE order_id=? ORDER BY id DESC LIMIT 1)").bind(status, orderId));
    appendEvent("payment", status === "paid" ? "Payment received" : titleFor(status), customerMessage, note);
    await env.DB.batch(writes); await audit(admin.email, "order_payment_status", orderId, { status });
  } else if (action === "tracking") {
    const courier = clean(body.courier, 100), trackingId = clean(body.trackingId, 120);
    if (!courier) return Response.json({ error: "Courier is required." }, { status: 400 });
    if (courier.toLowerCase() !== "local delivery" && courier.toLowerCase() !== "local" && !trackingId) return Response.json({ error: "Tracking/AWB is required for courier shipping." }, { status: 400 });
    const estimate = body.estimatedDeliveryAt ? Math.floor(new Date(String(body.estimatedDeliveryAt)).getTime() / 1000) : null;
    if (body.estimatedDeliveryAt && !Number.isFinite(estimate)) return Response.json({ error: "Estimated delivery date is invalid." }, { status: 400 });
    writes.push(env.DB.prepare("UPDATE orders SET courier=?,tracking_id=?,tracking_url=?,estimated_delivery_at=? WHERE id=?").bind(courier, trackingId || null, clean(body.trackingUrl, 500) || null, estimate, orderId));
    appendEvent("tracking", "Delivery tracking updated", customerMessage || (trackingId ? `Tracking number: ${trackingId}` : "Local delivery arranged"), note);
    await env.DB.batch(writes); await audit(admin.email, "order_tracking", orderId, { courier, trackingId });
  } else if (action === "note") {
    if (!note && !customerMessage) return Response.json({ error: "Enter an internal note or customer update." }, { status: 400 });
    await env.DB.batch(writes); await audit(admin.email, "order_note", orderId, { hasInternalNote: Boolean(note), hasCustomerMessage: Boolean(customerMessage) });
  } else return Response.json({ error: "Unknown order action." }, { status: 400 });
  return Response.json({ updated: true, order: await detailFor(orderId, request) });
}

function titleFor(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
