import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, orderItems, orders, walletLedger } from "../../../db/schema";
import { products } from "../../product-data";
import { getChatGPTUser } from "../../chatgpt-auth";
import { requireApiCustomer } from "../_lib/account";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validSizes = new Set(["XS", "S", "M", "L", "XL"]);

type IncomingItem = { productSlug?: string; quantity?: number; size?: string };

export async function POST(request: Request) {
  let createdOrderId: number | null = null;
  let createdCustomerId: number | null = null;
  let debitedWalletPaise = 0;
  let checkoutKey = "";
  try {
    const payload = (await request.json()) as {
      email?: string;
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      pinCode?: string;
      items?: IncomingItem[];
      walletAmount?: number;
      checkoutKey?: string;
    };
    const email = payload.email?.trim().toLowerCase() ?? "";
    const firstName = payload.firstName?.trim() ?? "";
    const lastName = payload.lastName?.trim() ?? "";
    const address = payload.address?.trim() ?? "";
    const city = payload.city?.trim() ?? "";
    const pinCode = payload.pinCode?.trim() ?? "";
    const items = payload.items ?? [];
    const requestedWalletAmount = Math.max(0, Math.floor(Number(payload.walletAmount) || 0));
    checkoutKey = payload.checkoutKey?.trim() ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(checkoutKey)) {
      return Response.json({ error: "Invalid checkout session. Refresh checkout and try again." }, { status: 400 });
    }
    const identity = await getChatGPTUser();
    if (identity && identity.email.trim().toLowerCase() !== email) {
      return Response.json({ error: "Checkout email must match your signed-in account." }, { status: 403 });
    }

    if (!emailPattern.test(email) || !firstName || !lastName || !address || !city || !/^\d{6}$/.test(pinCode)) {
      return Response.json({ error: "Complete all delivery details with a valid email and 6-digit PIN code." }, { status: 400 });
    }

    if (!items.length || items.some((item) => !item.productSlug || !Number.isInteger(item.quantity) || item.quantity! < 1 || item.quantity! > 10 || !validSizes.has(item.size ?? ""))) {
      return Response.json({ error: "Your bag contains an invalid item." }, { status: 400 });
    }

    const productsBySlug = new Map(products.map((product) => [product.slug, product]));
    const selectedItems = items.map((item) => ({ ...item, product: productsBySlug.get(item.productSlug!) }));

    if (selectedItems.some((item) => !item.product)) {
      return Response.json({ error: "One or more products are no longer available." }, { status: 400 });
    }

    const subtotalAmount = selectedItems.reduce((sum, item) => sum + item.product!.price * item.quantity!, 0);
    const discountAmount = 0;
    const shippingAmount = subtotalAmount >= 1999 ? 0 : 99;
    const totalAmount = subtotalAmount - discountAmount + shippingAmount;
    const db = getDb();

    const signedInCustomer = identity ? await requireApiCustomer() : null;
    await db.insert(customers).values({ email, firstName, lastName, address, city, pinCode, referralCode: `GUEST${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}` }).onConflictDoUpdate({
      target: customers.email,
      set: { firstName, lastName, address, city, pinCode, updatedAt: new Date() },
    });

    const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).get();
    if (!customer) throw new Error("Customer record was not created.");
    createdCustomerId = customer.id;

    const existingOrder = await db.select().from(orders).where(eq(orders.checkoutKey, checkoutKey)).get();
    if (existingOrder) {
      if (existingOrder.customerId !== customer.id) return Response.json({ error: "Checkout session is already in use." }, { status: 409 });
      if (existingOrder.status === "failed") return Response.json({ error: "This checkout attempt failed. Start a new checkout." }, { status: 409 });
      return Response.json({
        orderId: existingOrder.id,
        subtotalAmount: existingOrder.subtotalAmount,
        discountAmount: existingOrder.discountAmount,
        shippingAmount: existingOrder.shippingAmount,
        totalAmount: existingOrder.totalAmount,
        walletAmount: existingOrder.walletAmount,
        payableAmount: existingOrder.payableAmount,
        duplicate: true,
      });
    }

    let walletAmount = 0;
    if (requestedWalletAmount) {
      if (!signedInCustomer || signedInCustomer.id !== customer.id) return Response.json({ error: "Sign in to use wallet credit." }, { status: 401 });
      const result = await db.select({ balance: sql<number>`coalesce(sum(${walletLedger.amount}), 0)` }).from(walletLedger)
        .where(sql`${walletLedger.customerId} = ${customer.id} and ${walletLedger.status} in ('available','used')`).get();
      const balanceRupees = Math.floor(Math.max(0, Number(result?.balance ?? 0)) / 100);
      walletAmount = Math.min(requestedWalletAmount, balanceRupees, totalAmount);
    }
    const [order] = await db.insert(orders).values({
      customerId: customer.id,
      checkoutKey,
      subtotalAmount,
      discountAmount,
      shippingAmount,
      totalAmount,
      walletAmount,
      payableAmount: totalAmount - walletAmount,
      status: "creating",
    }).returning({ id: orders.id });
    createdOrderId = order.id;
    await db.insert(orderItems).values(selectedItems.map((item) => ({
      orderId: order.id,
      productSlug: item.product!.slug,
      productName: item.product!.name,
      unitPrice: item.product!.price,
      quantity: item.quantity!,
      size: item.size!,
    })));
    if (walletAmount) {
      await db.insert(walletLedger).values({
        customerId: customer.id,
        orderId: order.id,
        amount: -(walletAmount * 100),
        type: "debit",
        status: "used",
        note: `Applied to order #${order.id}`,
        idempotencyKey: `order:${order.id}:wallet`,
      });
      debitedWalletPaise = walletAmount * 100;
    }
    await db.update(orders).set({ status: "pending" }).where(and(eq(orders.id, order.id), eq(orders.status, "creating")));

    return Response.json({ orderId: order.id, subtotalAmount, discountAmount, shippingAmount, totalAmount, walletAmount, payableAmount: totalAmount - walletAmount }, { status: 201 });
  } catch {
    if (createdOrderId && createdCustomerId) {
      try {
        const db = getDb();
        const debit = await db.select().from(walletLedger).where(eq(walletLedger.idempotencyKey, `order:${createdOrderId}:wallet`)).get();
        if (debit && debitedWalletPaise > 0) {
          await db.insert(walletLedger).values({
            customerId: createdCustomerId,
            orderId: createdOrderId,
            amount: debitedWalletPaise,
            type: "failed_order_restore",
            status: "available",
            note: `Wallet restored after failed order #${createdOrderId}`,
            idempotencyKey: `order:${createdOrderId}:wallet-return`,
          }).onConflictDoNothing();
        }
        await db.update(orders).set({ status: "failed" }).where(eq(orders.id, createdOrderId));
      } catch {}
    }
    return Response.json({ error: "Unable to place your order right now." }, { status: 500 });
  }
}
