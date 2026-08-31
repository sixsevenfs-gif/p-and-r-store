import { requireAdmin } from "../../../_lib/admin";
import { orderDocument } from "../../../_lib/order-documents";

const kinds = new Set(["invoice", "summary", "packing-slip", "shipping-label"]);
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const url = new URL(request.url), id = Number(url.searchParams.get("id")), type = String(url.searchParams.get("type") || "summary");
  if (!Number.isInteger(id) || !kinds.has(type)) return Response.json({ error: "Invalid document request." }, { status: 400 });
  const document = await orderDocument(id, type as "invoice" | "summary" | "packing-slip" | "shipping-label", type === "summary");
  if (!document) return Response.json({ error: "Order not found." }, { status: 404 });
  return new Response(document.bytes, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename=\"${document.filename}\"`, "cache-control": "private, no-store" } });
}
