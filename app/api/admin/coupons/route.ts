import { env } from "cloudflare:workers";
import { requireAdmin } from "../../_lib/admin";

const codePattern = /^[A-Z0-9][A-Z0-9_-]{2,47}$/;
const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const integer = (value: unknown, fallback: number | null = null) => value === "" || value == null ? fallback : Number.isInteger(Number(value)) ? Number(value) : NaN;
const amount = (value: unknown, fallback: number | null = null) => value === "" || value == null ? fallback : Math.round(Number(value) * 100);

export async function POST(request: Request) {
  const admin = await requireAdmin(request); if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const code = text(body.code, 48).toUpperCase(), type = text(body.type, 20), value = type === "percentage" ? integer(body.value) : amount(body.value);
    const minimumOrder = amount(body.minimumOrder, 0), maximumDiscount = amount(body.maximumDiscount), startsAt = body.startsAt ? Math.floor(new Date(String(body.startsAt)).getTime() / 1000) : null, endsAt = body.endsAt ? Math.floor(new Date(String(body.endsAt)).getTime() / 1000) : null, usageLimit = integer(body.usageLimit), perCustomerLimit = integer(body.perCustomerLimit, 1);
    if (!codePattern.test(code) || !["percentage", "fixed"].includes(type) || !Number.isInteger(value) || value <= 0 || !Number.isInteger(minimumOrder) || minimumOrder < 0 || !Number.isInteger(perCustomerLimit) || perCustomerLimit < 1 || (type === "percentage" && value > 100)) throw new Error("Enter a unique code, a valid discount and valid limits.");
    if ((maximumDiscount !== null && (!Number.isInteger(maximumDiscount) || maximumDiscount < 0)) || (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) || (startsAt !== null && !Number.isFinite(startsAt)) || (endsAt !== null && !Number.isFinite(endsAt)) || (startsAt && endsAt && endsAt <= startsAt)) throw new Error("Coupon dates or amounts are invalid.");
    const duplicate = await env.DB.prepare("SELECT id FROM coupons WHERE upper(code)=upper(?)").bind(code).first(); if (duplicate) return Response.json({ error: "That coupon code already exists." }, { status: 409 });
    const result = await env.DB.prepare("INSERT INTO coupons(code,type,value,minimum_order,maximum_discount,starts_at,ends_at,usage_limit,per_customer_limit,status,description,first_order_only,payment_methods) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(code, type, value, minimumOrder, maximumDiscount, startsAt, endsAt, usageLimit, perCustomerLimit, body.status === "active" ? "active" : "draft", text(body.description, 500), Number(body.firstOrderOnly === true), JSON.stringify(Array.isArray(body.paymentMethods) ? body.paymentMethods.map((item) => text(item, 20)).filter((item) => ["cod", "razorpay"].includes(item)) : [])).run();
    const id = Number(result.meta.last_row_id); await env.DB.prepare("INSERT INTO audit_logs(admin_email,action,resource,resource_id,detail) VALUES(?,?,?,?,?)").bind(admin.email, "create", "coupons", String(id), JSON.stringify({ code, type, value })).run();
    return Response.json({ id, code }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to create coupon." }, { status: 400 }); }
}
