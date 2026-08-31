import { env } from "cloudflare:workers";

type DocumentKind = "invoice" | "summary" | "packing-slip" | "shipping-label";
type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7e]/g, " ").slice(0, 110);
const money = (value: unknown) => `INR ${(Number(value || 0) / 100).toFixed(2)}`;

export async function orderDocument(orderId: number, kind: DocumentKind, includeInternal = false) {
  const order = await env.DB.prepare(`SELECT o.*,c.first_name,c.last_name,c.email,c.phone FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.id=?`).bind(orderId).first<Row>();
  if (!order) return null;
  const items = await env.DB.prepare("SELECT product_name,size,color,quantity,unit_price FROM order_items WHERE order_id=? ORDER BY id").bind(orderId).all<Row>();
  let address: Record<string, unknown> = {};
  try { address = JSON.parse(String(order.shipping_address || "{}")); } catch { /* preserve malformed legacy snapshots without exposing parser errors */ }
  const name = `${order.first_name || ""} ${order.last_name || ""}`.trim();
  const lines = [
    "P&R CLOTHING", kind === "invoice" ? "TAX INVOICE" : kind === "summary" ? "ADMIN ORDER SUMMARY" : kind === "packing-slip" ? "PACKING SLIP" : "SHIPPING LABEL",
    `Order: PR${order.id}`, `Placed: ${new Date(Number(order.created_at) * 1000).toLocaleString("en-IN")}`,
    `Customer: ${name}`, `Email: ${order.email}`, `Phone: ${order.phone || "Not provided"}`,
    `Ship to: ${[address.firstName, address.lastName, address.address, address.city, address.state, address.pinCode].filter(Boolean).join(", ") || "Address unavailable"}`,
  ];
  if (kind !== "shipping-label") {
    lines.push("", "ITEMS");
    for (const item of items.results) lines.push(`${item.quantity} x ${item.product_name} | ${item.size}${item.color ? ` / ${item.color}` : ""} | ${money(item.unit_price)}`);
    lines.push("", `Subtotal: ${money(order.subtotal_amount)}`, `Discount: ${money(order.discount_amount)}`, `Shipping: ${money(order.shipping_amount)}`, `Total: ${money(order.total_amount)}`, `Payment: ${order.payment_method} / ${order.payment_status}`);
  }
  if (kind === "summary") lines.push(`Fulfilment: ${order.status}`, `Courier: ${order.courier || "Not assigned"}`, `AWB: ${order.tracking_id || "Not assigned"}`, `Refund: ${order.refund_status || "none"}`);
  if (kind === "shipping-label") lines.push("", `Courier: ${order.courier || "To be assigned"}`, `AWB: ${order.tracking_id || "To be assigned"}`, `Service: ${order.shipping_status}`);
  if (includeInternal && kind === "summary") lines.push("", "Internal document - do not share with customer.");
  return { order, bytes: simplePdf(lines), filename: `PR-${orderId}-${kind}.pdf` };
}

/** A compact, dependency-free PDF renderer for transactional documents. */
function simplePdf(lines: string[]) {
  const pageLines = lines.slice(0, 48).map((line, index) => `BT /F1 10 Tf 48 ${790 - index * 15} Td (${text(line)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${new TextEncoder().encode(pageLines).length} >>\nstream\n${pageLines}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(new TextEncoder().encode(pdf).length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
