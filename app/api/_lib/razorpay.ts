import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/db/runtime";
import { returnOrderCredit } from "./order-credit";

export function authenticSignature(value: string, signature: unknown, secret: string) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(value).digest(), Buffer.from(signature, "hex"));
}
export async function gatewayRequest(path: string, body?: unknown) {
  const key = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new Error("Gateway unavailable");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error("Gateway request failed");
  return response.json() as Promise<Record<string, unknown>>;
}
export async function settleCaptured(entity: Record<string, unknown>) {
  if (entity.status !== "captured" || entity.currency !== "INR" || !Number.isSafeInteger(entity.amount)
    || typeof entity.id !== "string" || !/^pay_[a-zA-Z0-9]+$/.test(entity.id)) throw new Error("Invalid captured payment");
  const payment = await env.DB.prepare(`SELECT p.id,p.amount,p.gateway_payment_id,o.id order_id,o.status,o.payment_status,o.payable_amount
    FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.gateway_order_id=? AND p.provider='razorpay' FOR UPDATE OF p,o`).bind(entity.order_id).first<Record<string, unknown>>();
  if (!payment || Number(payment.amount) !== entity.amount || Number(payment.payable_amount) !== entity.amount) throw new Error("Payment does not match order");
  if (payment.gateway_payment_id === entity.id && ["paid", "refunded"].includes(String(payment.payment_status))) return;
  if (payment.gateway_payment_id && payment.gateway_payment_id !== entity.id) throw new Error("Payment already associated");
  const duplicate = await env.DB.prepare("SELECT id FROM payments WHERE gateway_payment_id=? AND id<>?").bind(entity.id, payment.id).first();
  if (duplicate) throw new Error("Payment already used");
  await env.DB.prepare("UPDATE payments SET gateway_payment_id=?,status='paid',updated_at=unixepoch() WHERE id=?").bind(entity.id, payment.id).run();
  await env.DB.prepare(`UPDATE orders SET payment_status='paid',paid_at=coalesce(paid_at,unixepoch()),payment_reference=?,
    status=CASE WHEN status IN ('pending','awaiting_payment') THEN 'confirmed' ELSE status END WHERE id=?`).bind(entity.id, payment.order_id).run();
  if (["cancelled", "failed", "refunded"].includes(String(payment.status))) {
    await returnOrderCredit(Number(payment.order_id));
    await env.DB.prepare("UPDATE orders SET payment_status='refunded',refund_status='refunded',refunded_at=unixepoch() WHERE id=?").bind(payment.order_id).run();
  }
  await env.DB.prepare("INSERT INTO order_timeline(order_id,event_type,public_title,public_description) VALUES (?,'payment','Payment received','Your online payment was verified.')").bind(payment.order_id).run();
}
