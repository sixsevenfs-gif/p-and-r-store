import { env } from "@/db/runtime";
import { requireApiCustomer } from "../_lib/account";
import { ensureCatalog } from "../_lib/catalog";
import { releaseExpiredUniqueReservations } from "../_lib/unique-finds";

async function cartFor(customerId: number) {
  await env.DB.prepare("INSERT INTO carts(customer_id) VALUES (?) ON CONFLICT(customer_id) DO NOTHING").bind(customerId).run();
  return env.DB.prepare("SELECT id FROM carts WHERE customer_id=?").bind(customerId).first<{ id:number }>();
}

export async function GET() {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  await releaseExpiredUniqueReservations();
  const cart = await cartFor(customer.id);
  const items = await env.DB.prepare(`SELECT ci.id,ci.quantity,v.id AS variant_id,v.size,v.color,v.sku,v.stock,v.reserved_stock,
    p.id AS product_id,p.slug,p.name,p.price,p.edition_number,p.is_unique_find,p.lifetime_production_cap,p.unique_find_status,coalesce(v.price,p.price) AS unit_price,
    (SELECT expires_at FROM unique_find_reservations r WHERE r.cart_id=ci.cart_id AND r.variant_id=ci.variant_id AND r.status='active' AND r.expires_at>unixepoch() ORDER BY r.id DESC LIMIT 1) reservation_expires_at,
    (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image_url
    FROM cart_items ci JOIN product_variants v ON v.id=ci.variant_id JOIN products p ON p.id=v.product_id
    WHERE ci.cart_id=? AND p.status='published' AND v.active=1 ORDER BY ci.created_at DESC`).bind(cart?.id ?? -1).all();
  return Response.json({ items: items.results });
}

export async function POST(request: Request) {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json() as { variantId?: number; quantity?: number };
  const variantId = Number(body.variantId), quantity = Number(body.quantity ?? 1);
  if (!Number.isInteger(variantId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return Response.json({ error: "Invalid bag item." }, { status: 400 });
  await ensureCatalog();
  const variant = await env.DB.prepare("SELECT v.stock,v.reserved_stock,p.is_unique_find,p.unique_find_status FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=? AND v.active=1 AND p.status='published'").bind(variantId).first<{ stock:number; reserved_stock:number; is_unique_find:number; unique_find_status:string }>();
  if (variant?.is_unique_find) return Response.json({ error: "Secure this T-shirt from Unique Finds." }, { status: 409 });
  if (!variant || variant.stock - variant.reserved_stock < quantity) return Response.json({ error: "This size is out of stock." }, { status: 409 });
  const cart = await cartFor(customer.id);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES (?,?,?)
      ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=min(10,cart_items.quantity+excluded.quantity)`).bind(cart!.id, variantId, quantity),
    env.DB.prepare("UPDATE carts SET updated_at=unixepoch() WHERE id=?").bind(cart!.id),
  ]);
  return Response.json({ added: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json() as { variantId?: number; quantity?: number };
  const variantId = Number(body.variantId), quantity = Number(body.quantity);
  if (!Number.isInteger(variantId) || !Number.isInteger(quantity) || quantity < 0 || quantity > 10) return Response.json({ error: "Invalid quantity." }, { status: 400 });
  const cart = await cartFor(customer.id);
  if (quantity === 0) {
    const reservation = await env.DB.prepare("SELECT id,quantity FROM unique_find_reservations WHERE cart_id=? AND variant_id=? AND status='active'").bind(cart!.id, variantId).first<{ id:number; quantity:number }>();
    await env.DB.batch([env.DB.prepare("DELETE FROM cart_items WHERE cart_id=? AND variant_id=?").bind(cart!.id, variantId), ...(reservation ? [env.DB.prepare("UPDATE unique_find_reservations SET status='released',updated_at=unixepoch() WHERE id=?").bind(reservation.id), env.DB.prepare("UPDATE product_variants SET reserved_stock=greatest(0,reserved_stock-?) WHERE id=?").bind(reservation.quantity, variantId)] : [])]);
  }
  else {
    const variant = await env.DB.prepare("SELECT stock-reserved_stock AS available,p.is_unique_find FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=? AND v.active=1").bind(variantId).first<{ available:number;is_unique_find:number }>();
    if (variant?.is_unique_find && quantity !== 1) return Response.json({ error: "Unique Finds are limited to one secured T-shirt." }, { status: 409 });
    if (!variant || variant.available < quantity) return Response.json({ error: "The requested quantity is unavailable." }, { status: 409 });
    await env.DB.prepare("UPDATE cart_items SET quantity=? WHERE cart_id=? AND variant_id=?").bind(quantity, cart!.id, variantId).run();
  }
  return Response.json({ updated: true });
}

export async function DELETE(request: Request) {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const variantId = Number(new URL(request.url).searchParams.get("variantId"));
  if (!Number.isInteger(variantId)) return Response.json({ error: "Invalid bag item." }, { status: 400 });
  const cart = await cartFor(customer.id);
  const reservation = await env.DB.prepare("SELECT id,quantity FROM unique_find_reservations WHERE cart_id=? AND variant_id=? AND status='active'").bind(cart!.id, variantId).first<{ id:number; quantity:number }>();
  await env.DB.batch([env.DB.prepare("DELETE FROM cart_items WHERE cart_id=? AND variant_id=?").bind(cart!.id, variantId), ...(reservation ? [env.DB.prepare("UPDATE unique_find_reservations SET status='released',updated_at=unixepoch() WHERE id=?").bind(reservation.id), env.DB.prepare("UPDATE product_variants SET reserved_stock=greatest(0,reserved_stock-?) WHERE id=?").bind(reservation.quantity, variantId)] : [])]);
  return Response.json({ deleted: true });
}
