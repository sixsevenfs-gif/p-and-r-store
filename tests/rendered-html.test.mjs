import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps the premium hero and exposes the complete account surface", async () => {
  const page = await read("../app/page.tsx");
  assert.match(page, /className="hero"/);
  assert.match(page, /Oversized<br\/>Essentials/);
  assert.match(page, /Create account/);
  assert.match(page, /\/login\?next=/);
  assert.match(page, /Profile updated/);
  assert.match(page, /SAVED ADDRESSES/);
  assert.match(page, /TRANSACTION HISTORY/);
  assert.match(page, /api\/auth\/sign-out/);
});

test("persists referral and wallet state in relational records", async () => {
  const [schema, migration, ordersApi, adminApi] = await Promise.all([
    read("../db/schema.ts"),
    read("../drizzle/0001_silent_lily_hollister.sql"),
    read("../app/api/orders/route.ts"),
    read("../app/api/admin/referrals/route.ts"),
  ]);
  for (const table of ["referrals", "wallet_ledger", "referral_config", "wishlists", "addresses"]) {
    assert.match(migration, new RegExp(`CREATE TABLE \\\`${table}\\\``));
  }
  assert.match(schema, /idempotencyKey/);
  assert.match(schema, /referredByCustomerId/);
  assert.match(ordersApi, /Sign in to use wallet credit/);
  assert.match(adminApi, /mark-paid/);
  assert.match(adminApi, /refund-order/);
  assert.match(adminApi, /reversal/);
});

test("protects customer and admin APIs with server-side identity", async () => {
  const [account, wishlist, addresses, admin, wallet] = await Promise.all([
    read("../app/api/account/route.ts"),
    read("../app/api/account/wishlist/route.ts"),
    read("../app/api/account/addresses/route.ts"),
    read("../app/api/admin/referrals/route.ts"),
    read("../app/api/wallet/route.ts"),
  ]);
  assert.match(account, /requireApiCustomer/);
  assert.match(wishlist, /requireApiCustomer/);
  assert.match(addresses, /requireApiCustomer/);
  assert.match(admin, /Admin access required/);
  assert.match(wallet, /requireApiCustomer/);
  assert.match(wallet, /recentTransactions/);
});

test("keeps wallet checkout bounded and idempotent", async () => {
  const [page, orders, migration] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/api/orders/route.ts"),
    read("../drizzle/0003_glossy_eternity.sql"),
  ]);
  assert.match(page, /Wallet Applied/);
  assert.match(page, /Amount to use/);
  assert.match(page, /pr-checkout-session/);
  assert.match(orders, /checkoutKey/);
  assert.match(orders, /ON CONFLICT\(idempotency_key\) DO NOTHING/);
  assert.match(orders, /balanceRupees/);
  assert.match(orders, /walletAmount \* 100/);
  assert.match(migration, /orders_checkout_key_unique/);
});
