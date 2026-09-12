import { cookies } from "next/headers";
import { signSession, verifySession, type VerifiedIdentity } from "./session-token";
export function appEnv(name: string) { return process.env[name]; }
export type AuthSession = { user: { id: string; email: string; phone: string; name: string }; customerId: number };
export type AdminPhoneSession = { phone: string; userId: string };
const lifetime = 60 * 60 * 8;
async function read(purpose: "member" | "admin", request?: Request) {
  const name = `pr_${purpose}`;
  const token = request ? (request.headers.get("cookie") || "").split(/;\s*/).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) : (await cookies()).get(name)?.value;
  return verifySession(token || "", purpose);
}
export const memberCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: lifetime };
export const adminCookieOptions = memberCookieOptions;
export async function createMemberSession(identity: VerifiedIdentity) { return signSession(identity, "member", lifetime); }
export async function createAdminSession(identity: VerifiedIdentity) { return signSession(identity, "admin", lifetime); }
export async function getAuthSession(request?: Request): Promise<AuthSession | null> {
  const identity = await read("member", request);
  return identity ? { user: { id: identity.id, phone: identity.phone, email: "", name: "P&R Member" }, customerId: identity.customerId! } : null;
}
export function isConfiguredAdminPhone(rawPhone: string) {
  const normalize = (value: string) => value.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, "");
  const phone = normalize(rawPhone);
  return /^[6-9]\d{9}$/.test(phone) && (process.env.ADMIN_PHONE_NUMBERS || "").split(",").map(normalize).includes(phone);
}
export async function getAdminPhoneSession(request?: Request): Promise<AdminPhoneSession | null> {
  const identity = await read("admin", request);
  return identity && isConfiguredAdminPhone(identity.phone) ? { phone: identity.phone, userId: identity.id } : null;
}
export function clearAuthCookies() {
  return ["pr_member", "pr_admin"].map(name => `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}
export function safeReturnPath(value: string | null | undefined, fallback = "/account") {
  return value && value.startsWith("/") && !value.startsWith("//") && !/[\\\x00-\x1f]/.test(value) ? value : fallback;
}
