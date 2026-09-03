import { env } from "@/db/runtime";
import { requireApiCustomer } from "../_lib/account";
import { ensureCatalog } from "../_lib/catalog";
import { getAuthSession } from "../../auth";
import { normalizeIndianPhone } from "../_lib/account";

const pinPattern = /^\d{6}$/;
const paymentMethods = new Set(["cod", "razorpay"]);
type IncomingItem = { variantId?: number; productSlug?: string; size?: string; quantity?: number };
type Line = { variantId:number; slug:string; name:string; size:string; color:string; unitPrice:number; quantity:number };
const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

async function discountFor(code: string, subtotal: number, customerId: number) {
  if (!code) return { id: null as number | null, code: null as string | null, amount: 0 };
  const coupon = await env.DB.prepare(`SELECT * FROM coupons WHERE upper(code)=upper(?) AND status='active'
    AND (starts_at IS NULL OR starts_at<=unixepoch()) AND (ends_at IS NULL OR ends_at>=unixepoch())`).bind(code).first<Record<string, unknown>>();
  if (!coupon || subtotal < Number(coupon.minimum_order ?? 0)) throw new Error("That coupon is not available for this order.");
  if (coupon.usage_limit != null && Number(coupon.usage_count) >= Number(coupon.usage_limit)) throw new Error("That coupon has reached its usage limit.");
  const usage = await env.DB.prepare("SELECT count(*) AS count FROM coupon_usages WHERE coupon_id=? AND customer_id=?").bind(coupon.id, customerId).first<{ count:number }>();
  if (Number(usage?.count ?? 0) >= Number(coupon.per_customer_limit ?? 1)) throw new Error("You have already used that coupon.");
  const raw = coupon.type === "percentage" ? Math.floor(subtotal * Number(coupon.value) / 100) : Number(coupon.value);
  return { id: Number(coupon.id), code: String(coupon.code), amount: Math.min(subtotal, raw, Number(coupon.maximum_discount ?? raw)) };
}

export async function POST(request: Request) {
  let orderId: number | null = null;
  let walletDebit: { customerId: number; amount: number } | null = null;
  const decremented: Line[] = [];
  try {
    const body = await request.json() as Record<string, unknown>;
    const phone = normalizeIndianPhone(clean(body.phone, 24)), firstName = clean(body.firstName, 60), lastName = clean(body.lastName, 60);
    const address = clean(body.address, 160), city = clean(body.city, 80), pinCode = clean(body.pinCode, 6);
    const checkoutKey = clean(body.checkoutKey, 64), paymentMethod = clean(body.paymentMethod || "cod", 20).toLowerCase();
    const items = Array.isArray(body.items) ? body.items as IncomingItem[] : [];
    if (!phone || !firstName || !lastName || !address || !city || !pinPattern.test(pinCode)) return Response.json({ error: "Complete all delivery details with a valid mobile number and 6-digit PIN code." }, { status: 400 });
    if (!/^[0-9a-f-]{36}$/i.test(checkoutKey) || !paymentMethods.has(paymentMethod)) return Response.json({ error: "Invalid checkout session or payment method." }, { status: 400 });
    if (!items.length || items.length > 30 || items.some((item) => (!Number.isInteger(item.variantId) && !(clean(item.productSlug, 120) && clean(item.size, 16))) || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 10)) return Response.json({ error: "Your bag contains an invalid item." }, { status: 400 });
    const session = await getAuthSession(request);
    if (session?.user?.phone && normalizeIndianPhone(session.user.phone) !== phone) return Response.json({ error: "Checkout mobile number must match your signed-in account." }, { status: 403 });
    const email = session?.user?.email?.trim().toLowerCase() || `phone-${phone.replace(/\D/g, "")}@members.invalid`;
    const requestedWalletAmount = Math.max(0, Math.floor(Number(body.walletAmount) || 0));
    const signedInCustomer = session?.user ? await requireApiCustomer(request) : null;

    await ensureCatalog();
    await env.DB.prepare(`INSERT INTO customers(email,first_name,last_name,address,city,pin_code,phone,referral_code) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(email) DO UPDATE SET first_name=excluded.first_name,last_name=excluded.last_name,address=excluded.address,city=excluded.city,pin_code=excluded.pin_code,phone=excluded.phone,updated_at=unixepoch()`)
      .bind(email, firstName, lastName, address, city, pinCode, phone, `GUEST${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`).run();
    const customer = await env.DB.prepare("SELECT id FROM customers WHERE email=?").bind(email).first<{ id:number }>();
    if (!customer) throw new Error("Customer creation failed.");
    const existing = await env.DB.prepare("SELECT * FROM orders WHERE checkout_key=?").bind(checkoutKey).first<Record<string, unknown>>();
    if (existing) {
      if (Number(existing.customer_id) !== customer.id) return Response.json({ error: "Checkout session is already in use." }, { status: 409 });
      return Response.json({ orderId: existing.id, duplicate: true, paymentStatus: existing.payment_status, payableAmount: existing.payable_amount });
    }

    const requested = new Map<string, { item: IncomingItem; quantity: number }>();
    for (const item of items) {
      const key = Number.isInteger(item.variantId) ? `id:${item.variantId}` : `slug:${clean(item.productSlug, 120)}:${clean(item.size, 16)}`;
      const current = requested.get(key);
      requested.set(key, { item, quantity: (current?.quantity ?? 0) + Number(item.quantity) });
    }
    const lines: Line[] = [];
    for (const { item, quantity } of requested.values()) {
      const byId = Number.isInteger(item.variantId);
      const row = await env.DB.prepare(`SELECT v.id variant_id,v.size,v.color,v.stock,v.reserved_stock,v.price variant_price,p.slug,p.name,p.price,p.status
        FROM product_variants v JOIN products p ON p.id=v.product_id WHERE ${byId ? "v.id=?" : "p.slug=? AND v.size=?"} AND v.active=1 AND p.status='published'`)
        .bind(...(byId ? [Number(item.variantId)] : [clean(item.productSlug, 120), clean(item.size, 16)])).first<Record<string, unknown>>();
      if (!row || Number(row.stock) - Number(row.reserved_stock) < quantity) return Response.json({ error: "One of your selected sizes just sold out. Refresh your bag and try again." }, { status: 409 });
      lines.push({ variantId:Number(row.variant_id), slug:String(row.slug), name:String(row.name), size:String(row.size), color:String(row.color), unitPrice:Number(row.variant_price ?? row.price), quantity });
    }
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const coupon = await discountFor(clean(body.couponCode, 48), subtotal, customer.id);
    const shipping = subtotal - coupon.amount >= 199900 ? 0 : 9900;
    const total = subtotal - coupon.amount + shipping;
    let walletAmount = 0;
    let walletPaise = 0;
    if (requestedWalletAmount) {
      if (!signedInCustomer || signedInCustomer.id !== customer.id) return Response.json({ error: "Sign in to use wallet credit." }, { status: 401 });
      const result = await env.DB.prepare("SELECT coalesce(sum(amount),0) AS balance FROM wallet_ledger WHERE customer_id=? AND status IN ('available','used')").bind(customer.id).first<{ balance:number }>();
      const balanceRupees = Math.floor(Math.max(0, Number(result?.balance ?? 0)) / 100);
      walletAmount = Math.min(requestedWalletAmount, balanceRupees, Math.floor(total / 100));
      const walletAmountPaise = walletAmount * 100;
      walletPaise = walletAmountPaise;
    }
    const result = await env.DB.prepare(`INSERT INTO orders(customer_id,checkout_key,subtotal_amount,discount_amount,shipping_amount,total_amount,wallet_amount,payable_amount,status,payment_status,payment_method,shipping_address,coupon_code)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(customer.id, checkoutKey, subtotal, coupon.amount, shipping, total, walletPaise, total - walletPaise,
      paymentMethod === "cod" ? "pending" : "awaiting_payment", "pending", paymentMethod,
      JSON.stringify({ firstName, lastName, address, city, pinCode, phone }), coupon.code).run();
    orderId = Number(result.meta.last_row_id);
    if (!orderId) throw new Error("Order creation failed.");
    for (const line of lines) {
      const changed = await env.DB.prepare("UPDATE product_variants SET stock=stock-? WHERE id=? AND active=1 AND stock-reserved_stock>=?").bind(line.quantity, line.variantId, line.quantity).run();
      if (Number(changed.meta.changes ?? 0) !== 1) throw new Error("A selected item is no longer in stock.");
      decremented.push(line);
    }
    if (walletPaise) {
      const debit = await env.DB.prepare(`INSERT INTO wallet_ledger(customer_id,order_id,amount,type,status,note,idempotency_key)
        SELECT ?,?,-?,'debit','used',?,? WHERE coalesce((SELECT sum(amount) FROM wallet_ledger WHERE customer_id=? AND status IN ('available','used')),0)>=?
        ON CONFLICT(idempotency_key) DO NOTHING`)
        .bind(customer.id, orderId, walletPaise, `Applied to order #${orderId}`, `order:${orderId}:wallet`, customer.id, walletPaise).run();
      if (Number(debit.meta.changes ?? 0) !== 1) throw new Error("Wallet balance changed. Review your available credit and try again.");
      walletDebit = { customerId: customer.id, amount: walletPaise };
    }
    const writes = [
      ...lines.map((line) => env.DB.prepare("INSERT INTO order_items(order_id,product_slug,product_name,unit_price,quantity,size,color,variant_id) VALUES (?,?,?,?,?,?,?,?)").bind(orderId, line.slug, line.name, line.unitPrice, line.quantity, line.size, line.color, line.variantId)),
      env.DB.prepare("INSERT INTO order_status_history(order_id,status,note,actor_email) VALUES (?,?,?,?)").bind(orderId, "PENDING", "Order placed", email),
      env.DB.prepare("INSERT INTO order_timeline(order_id,event_type,public_title,public_description,actor_email) VALUES (?,?,?,?,?)").bind(orderId, "order", "Order placed", "We received your order and will update you as it moves forward.", email),
      env.DB.prepare("INSERT INTO payments(order_id,provider,amount,status) VALUES (?,?,?,?)").bind(orderId, paymentMethod, total - walletPaise, "pending"),
      env.DB.prepare(`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE customer_id=?) AND variant_id IN (${lines.map(() => "?").join(",")})`).bind(customer.id, ...lines.map((line) => line.variantId)),
    ];
    if (coupon.id) writes.push(env.DB.prepare("INSERT INTO coupon_usages(coupon_id,customer_id,order_id,discount_amount) VALUES (?,?,?,?)").bind(coupon.id, customer.id, orderId, coupon.amount), env.DB.prepare("UPDATE coupons SET usage_count=usage_count+1 WHERE id=?").bind(coupon.id));
    await env.DB.batch(writes);
    return Response.json({ orderId, paymentMethod, subtotalAmount: subtotal, discountAmount: coupon.amount, shippingAmount: shipping, totalAmount: total, walletAmount: walletPaise, payableAmount: total - walletPaise }, { status: 201 });
  } catch (error) {
    if (decremented.length) await env.DB.batch(decremented.map((line) => env.DB.prepare("UPDATE product_variants SET stock=stock+? WHERE id=?").bind(line.quantity, line.variantId)));
    if (walletDebit && orderId) await env.DB.prepare("INSERT INTO wallet_ledger(customer_id,order_id,amount,type,status,note,idempotency_key) VALUES (?,?,?,'failed_order_restore','available',?,?) ON CONFLICT(idempotency_key) DO NOTHING")
      .bind(walletDebit.customerId, orderId, walletDebit.amount, `Wallet restored after failed order #${orderId}`, `order:${orderId}:wallet-return`).run();
    if (orderId) await env.DB.prepare("UPDATE orders SET status='failed' WHERE id=?").bind(orderId).run();
    const message = error instanceof Error && /coupon|stock/i.test(error.message) ? error.message : "Unable to place your order right now.";
    return Response.json({ error: message }, { status: /coupon|stock/i.test(message) ? 409 : 500 });
  }
}

export async function GET() {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const orders = await env.DB.prepare("SELECT id,created_at,status,payment_status,payment_method,total_amount,payable_amount FROM orders WHERE customer_id=? ORDER BY created_at DESC").bind(customer.id).all();
  return Response.json({ orders: orders.results });
}
