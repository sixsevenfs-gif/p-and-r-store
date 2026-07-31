import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { customers, orders, referralConfig, referrals, walletLedger } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureReferralConfig, isAdmin } from "../../_lib/account";

async function requireAdmin() {
  const user = await getChatGPTUser();
  return user && isAdmin(user.email) ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  const db = getDb();
  const [config, records] = await Promise.all([
    ensureReferralConfig(),
    db.select().from(referrals).orderBy(sql`${referrals.createdAt} desc`).limit(200),
  ]);
  return Response.json({ config, referrals: records });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  const payload = await request.json() as { action?: string; referralId?: number; rewardAmount?: number; autoApprove?: boolean; enabled?: boolean; orderId?: number; paymentReference?: string };
  const db = getDb();

  if (payload.action === "configure") {
    const rewardAmount = Math.min(100000, Math.max(0, Math.floor(Number(payload.rewardAmount) || 10000)));
    await db.insert(referralConfig).values({ id: 1, rewardAmount, autoApprove: payload.autoApprove ?? true, enabled: payload.enabled ?? true })
      .onConflictDoUpdate({ target: referralConfig.id, set: { rewardAmount, autoApprove: payload.autoApprove ?? true, enabled: payload.enabled ?? true, updatedAt: new Date() } });
    return Response.json({ updated: true });
  }

  if (payload.action === "mark-paid") {
    const orderId = Number(payload.orderId);
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order || order.status === "refunded" || order.status === "cancelled") return Response.json({ error: "Order is not eligible." }, { status: 400 });
    const customer = await db.select().from(customers).where(eq(customers.id, order.customerId)).get();
    await db.update(orders).set({ status: "paid", paidAt: new Date(), paymentReference: payload.paymentReference?.slice(0, 100) ?? null }).where(eq(orders.id, orderId));
    if (customer && !customer.firstPaidAt && customer.referredByCustomerId) {
      const referral = await db.select().from(referrals).where(and(eq(referrals.referredCustomerId, customer.id), eq(referrals.status, "registered"))).get();
      const config = await ensureReferralConfig();
      if (referral && config.enabled) {
        const status = config.autoApprove ? "available" : "pending";
        await db.batch([
          db.update(customers).set({ firstPaidAt: new Date() }).where(and(eq(customers.id, customer.id), sql`${customers.firstPaidAt} IS NULL`)),
          db.update(referrals).set({ qualifyingOrderId: order.id, status: config.autoApprove ? "approved" : "pending", approvedAt: config.autoApprove ? new Date() : null }).where(eq(referrals.id, referral.id)),
          db.insert(walletLedger).values({ customerId: referral.referrerCustomerId, referralId: referral.id, orderId: order.id, amount: referral.rewardAmount, type: "referral_reward", status, note: `Referral reward for order #${order.id}`, idempotencyKey: `referral:${referral.id}:reward` }).onConflictDoNothing(),
        ]);
      }
    }
    return Response.json({ updated: true });
  }

  if (payload.action === "cancel-order" || payload.action === "refund-order") {
    const orderId = Number(payload.orderId);
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    const nextStatus = payload.action === "refund-order" ? "refunded" : "cancelled";
    await db.update(orders).set(nextStatus === "refunded" ? { status: nextStatus, refundedAt: new Date() } : { status: nextStatus, cancelledAt: new Date() }).where(eq(orders.id, order.id));
    if (order.walletAmount > 0) {
      await db.insert(walletLedger).values({ customerId: order.customerId, orderId: order.id, amount: order.walletAmount, type: "refund", status: "available", note: `Wallet returned for ${nextStatus} order #${order.id}`, idempotencyKey: `order:${order.id}:wallet-return` }).onConflictDoNothing();
    }
    const referral = await db.select().from(referrals).where(eq(referrals.qualifyingOrderId, order.id)).get();
    if (referral) {
      const reward = await db.select().from(walletLedger).where(and(eq(walletLedger.referralId, referral.id), eq(walletLedger.type, "referral_reward"))).get();
      await db.update(referrals).set({ status: "reversed", reversedAt: new Date() }).where(eq(referrals.id, referral.id));
      if (reward && reward.status === "available") {
        await db.insert(walletLedger).values({ customerId: reward.customerId, referralId: referral.id, orderId: order.id, amount: -reward.amount, type: "reversal", status: "available", note: `Referral reward reversed after order ${nextStatus}`, idempotencyKey: `referral:${referral.id}:reversal` }).onConflictDoNothing();
      }
      if (reward?.status === "pending") await db.update(walletLedger).set({ status: "reversed" }).where(eq(walletLedger.id, reward.id));
    }
    return Response.json({ updated: true });
  }

  const referralId = Number(payload.referralId);
  const referral = await db.select().from(referrals).where(eq(referrals.id, referralId)).get();
  if (!referral) return Response.json({ error: "Referral not found." }, { status: 404 });
  if (payload.action === "approve") {
    await db.batch([
      db.update(referrals).set({ status: "approved", approvedAt: new Date() }).where(eq(referrals.id, referral.id)),
      db.update(walletLedger).set({ status: "available" }).where(and(eq(walletLedger.referralId, referral.id), eq(walletLedger.status, "pending"))),
    ]);
    return Response.json({ approved: true });
  }
  if (payload.action === "reverse") {
    const entry = await db.select().from(walletLedger).where(and(eq(walletLedger.referralId, referral.id), eq(walletLedger.type, "referral_reward"))).get();
    if (entry && entry.status !== "reversed") {
      await db.batch([
        db.update(referrals).set({ status: "reversed", reversedAt: new Date() }).where(eq(referrals.id, referral.id)),
        ...(entry.status === "pending" ? [db.update(walletLedger).set({ status: "reversed" }).where(eq(walletLedger.id, entry.id))] : []),
        ...(entry.status === "available" ? [db.insert(walletLedger).values({ customerId: entry.customerId, referralId: referral.id, orderId: entry.orderId, amount: -entry.amount, type: "reversal", status: "available", note: "Referral reward reversed by admin", idempotencyKey: `referral:${referral.id}:reversal` }).onConflictDoNothing()] : []),
      ]);
    }
    return Response.json({ reversed: true });
  }
  return Response.json({ error: "Unsupported action." }, { status: 400 });
}
