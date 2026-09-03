import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";

export function appEnv(name: string) {
  return process.env[name];
}

export type AuthSession = {
  user: { id: string; email: string; phone: string; name: string };
};

const memberCookie = "pr_member";
const sessionLifetime = 60 * 60 * 24 * 30;

async function memberSignature(value: string) {
  const secret = process.env.MEMBER_SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createMemberSession(customerId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetime;
  const payload = `${customerId}.${expiresAt}`;
  return `${payload}.${await memberSignature(payload)}`;
}

async function readMemberSession() {
  const token = (await cookies()).get(memberCookie)?.value || "";
  const [id, expiresAt, signature, extra] = token.split(".");
  const customerId = Number(id), expiry = Number(expiresAt);
  if (extra || !Number.isInteger(customerId) || customerId < 1 || !Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;
  const expected = await memberSignature(`${customerId}.${expiry}`);
  if (!expected || expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index++) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0 ? customerId : null;
}

export const memberCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionLifetime };

/** Validate the access token with Supabase before protected data is used. */
export async function getAuthSession(request?: Request): Promise<AuthSession | null> {
  void request;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user && (user.email || user.phone)) {
      const email = user.email || "";
      const phone = user.phone || "";
      return { user: { id: user.id, email, phone, name: String(user.user_metadata?.full_name || user.user_metadata?.name || phone || email.split("@")[0]) } };
    }
  } catch {
    // Customer member sessions remain usable during a Supabase Auth outage.
  }
  const memberId = await readMemberSession();
  return memberId ? { user: { id: `member:${memberId}`, email: "", phone: "", name: "P&R Member" } } : null;
}

export function safeReturnPath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
