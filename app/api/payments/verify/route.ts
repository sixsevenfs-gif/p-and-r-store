import { env } from "@/db/runtime";
import { requireApiCustomer } from "../../_lib/account";
import { atomicRequest } from "../../_lib/atomic";
import { authenticSignature, gatewayRequest, settleCaptured } from "../../_lib/razorpay";
export const POST = atomicRequest(async (request: Request) => {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return Response.json({ error: "Online payments are not configured." }, { status: 503 });
  if (!Number.isSafeInteger(body.orderId) || !/^pay_[a-zA-Z0-9]+$/.test(String(body.razorpayPaymentId))) return Response.json({ error: "Invalid payment." }, { status: 400 });
  const payment = await env.DB.prepare("SELECT p.gateway_order_id FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.order_id=? AND o.customer_id=? AND p.provider='razorpay'").bind(body.orderId, customer.id).first<{gateway_order_id:string}>();
  if (!payment || payment.gateway_order_id !== body.razorpayOrderId || !authenticSignature(`${payment.gateway_order_id}|${body.razorpayPaymentId}`, body.razorpaySignature, secret)) return Response.json({ error: "Payment verification failed." }, { status: 400 });
  const entity = await gatewayRequest(`payments/${body.razorpayPaymentId}`);
  if (entity.order_id !== payment.gateway_order_id || entity.status !== "captured") return Response.json({ error: "Payment capture is pending. Do not pay again; check your orders shortly." }, { status: 409 });
  await settleCaptured(entity);
  return Response.json({ verified: true });
});
