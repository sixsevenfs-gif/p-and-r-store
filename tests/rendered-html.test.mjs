import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps the premium hero and exposes the complete account surface", async () => {
  const [page, styles] = await Promise.all([read("../app/page.tsx"), read("../app/globals.css")]);
  assert.match(page, /className="hero"/);
  assert.match(page, /Oversized<br\/>Essentials/);
  assert.match(page, /Create account/);
  assert.match(page, /\/login\?next=/);
  assert.match(page, /Profile updated/);
  assert.match(page, /SAVED ADDRESSES/);
  assert.match(page, /TRANSACTION HISTORY/);
  assert.doesNotMatch(page, /api\/auth\/sign-out/);
  assert.match(page, /goWishlist/);
  assert.match(page, /standalone/);
  assert.match(styles, /\.nav-right>button:first-child\{display:flex!important\}/);
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

test("preserves product images and stores restorable revisions", async () => {
  const [editor, productsApi, migration] = await Promise.all([
    read("../app/admin/product-editor.tsx"),
    read("../app/api/admin/products/route.ts"),
    read("../supabase/migrations/0006_product_revisions.sql"),
  ]);
  assert.match(editor, /Restore previous/);
  assert.match(editor, /Product saved successfully/);
  assert.match(productsApi, /INSERT INTO product_revisions/);
  assert.match(productsApi, /revision.*latest/);
  assert.match(productsApi, /value\.startsWith\("\/products\/"\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS product_revisions/);
});

test("credits completed return refunds to the P&R wallet once", async () => {
  const [ordersAdmin, orderManager] = await Promise.all([
    read("../app/api/admin/orders/route.ts"),
    read("../app/admin/order-manager.tsx"),
  ]);
  assert.match(ordersAdmin, /'return_refund','available'/);
  assert.match(ordersAdmin, /return-refund:\$\{orderId\}/);
  assert.match(ordersAdmin, /ON CONFLICT\(idempotency_key\) DO NOTHING/);
  assert.match(ordersAdmin, /Refund added to P&R Wallet/);
  assert.match(orderManager, /P&R Wallet/);
});

test("keeps a Unique Find secured through a mobile checkout", async () => {
  const [reservation, reserveRoute, orders, page] = await Promise.all([
    read("../app/api/_lib/unique-finds.ts"),
    read("../app/api/unique-finds/reserve/route.ts"),
    read("../app/api/orders/route.ts"),
    read("../app/page.tsx"),
  ]);
  assert.match(reservation, /45 \* 60/);
  assert.match(reserveRoute, /SET expires_at=\?/);
  assert.match(orders, /checkoutRecoveredHolds/);
  assert.match(page, /Build your rotation/);
});

test("offers a complete customer-support complaint form", async () => {
  const contact = await read("../app/contact/page.tsx");
  assert.match(contact, /support@pnr\.com/);
  assert.match(contact, /Complaint/);
  assert.match(contact, /mailto:/);
  assert.match(contact, /Order number/);
});

test("keeps mobile product and campaign actions reachable", async () => {
  const [page, styles, uniqueStyles] = await Promise.all([
    read("../app/page.tsx"), read("../app/globals.css"), read("../app/unique-finds.css"),
  ]);
  assert.match(page, /mobile-gallery-close/);
  assert.match(page, /close=\{\(\) => go\("collection"\)\}/);
  assert.match(styles, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(uniqueStyles, /inset:0;width:100%;height:100%/);
});
