import { env } from "@/db/runtime";

export const UNIQUE_RESERVATION_SECONDS = 10 * 60;

export async function releaseExpiredUniqueReservations() {
  const expired = await env.DB.prepare(`SELECT id,variant_id,quantity FROM unique_find_reservations
    WHERE status='active' AND expires_at<=unixepoch()`).all<{ id: number; variant_id: number; quantity: number }>();
  if (!expired.results.length) return;
  await env.DB.batch((expired.results as { id: number; variant_id: number; quantity: number }[]).flatMap((reservation) => [
    env.DB.prepare("UPDATE unique_find_reservations SET status='expired',updated_at=unixepoch() WHERE id=? AND status='active'").bind(reservation.id),
    env.DB.prepare("UPDATE product_variants SET reserved_stock=greatest(0,reserved_stock-?) WHERE id=?").bind(reservation.quantity, reservation.variant_id),
  ]));
}

export async function uniqueProductForVariant(variantId: number) {
  return env.DB.prepare(`SELECT p.id product_id,p.slug,p.name,p.is_unique_find,p.lifetime_production_cap,
    p.total_units_created,p.unique_find_status,p.keep_visible_after_sellout,p.status,v.id variant_id,v.stock,v.reserved_stock,v.active
    FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=?`).bind(variantId).first<Record<string, unknown>>();
}

export function uniqueAvailabilityError(product: Record<string, unknown> | null) {
  if (!product || !Number(product.is_unique_find) || product.status !== "published" || !Number(product.active)) return "This limited T-shirt is not available.";
  if (product.unique_find_status === "closed" || Number(product.stock) - Number(product.reserved_stock) < 1) return "SOLD OUT";
  return null;
}
