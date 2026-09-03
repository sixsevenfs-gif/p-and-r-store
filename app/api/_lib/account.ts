import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, referralConfig, referrals } from "../../../db/schema";
import { getAuthSession } from "../../auth";
import { env } from "../../../db/runtime";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeIndianPhone(value: string) {
  const raw = value.trim();
  if (raw.startsWith("+")) {
    const phone = `+${raw.slice(1).replace(/\D/g, "")}`;
    return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : "";
  }
  const digits = raw.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return "";
}

function memberEmailForPhone(phone: string) {
  return `phone-${phone.replace(/\D/g, "")}@members.invalid`;
}

type MemberUser = { id: string; email: string; phone: string; name: string };

export async function ensureCustomerForUser(user: MemberUser) {
  const db = getDb();
  const phone = normalizeIndianPhone(user.phone);
  const email = normalizeEmail(user.email);
  let customer = await db.select().from(customers).where(eq(customers.authUserId, user.id)).get();
  if (!customer && phone) customer = await db.select().from(customers).where(eq(customers.phone, phone)).get();
  if (!customer && email) customer = await db.select().from(customers).where(eq(customers.email, email)).get();
  if (!customer) {
    const names = user.name.trim().split(/\s+/);
    const identity = phone || email || user.id;
    await db.insert(customers).values({
      authUserId: user.id,
      // The column is retained for legacy orders; it is never shown for phone members.
      email: email || memberEmailForPhone(phone),
      firstName: names[0] || "P&R",
      lastName: names.slice(1).join(" ") || "Member",
      address: "",
      city: "",
      pinCode: "",
      phone,
      authProvider: phone ? "phone_otp" : "supabase_email",
      referralCode: await uniqueReferralCode(identity),
    });
    customer = await db.select().from(customers).where(eq(customers.authUserId, user.id)).get();
  } else if (customer.authUserId !== user.id) {
    await db.update(customers).set({
      authUserId: user.id,
      authProvider: phone ? "phone_otp" : "supabase_email",
      phone: phone || customer.phone,
      updatedAt: new Date(),
    }).where(eq(customers.id, customer.id));
    customer = await db.select().from(customers).where(eq(customers.id, customer.id)).get();
  }
  return customer ?? null;
}

export async function recordPhoneLogin(customerId: number, user: MemberUser) {
  const phone = normalizeIndianPhone(user.phone);
  if (!phone) return;
  await env.DB.batch([
    env.DB.prepare("UPDATE customers SET last_login_at=unixepoch(),updated_at=unixepoch() WHERE id=?").bind(customerId),
    env.DB.prepare("INSERT INTO customer_login_events(customer_id,auth_user_id,phone) VALUES (?,?,?)").bind(customerId, user.id, phone),
  ]);
}

export async function requireApiCustomer(request?: Request) {
  const session = await getAuthSession(request);
  if (!session?.user) return null;
  return ensureCustomerForUser(session.user);
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
