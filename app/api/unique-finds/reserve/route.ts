import { env } from "@/db/runtime";
import { requireApiCustomer } from "../../_lib/account";
import { releaseExpiredUniqueReservations, UNIQUE_RESERVATION_SECONDS, uniqueAvailabilityError, uniqueProductForVariant } from "../../_lib/unique-finds";

async function cartFor(customerId: number) {
  await env.DB.prepare("INSERT INTO carts(customer_id) VALUES (?) ON CONFLICT(customer_id) DO NOTHING").bind(customerId).run();
  return env.DB.prepare("SELECT id FROM carts WHERE customer_id=?").bind(customerId).first<{ id: number }>();
}

export async function POST(request: Request) {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required to secure this T-shirt." }, { status: 401 });
  const body = await request.json() as { variantId?: unknown; idempotencyKey?: unknown };
  const variantId = Number(body.variantId);
  const idempotencyKey = String(body.idempotencyKey ?? "").trim().slice(0, 100);
  if (!Number.isInteger(variantId) || variantId < 1 || !idempotencyKey) return Response.json({ error: "A valid T-shirt selection is required." }, { status: 400 });
  await releaseExpiredUniqueReservations();
  const existing = await env.DB.prepare("SELECT * FROM unique_find_reservations WHERE idempotency_key=? AND customer_id=?")
    .bind(idempotencyKey, customer.id).first<Record<string, unknown>>();
  if (existing?.status === "active" && Number(existing.expires_at) > Math.floor(Date.now() / 1000)) return Response.json({ reserved: true, expiresAt: existing.expires_at, idempotent: true });
  const product = await uniqueProductForVariant(variantId);
  const unavailable = uniqueAvailabilityError(product);
  if (unavailable) return Response.json({ error: unavailable }, { status: 409 });
  const cart = await cartFor(customer.id);
  if (!cart || !product) return Response.json({ error: "Unable to prepare your bag." }, { status: 500 });
  const alreadyHeld = await env.DB.prepare("SELECT id,expires_at FROM unique_find_reservations WHERE customer_id=? AND variant_id=? AND status='active' AND expires_at>unixepoch()").bind(customer.id, variantId).first<{ id: number; expires_at: number }>();
  if (alreadyHeld) return Response.json({ reserved: true, expiresAt: alreadyHeld.expires_at, idempotent: true });
  const held = await env.DB.prepare(`UPDATE product_variants SET reserved_stock=reserved_stock+1
    WHERE id=? AND active=1 AND stock-reserved_stock>=1`).bind(variantId).run();
  if (Number(held.meta.changes ?? 0) !== 1) return Response.json({ error: "SOLD OUT" }, { status: 409 });
  const expiresAt = Math.floor(Date.now() / 1000) + UNIQUE_RESERVATION_SECONDS;
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES (?,?,1) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=1").bind(cart.id, variantId),
      env.DB.prepare("INSERT INTO unique_find_reservations(customer_id,cart_id,product_id,variant_id,quantity,status,expires_at,idempotency_key) VALUES(?,?,?,?,1,'active',?,?)").bind(customer.id, cart.id, product.product_id, variantId, expiresAt, idempotencyKey),
      env.DB.prepare("UPDATE carts SET updated_at=unixepoch() WHERE id=?").bind(cart.id),
    ]);
  } catch (error) {
    await env.DB.prepare("UPDATE product_variants SET reserved_stock=greatest(0,reserved_stock-1) WHERE id=?").bind(variantId).run();
    throw error;
  }
  return Response.json({ reserved: true, expiresAt }, { status: 201 });
}
