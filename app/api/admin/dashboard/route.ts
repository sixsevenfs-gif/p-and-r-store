import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

type NumberRow = { value: number | null };
type MetricsRow = { revenue:number;previous_revenue:number;orders:number;previous_orders:number;customers:number;previous_customers:number;low_stock:number;products:number;notifications:number };
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
  const [metrics, statuses, recentOrders, lowStockItems, dailySales] = await Promise.all([
    env.DB.prepare(`SELECT
      (SELECT coalesce(sum(total_amount),0) FROM orders WHERE ${validRevenue} AND ${currentWindow}) revenue,
      (SELECT coalesce(sum(total_amount),0) FROM orders WHERE ${validRevenue} AND ${previousWindow}) previous_revenue,
      (SELECT count(*) FROM orders WHERE ${currentWindow}) orders,
      (SELECT count(*) FROM orders WHERE ${previousWindow}) previous_orders,
      (SELECT count(*) FROM customers WHERE status='active' AND ${currentWindow}) customers,
      (SELECT count(*) FROM customers WHERE status='active' AND ${previousWindow}) previous_customers,
      (SELECT count(*) FROM product_variants WHERE active=1 AND stock-reserved_stock<=low_stock_threshold) low_stock,
      (SELECT count(*) FROM products WHERE status!='archived') products,
      (SELECT count(*) FROM product_variants WHERE active=1 AND stock-reserved_stock<=low_stock_threshold) +
      (SELECT count(*) FROM reviews WHERE status='pending') +
      (SELECT count(*) FROM returns WHERE decision_status='requested') notifications`).first<MetricsRow>(),
    env.DB.prepare("SELECT status,count(*) count FROM orders GROUP BY status").all<{ status: string; count: number }>(),
    env.DB.prepare(`SELECT o.id,o.total_amount,o.payment_method,o.payment_status,o.status,o.created_at,c.first_name,c.last_name,c.email,count(oi.id) item_count FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id,c.id ORDER BY o.created_at DESC LIMIT 8`).all(),
    env.DB.prepare(`SELECT v.id,v.size,v.color,v.stock,v.reserved_stock,v.low_stock_threshold,p.id product_id,p.name,(SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order ASC LIMIT 1) image_url FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.active=1 AND v.stock-v.reserved_stock<=v.low_stock_threshold ORDER BY (v.stock-v.reserved_stock) ASC,p.name ASC LIMIT 6`).all(),
    env.DB.prepare(`SELECT to_char(to_timestamp(created_at),'YYYY-MM-DD') date,coalesce(sum(total_amount),0) revenue FROM orders WHERE ${validRevenue} AND ${currentWindow} GROUP BY date ORDER BY date`).all<{date:string;revenue:number}>(),
  ]);
  const revenueByDate = new Map((dailySales.results as {date:string;revenue:number}[]).map((row) => [row.date, Number(row.revenue)]));
  const sales = Array.from({ length: range }, (_, index) => { const date = new Date((startAt + index * 86_400) * 1000).toISOString().slice(0, 10); return { date, revenue: revenueByDate.get(date) || 0 }; });
  const rawStatuses = new Map((statuses.results as { status: string; count: number }[]).map((item) => [String(item.status).toLowerCase(), Number(item.count)]));
  const orderStatuses = Object.entries(statusGroups).map(([label, values]) => ({ label, count: values.reduce((sum, status) => sum + (rawStatuses.get(status) || 0), 0) }));
  const comparison = (current: number, previous: number) => previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
  const values=metrics ?? {revenue:0,previous_revenue:0,orders:0,previous_orders:0,customers:0,previous_customers:0,low_stock:0,products:0,notifications:0};
  return Response.json({ range, startAt, endAt, metrics: { revenue: Number(values.revenue), orders: Number(values.orders), customers: Number(values.customers), lowStock: Number(values.low_stock), products: Number(values.products), comparisons: { revenue: comparison(Number(values.revenue), Number(values.previous_revenue)), orders: comparison(Number(values.orders), Number(values.previous_orders)), customers: comparison(Number(values.customers), Number(values.previous_customers)) } }, sales, orderStatuses, recentOrders: recentOrders.results, lowStockItems: lowStockItems.results, topProducts: [], notificationCount: Number(values.notifications) });
}
