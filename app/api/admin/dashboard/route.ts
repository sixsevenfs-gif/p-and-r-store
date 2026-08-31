import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

type NumberRow = { value: number | null };
const validRevenue = "(payment_status='paid' OR status IN ('confirmed','packed','shipped','delivered')) AND status NOT IN ('cancelled','returned','failed')";
const statusGroups: Record<string, string[]> = { paid: ["confirmed"], processing: ["pending", "awaiting_payment", "packed"], shipped: ["shipped"], delivered: ["delivered"], cancelled: ["cancelled", "returned", "failed", "return_requested"] };
const number = (row: NumberRow | null | undefined) => Number(row?.value ?? 0);
const daysAgo = (days: number) => Math.floor(Date.now() / 1000) - days * 86_400;

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  const requestedRange = Number(new URL(request.url).searchParams.get("range") || 7);
  const range = [7, 30, 90].includes(requestedRange) ? requestedRange : 7;
  const endAt = Math.floor(Date.now() / 1000), startAt = daysAgo(range - 1), previousStartAt = daysAgo(range * 2 - 1), previousEndAt = startAt - 1;
  const currentWindow = `created_at>=${startAt} AND created_at<=${endAt}`, previousWindow = `created_at>=${previousStartAt} AND created_at<=${previousEndAt}`;
  const [revenue, previousRevenue, orders, previousOrders, customers, previousCustomers, lowStock, productCount, statuses, recentOrders, lowStockItems, topProducts, notifications] = await Promise.all([
    env.DB.prepare(`SELECT coalesce(sum(total_amount),0) value FROM orders WHERE ${validRevenue} AND ${currentWindow}`).first<NumberRow>(),
    env.DB.prepare(`SELECT coalesce(sum(total_amount),0) value FROM orders WHERE ${validRevenue} AND ${previousWindow}`).first<NumberRow>(),
    env.DB.prepare(`SELECT count(*) value FROM orders WHERE ${currentWindow}`).first<NumberRow>(), env.DB.prepare(`SELECT count(*) value FROM orders WHERE ${previousWindow}`).first<NumberRow>(),
    env.DB.prepare(`SELECT count(*) value FROM customers WHERE status='active' AND ${currentWindow.replaceAll("created_at", "customers.created_at")}`).first<NumberRow>(), env.DB.prepare(`SELECT count(*) value FROM customers WHERE status='active' AND ${previousWindow.replaceAll("created_at", "customers.created_at")}`).first<NumberRow>(),
    env.DB.prepare("SELECT count(*) value FROM product_variants WHERE active=1 AND stock-reserved_stock<=low_stock_threshold").first<NumberRow>(), env.DB.prepare("SELECT count(*) value FROM products WHERE status!='archived'").first<NumberRow>(),
    env.DB.prepare("SELECT status,count(*) count FROM orders GROUP BY status").all<{ status: string; count: number }>(),
    env.DB.prepare(`SELECT o.id,o.total_amount,o.payment_method,o.payment_status,o.status,o.created_at,c.first_name,c.last_name,c.email,count(oi.id) item_count FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 8`).all(),
    env.DB.prepare(`SELECT v.id,v.size,v.color,v.stock,v.reserved_stock,v.low_stock_threshold,p.id product_id,p.name,(SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order ASC LIMIT 1) image_url FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.active=1 AND v.stock-v.reserved_stock<=v.low_stock_threshold ORDER BY (v.stock-v.reserved_stock) ASC,p.name ASC LIMIT 6`).all(),
    env.DB.prepare(`SELECT oi.product_name,sum(oi.quantity) units FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE ${validRevenue} AND ${currentWindow.replaceAll("created_at", "o.created_at")} GROUP BY oi.product_name ORDER BY units DESC LIMIT 5`).all(),
    env.DB.prepare("SELECT (SELECT count(*) FROM product_variants WHERE active=1 AND stock-reserved_stock<=low_stock_threshold) + (SELECT count(*) FROM reviews WHERE status='pending') + (SELECT count(*) FROM returns WHERE decision_status='requested') value").first<NumberRow>(),
  ]);
  const sales = await Promise.all(Array.from({ length: range }, async (_, index) => {
    const dayStart = startAt + index * 86_400;
    const row = await env.DB.prepare(`SELECT coalesce(sum(total_amount),0) value FROM orders WHERE ${validRevenue} AND created_at>=? AND created_at<?`).bind(dayStart, dayStart + 86_400).first<NumberRow>();
    return { date: new Date(dayStart * 1000).toISOString().slice(0, 10), revenue: number(row) };
  }));
  const rawStatuses = new Map((statuses.results as { status: string; count: number }[]).map((item) => [String(item.status).toLowerCase(), Number(item.count)]));
  const orderStatuses = Object.entries(statusGroups).map(([label, values]) => ({ label, count: values.reduce((sum, status) => sum + (rawStatuses.get(status) || 0), 0) }));
  const comparison = (current: number, previous: number) => previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
  return Response.json({ range, startAt, endAt, metrics: { revenue: number(revenue), orders: number(orders), customers: number(customers), lowStock: number(lowStock), products: number(productCount), comparisons: { revenue: comparison(number(revenue), number(previousRevenue)), orders: comparison(number(orders), number(previousOrders)), customers: comparison(number(customers), number(previousCustomers)) } }, sales, orderStatuses, recentOrders: recentOrders.results, lowStockItems: lowStockItems.results, topProducts: topProducts.results, notificationCount: number(notifications) });
}
