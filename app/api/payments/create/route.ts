import { env } from "@/db/runtime";
import { getAuthSession } from "../../../auth";

type Secrets = { RAZORPAY_KEY_ID?: string; RAZORPAY_KEY_SECRET?: string };
const secrets = () => env as unknown as Secrets;

export async function POST(request: Request) {
  const session = await getAuthSession(request);
  if (!session?.user) return Response.json({ error: "Sign in is required for online payment." }, { status: 401 });
  const { orderId } = await request.json() as { orderId?: number };
  if (!Number.isInteger(orderId)) return Response.json({ error: "Invalid order." }, { status: 400 });
  const order = await env.DB.prepare(`SELECT o.*,c.email FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.id=?`).bind(orderId).first<Record<string, unknown>>();
  if (!order || String(order.email).toLowerCase() !== session.user.email.trim().toLowerCase()) return Response.json({ error: "Order not found." }, { status: 404 });
  if (order.payment_method !== "razorpay" || order.payment_status !== "pending") return Response.json({ error: "This order cannot be paid online." }, { status: 409 });
  if (!secrets().RAZORPAY_KEY_ID || !secrets().RAZORPAY_KEY_SECRET) return Response.json({ error: "Online payments are not configured." }, { status: 503 });
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Basic ${btoa(`${secrets().RAZORPAY_KEY_ID}:${secrets().RAZORPAY_KEY_SECRET}`)}` },
    body: JSON.stringify({ amount: order.payable_amount, currency: "INR", receipt: `pr_${order.id}` }),
  });
  if (!response.ok) return Response.json({ error: "Unable to start online payment." }, { status: 502 });
  const gateway = await response.json() as { id: string; amount: number; currency: string };
  await env.DB.batch([
    env.DB.prepare("UPDATE payments SET gateway_order_id=?,updated_at=unixepoch() WHERE order_id=? AND provider='razorpay'").bind(gateway.id, order.id),
    env.DB.prepare("UPDATE orders SET status='awaiting_payment' WHERE id=?").bind(order.id),
  ]);
  return Response.json({ keyId: secrets().RAZORPAY_KEY_ID, orderId: gateway.id, amount: gateway.amount, currency: gateway.currency, internalOrderId: order.id });
}
