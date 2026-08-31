import { env } from "cloudflare:workers";
import { requireAdmin } from "../../_lib/admin";

const clean = (value: unknown, max = 300) => String(value ?? "").trim().slice(0, max);

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q"), 100).toLowerCase();
  const status = clean(url.searchParams.get("status"), 30);
  const conditions = ["v.active=1"];
  const params: unknown[] = [];
  if (q) {
    conditions.push("(lower(p.name) LIKE ? OR lower(p.sku) LIKE ? OR lower(v.sku) LIKE ? OR lower(v.size) LIKE ? OR lower(v.color) LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status === "low") conditions.push("v.stock-v.reserved_stock>0 AND v.stock-v.reserved_stock<=v.low_stock_threshold");
  if (status === "out") conditions.push("v.stock-v.reserved_stock<=0");
  const where = conditions.join(" AND ");
  const rows = await env.DB.prepare(`SELECT v.id,v.product_id,v.size,v.color,v.sku,v.stock,v.reserved_stock,
      v.low_stock_threshold,v.price,v.active,p.name product_name,p.slug product_slug,p.status product_status,
      (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order,id LIMIT 1) image_url,
      (SELECT created_at FROM inventory_movements WHERE variant_id=v.id ORDER BY created_at DESC,id DESC LIMIT 1) last_adjusted_at,
      (SELECT reason FROM inventory_movements WHERE variant_id=v.id ORDER BY created_at DESC,id DESC LIMIT 1) last_reason
    FROM product_variants v JOIN products p ON p.id=v.product_id
    WHERE ${where}
    ORDER BY CASE WHEN v.stock-v.reserved_stock<=0 THEN 0 WHEN v.stock-v.reserved_stock<=v.low_stock_threshold THEN 1 ELSE 2 END,
      p.name ASC,v.size ASC LIMIT 150`).bind(...params).all();
  return Response.json({ data: rows.results });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const reason = clean(body.reason, 300);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "A valid variant is required." }, { status: 400 });
  if (!reason) return Response.json({ error: "Inventory adjustments require a reason for the audit trail." }, { status: 400 });
  const variant = await env.DB.prepare("SELECT id,stock,reserved_stock FROM product_variants WHERE id=? AND active=1").bind(id).first<{ id: number; stock: number; reserved_stock: number }>();
  if (!variant) return Response.json({ error: "Variant not found." }, { status: 404 });
  const mode = clean(body.mode, 20);
  const quantity = Math.floor(Number(body.quantity));
  if (!Number.isInteger(quantity) || quantity < 0) return Response.json({ error: "Enter a non-negative inventory quantity." }, { status: 400 });
  const nextStock = mode === "set" ? quantity : mode === "increase" ? variant.stock + quantity : mode === "decrease" ? variant.stock - quantity : NaN;
  if (!Number.isInteger(nextStock) || nextStock < 0) return Response.json({ error: "Inventory cannot be reduced below zero." }, { status: 400 });
  if (nextStock < variant.reserved_stock) return Response.json({ error: "Stock cannot be lower than the quantity already reserved for open carts/orders." }, { status: 409 });
  const delta = nextStock - variant.stock;
  if (delta === 0) return Response.json({ updated: false, stock: variant.stock });
  await env.DB.batch([
    env.DB.prepare("UPDATE product_variants SET stock=? WHERE id=?").bind(nextStock, id),
    env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES(?,?,?,?)").bind(id, delta, reason, admin.email),
    env.DB.prepare("INSERT INTO audit_logs(admin_email,action,resource,resource_id,detail) VALUES(?,?,?,?,?)").bind(admin.email, "inventory_adjustment", "product_variants", String(id), JSON.stringify({ from: variant.stock, to: nextStock, delta, reason })),
  ]);
  return Response.json({ updated: true, stock: nextStock, availableStock: nextStock - variant.reserved_stock, delta });
}
