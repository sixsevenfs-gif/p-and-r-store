import { env } from "cloudflare:workers";
import { getAuthSession } from "../../../auth";

type Secrets = { RAZORPAY_KEY_SECRET?: string };
const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
};
async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const session = await getAuthSession(request);
  if (!session?.user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json() as { orderId?: number; razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string };
  if (!Number.isInteger(body.orderId) || !body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) return Response.json({ error: "Invalid payment response." }, { status: 400 });
  const secret = (env as unknown as Secrets).RAZORPAY_KEY_SECRET;
  if (!secret) return Response.json({ error: "Online payments are not configured." }, { status: 503 });
  const payment = await env.DB.prepare(`SELECT p.id,p.gateway_order_id,o.id order_id,o.status,c.email FROM payments p JOIN orders o ON o.id=p.order_id JOIN customers c ON c.id=o.customer_id
    WHERE p.order_id=? AND p.provider='razorpay'`).bind(body.orderId).first<Record<string, unknown>>();
  if (!payment || String(payment.email).toLowerCase() !== session.user.email.trim().toLowerCase() || payment.gateway_order_id !== body.razorpayOrderId) return Response.json({ error: "Payment not found." }, { status: 404 });
  const expected = await signature(`${body.razorpayOrderId}|${body.razorpayPaymentId}`, secret);
  if (!timingSafeEqual(expected, body.razorpaySignature)) return Response.json({ error: "Payment verification failed." }, { status: 400 });
  await env.DB.batch([
    env.DB.prepare("UPDATE payments SET gateway_payment_id=?,status='paid',updated_at=unixepoch() WHERE id=?").bind(body.razorpayPaymentId, payment.id),
    env.DB.prepare("UPDATE orders SET payment_status='paid',status='confirmed',paid_at=unixepoch(),payment_reference=? WHERE id=?").bind(body.razorpayPaymentId, payment.order_id),
    env.DB.prepare("INSERT INTO order_status_history(order_id,status,note,actor_email) VALUES (?,?,?,?)").bind(payment.order_id, "CONFIRMED", "Online payment verified", session.user.email),
  ]);
  return Response.json({ verified: true });
}
