import { env } from "@/db/runtime";
import { requireApiCustomer } from "../../_lib/account";
import { atomicRequest } from "../../_lib/atomic";
import { gatewayRequest } from "../../_lib/razorpay";

// Claim creation durably before contacting the gateway. An ambiguous network
// result MUST be reconciled by receipt in Razorpay; never blindly create again.
export async function POST(request: Request) {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { orderId } = await request.json();
  if (!Number.isSafeInteger(orderId) || orderId < 1) return Response.json({ error: "Invalid order." }, { status: 400 });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return Response.json({ error: "Online payments are not configured." }, { status: 503 });
  let amount = 0;
  const claim = await atomicRequest(async () => {
    const order = await env.DB.prepare("SELECT * FROM orders WHERE id=? AND customer_id=?").bind(orderId, customer.id).first<Record<string, unknown>>();
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_method !== "razorpay" || order.payment_status !== "pending" || order.status !== "awaiting_payment") return Response.json({ error: "Order cannot be paid." }, { status: 409 });
    amount = Number(order.payable_amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) return Response.json({ error: "Invalid payment amount." }, { status: 409 });
    const payment = await env.DB.prepare("SELECT gateway_order_id FROM payments WHERE order_id=? AND provider='razorpay'").bind(orderId).first<{gateway_order_id:string}>();
    if (payment?.gateway_order_id) return Response.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: payment.gateway_order_id, amount, currency: "INR", internalOrderId: orderId });
    const attempt = await env.DB.prepare("INSERT INTO payment_creation_attempts(order_id,status) VALUES (?,'started') ON CONFLICT(order_id) DO NOTHING RETURNING order_id").bind(orderId).first();
    if (!attempt) return Response.json({ error: "Payment initialization needs reconciliation. Do not create another order; contact support." }, { status: 409 });
    return Response.json({ claimed: true });
  })();
  if (!claim.ok || !(await claim.clone().json()).claimed) return claim;
  try {
    const gateway = await gatewayRequest("orders", { amount, currency: "INR", receipt: `pr_${orderId}` });
    if (typeof gateway.id !== "string" || !/^order_[a-zA-Z0-9]+$/.test(gateway.id) || gateway.amount !== amount || gateway.currency !== "INR") throw new Error("Invalid gateway order");
    return await atomicRequest(async () => {
      await env.DB.prepare("UPDATE payments SET gateway_order_id=?,updated_at=unixepoch() WHERE order_id=? AND provider='razorpay'").bind(gateway.id, orderId).run();
      await env.DB.prepare("UPDATE payment_creation_attempts SET status='complete',gateway_order_id=? WHERE order_id=?").bind(gateway.id, orderId).run();
      return Response.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: gateway.id, amount, currency: "INR", internalOrderId: orderId });
    })();
  } catch {
    await env.DB.prepare("UPDATE payment_creation_attempts SET status='unknown' WHERE order_id=? AND status='started'").bind(orderId).run();
    return Response.json({ error: "Payment initialization is uncertain. Do not pay again; contact support." }, { status: 503 });
  }
}
