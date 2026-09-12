import { createHash } from "node:crypto";
import { env } from "@/db/runtime";
import { sessionSecret } from "@/app/session-token";
import { createAdminSession, createMemberSession, isConfiguredAdminPhone, memberCookieOptions } from "@/app/auth";
import { normalizeIndianPhone, signInNameAndPhone } from "./account";
import { captureEmailContact, normalizeContactEmail } from "./email-contacts";

async function limited(key: string, maximum: number) {
  try {
    const bucket = createHash("sha256").update(key).digest("hex");
    const row = await env.DB.prepare(`INSERT INTO auth_rate_limits(bucket,window_start,attempts)
      VALUES (?,unixepoch(),1) ON CONFLICT(bucket) DO UPDATE SET
      attempts=CASE WHEN auth_rate_limits.window_start < unixepoch()-900 THEN 1 ELSE auth_rate_limits.attempts+1 END,
      window_start=CASE WHEN auth_rate_limits.window_start < unixepoch()-900 THEN unixepoch() ELSE auth_rate_limits.window_start END
      RETURNING attempts`).bind(bucket).first<{ attempts: number }>();
    return !row || row.attempts > maximum;
  } catch {
    // Login remains available before the optional rate-limit migration is applied.
    return false;
  }
}

function localIdentity(phone: string, purpose: "member" | "admin") {
  const hex = createHash("sha256").update(`p-and-r:${purpose}:${phone}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

export async function phoneLogin(request: Request, purpose: "member" | "admin") {
  try {
    sessionSecret();
    if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ message: "JSON required." }, { status: 415 });
    const text = await request.text();
    if (text.length > 4096) return Response.json({ message: "Request too large." }, { status: 413 });
    const body = JSON.parse(text);
    const phone = normalizeIndianPhone(String(body.phone || ""));
    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    const email = normalizeContactEmail(body.email);
    if (!/^\+91[6-9]\d{9}$/.test(phone) || !name || name.length > 120 || (body.email && !email)) {
      return Response.json({ message: "Enter a valid name and Indian mobile number." }, { status: 400 });
    }
    if (purpose === "admin" && !isConfiguredAdminPhone(phone)) return Response.json({ message: "Admin access is not available for this number." }, { status: 403 });
    if (await limited(`phone:${phone}:${purpose}`, 20)) return Response.json({ message: "Too many attempts. Please wait 15 minutes." }, { status: 429 });
    const identity = { id: localIdentity(phone, purpose), phone };
    const token = purpose === "admin" ? await createAdminSession(identity) : await env.DB.transaction(async () => {
      await env.DB.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?,0))").bind(`login:${phone}`).all();
      const customer = await signInNameAndPhone(name, phone, identity.id);
      if (!customer) throw new Error("Account unavailable");
      if (email) await captureEmailContact(email, "account");
      return createMemberSession({ ...identity, customerId: customer.id });
    });
    const response = Response.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    response.headers.append("Set-Cookie", `pr_${purpose}=${token}; Path=/; Max-Age=${memberCookieOptions.maxAge}; HttpOnly; SameSite=Lax${memberCookieOptions.secure ? "; Secure" : ""}`);
    return response;
  } catch {
    return Response.json({ message: "Secure sign-in is temporarily unavailable. Please contact support." }, { status: 503 });
  }
}
