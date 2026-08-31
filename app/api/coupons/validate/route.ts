import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as { code?: string; subtotalAmount?: number };
  const code = String(body.code ?? "").trim().slice(0, 48);
  const subtotal = Math.max(0, Math.floor(Number(body.subtotalAmount) || 0));
  if (!code || !subtotal) return Response.json({ error: "Enter a coupon and a valid subtotal." }, { status: 400 });
  const coupon = await env.DB.prepare(`SELECT code,type,value,minimum_order,maximum_discount,usage_limit,usage_count FROM coupons
    WHERE upper(code)=upper(?) AND status='active' AND (starts_at IS NULL OR starts_at<=unixepoch()) AND (ends_at IS NULL OR ends_at>=unixepoch())`).bind(code).first<Record<string, unknown>>();
  if (!coupon || subtotal < Number(coupon.minimum_order ?? 0) || (coupon.usage_limit != null && Number(coupon.usage_count) >= Number(coupon.usage_limit))) return Response.json({ error: "This coupon is unavailable." }, { status: 404 });
  const raw = coupon.type === "percentage" ? Math.floor(subtotal * Number(coupon.value) / 100) : Number(coupon.value);
  return Response.json({ code: coupon.code, discountAmount: Math.min(subtotal, raw, Number(coupon.maximum_discount ?? raw)) });
}
