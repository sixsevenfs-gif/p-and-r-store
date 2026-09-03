import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

type Row = Record<string, unknown>;

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (Number.isInteger(id) && id > 0) {
    const [customer, orders, wishlist, logins] = await Promise.all([
      env.DB.prepare("SELECT id,first_name,last_name,phone,status,auth_provider,created_at,last_login_at FROM customers WHERE id=?").bind(id).first<Row>(),
      env.DB.prepare("SELECT id,status,payment_status,total_amount,created_at FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 25").bind(id).all<Row>(),
      env.DB.prepare("SELECT w.id,w.product_slug,w.created_at,p.name,p.price FROM wishlists w LEFT JOIN products p ON p.slug=w.product_slug WHERE w.customer_id=? ORDER BY w.created_at DESC").bind(id).all<Row>(),
      env.DB.prepare("SELECT id,phone,created_at FROM customer_login_events WHERE customer_id=? ORDER BY created_at DESC LIMIT 25").bind(id).all<Row>(),
    ]);
    if (!customer) return Response.json({ error: "Customer not found." }, { status: 404 });
    return Response.json({ customer, orders: orders.results, wishlist: wishlist.results, logins: logins.results });
  }

  const query = (url.searchParams.get("q") || "").trim().slice(0, 80).toLowerCase();
  const where = query ? "WHERE lower(c.first_name || ' ' || c.last_name) LIKE ? OR lower(c.phone) LIKE ?" : "";
  const params = query ? [`%${query}%`, `%${query}%`] : [];
  const rows = await env.DB.prepare(`SELECT c.id,c.first_name,c.last_name,c.phone,c.status,c.created_at,c.last_login_at,
    count(distinct o.id) order_count,count(distinct w.id) wishlist_count
    FROM customers c LEFT JOIN orders o ON o.customer_id=c.id LEFT JOIN wishlists w ON w.customer_id=c.id
    ${where} GROUP BY c.id ORDER BY coalesce(c.last_login_at,c.created_at) DESC LIMIT 200`).bind(...params).all<Row>();
  return Response.json({ customers: rows.results });
}
