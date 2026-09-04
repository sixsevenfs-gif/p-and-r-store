import { cookies } from "next/headers";

export function appEnv(name: string) { return process.env[name]; }
export type AuthSession = { user: { id: string; email: string; phone: string; name: string } };
export type AdminPhoneSession = { phone: string };

const memberCookie = "pr_member";
const adminCookie = "pr_admin";
const sessionLifetime = 60 * 60 * 24 * 30;

async function signature(value: string) {
  const secret = process.env.MEMBER_SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createSignedSession(value: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetime;
  const payload = `${value}.${expiresAt}`;
  return `${payload}.${await signature(payload)}`;
}

async function readSignedSession(cookieName: string) {
  const token = (await cookies()).get(cookieName)?.value || "";
  const [value, expiresAt, receivedSignature, extra] = token.split(".");
  const expiry = Number(expiresAt);
  if (!value || extra || !Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;
  const expected = await signature(`${value}.${expiry}`);
  if (!expected || expected.length !== receivedSignature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index++) mismatch |= expected.charCodeAt(index) ^ receivedSignature.charCodeAt(index);
  return mismatch === 0 ? value : null;
}

export const memberCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionLifetime };
export const adminCookieOptions = memberCookieOptions;
export async function createMemberSession(customerId: number) { return createSignedSession(String(customerId)); }
export async function createAdminSession(phone: string) { return createSignedSession(phone.replace(/\D/g, "")); }

/** Customer sessions are independent from Supabase email/phone Auth. */
export async function getAuthSession(request?: Request): Promise<AuthSession | null> {
  void request;
  const value = await readSignedSession(memberCookie);
  const customerId = Number(value);
  return Number.isInteger(customerId) && customerId > 0 ? { user: { id: `member:${customerId}`, email: "", phone: "", name: "P&R Member" } } : null;
}

function normalizedPhones(value: string | undefined) {
  return new Set((value || "").split(",").map((item) => item.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, "")).filter((item) => /^[6-9]\d{9}$/.test(item)));
}

export function isConfiguredAdminPhone(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) && normalizedPhones(process.env.ADMIN_PHONE_NUMBERS).has(digits);
}

export async function getAdminPhoneSession(): Promise<AdminPhoneSession | null> {
  const digits = await readSignedSession(adminCookie);
  return digits && isConfiguredAdminPhone(digits) ? { phone: `+91${digits.replace(/^91/, "")}` } : null;
}

export function clearAuthCookies() {
  return ["pr_member=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax", "pr_admin=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"];
}

export function safeReturnPath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
