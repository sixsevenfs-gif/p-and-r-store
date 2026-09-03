import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

const term = (value: string) => `%${value.trim().slice(0, 80)}%`;

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const query = new URL(request.url).searchParams.get("q") || "";
  if (query.trim().length < 2) return Response.json({ products: [], orders: [], customers: [] });
  const like = term(query);
  const [products, orders, customers] = await Promise.all([
    env.DB.prepare("SELECT id,name,slug,status FROM products WHERE name LIKE ? OR sku LIKE ? OR slug LIKE ? ORDER BY updated_at DESC LIMIT 5").bind(like, like, like).all(),
    env.DB.prepare("SELECT o.id,o.status,o.total_amount,c.first_name,c.last_name,c.phone FROM orders o JOIN customers c ON c.id=o.customer_id WHERE CAST(o.id AS TEXT) LIKE ? OR c.phone LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? ORDER BY o.created_at DESC LIMIT 5").bind(like, like, like, like).all(),
    env.DB.prepare("SELECT id,phone,first_name,last_name FROM customers WHERE phone LIKE ? OR first_name LIKE ? OR last_name LIKE ? ORDER BY created_at DESC LIMIT 5").bind(like, like, like).all(),
  ]);
  return Response.json({ products: products.results, orders: orders.results, customers: customers.results });
}
