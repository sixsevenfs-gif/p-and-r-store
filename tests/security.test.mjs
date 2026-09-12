import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function load(path) {
  const text = await readFile(new URL(path, import.meta.url), "utf8");
  const js = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}
const session = await load("../app/session-token.ts");
const image = await load("../app/image-signature.ts");
const identity = { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", phone: "+919876543210", customerId: 42 };

test("verified sessions reject tampering, old tokens, wrong purposes and expiry", () => {
  const previous = process.env.MEMBER_SESSION_SECRET;
  process.env.MEMBER_SESSION_SECRET = "test-only-not-a-deployment-secret-123456789";
  try {
    const token = session.signSession(identity, "member", 60);
    assert.equal(session.verifySession(token, "member").customerId, 42);
    assert.equal(session.verifySession(token, "admin"), null);
    assert.equal(session.verifySession(token + "tampered", "member"), null);
    assert.equal(session.verifySession(token + ".", "member"), null);
    assert.equal(session.verifySession("42.9999999999.legacy", "member"), null);
    assert.equal(session.verifySession("42.9999999999", "member"), null);
    assert.equal(session.verifySession(session.signSession(identity, "member", -1), "member"), null);
    assert.equal(session.verifySession(session.signSession({ ...identity, customerId: -1 }, "member", 60), "member"), null);
    delete process.env.MEMBER_SESSION_SECRET;
    assert.throws(() => session.signSession(identity, "member", 60));
    assert.equal(session.verifySession(token, "member"), null);
  } finally {
    if (previous === undefined) delete process.env.MEMBER_SESSION_SECRET;
    else process.env.MEMBER_SESSION_SECRET = previous;
  }
});

test("media signatures reject SVG/HTML disguised as product images", () => {
  assert.equal(image.imageMime(Buffer.from('<svg onload="alert(1)">')), null);
  assert.equal(image.imageMime(Buffer.from("<html>not a jpg</html>")), null);
  assert.equal(image.imageMime(Buffer.from("89504e470d0a1a0a00000000", "hex")), "image/png");
  assert.equal(image.imageMime(Buffer.from("ffd8ffe00000000000000000", "hex")), "image/jpeg");
  assert.equal(image.imageMime(Buffer.from("RIFF0000WEBP")), "image/webp");
});

test("member and admin forms sign in directly without OTP fields", async () => {
  const [member, admin, login] = await Promise.all([
    readFile(new URL("../app/phone-auth-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin-auth-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/_lib/phone-login.ts", import.meta.url), "utf8"),
  ]);
  for (const source of [member, admin]) {
    assert.doesNotMatch(source, /needsCode|one-time-code|verification code/i);
  }
  assert.doesNotMatch(login, /signInWithOtp|verifyOtp|NEXT_PUBLIC_SUPABASE/);
  assert.match(login, /signInNameAndPhone/);
});

async function loadWithDatabase(path, database) {
  const source = (await readFile(new URL(path, import.meta.url), "utf8"))
    .replace('import { env } from "@/db/runtime";', 'const env = { DB: globalThis.__creditTestDB };');
  globalThis.__creditTestDB = database;
  try {
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    return await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}#${crypto.randomUUID()}`);
  } finally { delete globalThis.__creditTestDB; }
}

test("refund credit counts only collected money and remains idempotent across cancellation and late capture", async () => {
  const order = { customer_id: 42, wallet_amount: 2000, payable_amount: 8000, payment_status: "pending", paid_at: null };
  let credited = 0;
  const entries = [];
  const database = { prepare(sql) {
    let values;
    return {
      bind(...args) { values = args; return this; },
      async first() { return sql.includes("FROM orders") ? { ...order } : { amount: credited }; },
      async run() { entries.push(values); credited += values[2]; },
    };
  } };
  const { returnOrderCredit } = await loadWithDatabase("../app/api/_lib/order-credit.ts", database);
  assert.equal(await returnOrderCredit(1), 2000, "unpaid COD only returns the wallet debit");
  assert.equal(await returnOrderCredit(1), 0, "a repeated cancellation cannot credit twice");
  order.payment_status = "paid";
  order.paid_at = 1234;
  assert.equal(await returnOrderCredit(1), 8000, "late capture credits only the remaining collected money");
  order.payment_status = "refunded";
  assert.equal(await returnOrderCredit(1), 0, "another refund path cannot duplicate credit");
  assert.equal(credited, 10000);
  assert.equal(entries.length, 2);
  assert.notEqual(entries[0][4], entries[1][4]);
});
