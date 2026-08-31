import { orderDocument } from "../../../../_lib/order-documents";
import { requireApiCustomer } from "../../../../_lib/account";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid order." }, { status: 400 });
  const document = await orderDocument(id, "invoice");
  if (!document || Number(document.order.customer_id) !== customer.id) return Response.json({ error: "Order not found." }, { status: 404 });
  return new Response(document.bytes, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename=\"${document.filename}\"`, "cache-control": "private, no-store" } });
}
