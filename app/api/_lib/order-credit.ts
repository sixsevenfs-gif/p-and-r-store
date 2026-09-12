import { env } from "@/db/runtime";

/** Call only inside the commerce transaction. Amounts are always integer paise.
 * A cancelled unpaid COD order only returns wallet money actually debited. */
export async function returnOrderCredit(orderId: number) {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id=? FOR UPDATE").bind(orderId).first<Record<string, unknown>>();
  if (!order) throw new Error("Order not found");
  const paid = order.payment_status === "paid" || Boolean(order.paid_at);
  const entitlement = Number(order.wallet_amount || 0) + (paid ? Number(order.payable_amount || 0) : 0);
  const credited = await env.DB.prepare(`SELECT coalesce(sum(amount),0) amount FROM wallet_ledger WHERE order_id=? AND amount>0
    AND (idempotency_key IN (?,?,?) OR type='order_credit_return')`).bind(orderId, `order:${orderId}:wallet-return`, `return-refund:${orderId}`, `order:${orderId}:credit-return`).first<{amount: number}>();
  const amount = Math.max(0, entitlement - Number(credited?.amount || 0));
  if (!Number.isSafeInteger(amount)) throw new Error("Invalid refund amount");
  if (amount) await env.DB.prepare(`INSERT INTO wallet_ledger(customer_id,order_id,amount,type,status,note,idempotency_key)
    VALUES (?,?,?,'order_credit_return','available',?,?) ON CONFLICT(idempotency_key) DO NOTHING`)
    .bind(order.customer_id, orderId, amount, `Credit returned for order #${orderId}`, `order:${orderId}:credit-return:${entitlement}`).run();
  return amount;
}
