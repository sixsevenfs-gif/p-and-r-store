import { and, eq, sql } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { customers, referralConfig, referrals } from "../../../db/schema";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function requireApiCustomer() {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const email = normalizeEmail(identity.email);
  const db = getDb();
  let customer = await db.select().from(customers).where(eq(customers.email, email)).get();
  if (!customer) {
    const names = (identity.fullName ?? "").trim().split(/\s+/);
    const referralCode = await uniqueReferralCode(email);
    await db.insert(customers).values({
      email,
      firstName: names[0] || "P&R",
      lastName: names.slice(1).join(" ") || "Member",
      referralCode,
    });
    customer = await db.select().from(customers).where(eq(customers.email, email)).get();
  }
  return customer ?? null;
}

export async function attachReferral(customerId: number, code: string | null | undefined) {
  const clean = code?.trim().toUpperCase();
  if (!clean) return;
  const db = getDb();
  const customer = await db.select().from(customers).where(eq(customers.id, customerId)).get();
  if (!customer || customer.referredByCustomerId) return;
  const referrer = await db.select().from(customers).where(eq(customers.referralCode, clean)).get();
  if (!referrer || referrer.id === customer.id || referrer.email === customer.email) return;
  const existing = await db.select().from(referrals).where(eq(referrals.referredCustomerId, customer.id)).get();
  if (existing) return;
  const config = await ensureReferralConfig();
  if (!config.enabled) return;
  await db.batch([
    db.update(customers).set({ referredByCustomerId: referrer.id, updatedAt: new Date() }).where(and(eq(customers.id, customer.id), sql`${customers.referredByCustomerId} IS NULL`)),
    db.insert(referrals).values({ referrerCustomerId: referrer.id, referredCustomerId: customer.id, rewardAmount: config.rewardAmount, status: "registered" }),
  ]);
}

export async function ensureReferralConfig() {
  const db = getDb();
  await db.insert(referralConfig).values({ id: 1 }).onConflictDoNothing();
  return (await db.select().from(referralConfig).where(eq(referralConfig.id, 1)).get())!;
}

export function isAdmin(email: string) {
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map(normalizeEmail).filter(Boolean);
  return allowed.includes(normalizeEmail(email));
}

async function uniqueReferralCode(email: string) {
  const db = getDb();
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase() || "PR";
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 7).toUpperCase();
    const code = `${base}${suffix}`;
    const found = await db.select({ id: customers.id }).from(customers).where(eq(customers.referralCode, code)).get();
    if (!found) return code;
  }
  return `PR${Date.now().toString(36).toUpperCase()}`;
}
