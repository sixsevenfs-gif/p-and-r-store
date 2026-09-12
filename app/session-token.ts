import { createHmac, timingSafeEqual } from "node:crypto";

export type VerifiedIdentity = { id: string; phone: string; customerId?: number };
export function sessionSecret() {
  const secret = process.env.MEMBER_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("A dedicated MEMBER_SESSION_SECRET of at least 32 characters is required");
  return secret;
}
export function signSession(identity: VerifiedIdentity, purpose: "member" | "admin", lifetime: number) {
  const payload = Buffer.from(JSON.stringify({ ...identity, purpose, exp: Math.floor(Date.now() / 1000) + lifetime })).toString("base64url");
  return `v2.${payload}.${createHmac("sha256", sessionSecret()).update(`v2.${payload}`).digest("base64url")}`;
}
export function verifySession(token: string, purpose: "member" | "admin"): VerifiedIdentity | null {
  try {
    const parts = token.split(".");
    const [version, payload, signature] = parts;
    if (version !== "v2" || !payload || !signature || parts.length !== 3 || token.length > 2048) return null;
    const expected = createHmac("sha256", sessionSecret()).update(`v2.${payload}`).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.purpose !== purpose || !Number.isSafeInteger(data.exp) || data.exp <= Date.now() / 1000
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)
      || !/^\+91[6-9]\d{9}$/.test(data.phone)) return null;
    if (purpose === "member" && (!Number.isSafeInteger(data.customerId) || data.customerId <= 0)) return null;
    return data;
  } catch { return null; }
}
