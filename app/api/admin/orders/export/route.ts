import { env } from "@/db/runtime";
import { requireAdmin } from "../../../_lib/admin";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""').replace(/[\r\n]+/g, " ")}"`;

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const url = new URL(request.url), status = String(url.searchParams.get("status") || "").trim().slice(0, 40);
  const rows = await env.DB.prepare(`SELECT o.id,o.created_at,o.status,o.shipping_status,o.payment_status,o.payment_method,o.total_amount,o.courier,o.tracking_id,
    c.first_name,c.last_name,c.email,c.phone,o.shipping_address,group_concat(i.product_name || ' x' || i.quantity, ' | ') items
    FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN order_items i ON i.order_id=o.id ${status ? "WHERE o.status=?" : ""}
    GROUP BY o.id,c.id ORDER BY o.created_at DESC LIMIT 10000`).bind(...(status ? [status] : [])).all<Record<string, unknown>>();
  const head = ["order_number", "placed_at", "customer_name", "email", "phone", "items", "total_inr", "payment_status", "fulfilment_status", "shipping_status", "courier", "tracking_awb", "shipping_address"];
  const body = rows.results.map((row) => [
    `PR${row.id}`, new Date(Number(row.created_at) * 1000).toISOString(), `${row.first_name || ""} ${row.last_name || ""}`.trim(), row.email, row.phone, row.items,
    (Number(row.total_amount || 0) / 100).toFixed(2), row.payment_status, row.status, row.shipping_status, row.courier, row.tracking_id, row.shipping_address,
  ].map(csv).join(",")).join("\r\n");
  await env.DB.prepare("INSERT INTO audit_logs(admin_email,action,resource,resource_id,detail) VALUES (?,?,?,?,?)")
    .bind(admin.email, "order_export", "orders", null, JSON.stringify({ status: status || null, count: rows.results.length })).run();
  return new Response(`${head.map(csv).join(",")}\r\n${body}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=orders-export.csv", "cache-control": "private, no-store" } });
}
