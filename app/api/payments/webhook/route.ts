import { env } from "cloudflare:workers";

type Secrets = { RAZORPAY_WEBHOOK_SECRET?: string };
async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function same(a: string, b: string) { if (a.length !== b.length) return false; let value = 0; for (let i = 0; i < a.length; i++) value |= a.charCodeAt(i) ^ b.charCodeAt(i); return value === 0; }

export async function POST(request: Request) {
  const secret = (env as unknown as Secrets).RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-razorpay-signature");
  const raw = await request.text();
  if (!secret || !signature || !same(await hmac(raw, secret), signature)) return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; error_description?: string } } } };
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return Response.json({ accepted: true });
  if (event.event === "payment.captured") {
    const found = await env.DB.prepare("SELECT order_id FROM payments WHERE gateway_order_id=? AND provider='razorpay'").bind(payment.order_id).first<{ order_id:number }>();
    if (found) await env.DB.batch([
      env.DB.prepare("UPDATE payments SET gateway_payment_id=?,status='paid',updated_at=unixepoch() WHERE gateway_order_id=? AND status!='paid'").bind(payment.id ?? null, payment.order_id),
      env.DB.prepare("UPDATE orders SET payment_status='paid',status='confirmed',paid_at=unixepoch(),payment_reference=? WHERE id=? AND payment_status!='paid'").bind(payment.id ?? null, found.order_id),
      env.DB.prepare("INSERT INTO order_status_history(order_id,status,note) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM order_status_history WHERE order_id=? AND note=?)").bind(found.order_id, "CONFIRMED", "Payment gateway webhook verified", found.order_id, "Payment gateway webhook verified"),
    ]);
  } else if (event.event === "payment.failed") {
    await env.DB.prepare("UPDATE payments SET status='failed',failure_reason=?,updated_at=unixepoch() WHERE gateway_order_id=? AND status='pending'").bind(payment.error_description ?? "Payment failed", payment.order_id).run();
  }
  return Response.json({ accepted: true });
}
