import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { env } from "@/db/runtime";
import { sessionSecret } from "@/app/session-token";
import { createAdminSession, createMemberSession, isConfiguredAdminPhone, memberCookieOptions } from "@/app/auth";
import { ensureCustomerForUser, normalizeIndianPhone, recordPhoneLogin } from "./account";
import { captureEmailContact, normalizeContactEmail } from "./email-contacts";

async function limited(key: string, maximum: number) {
  const bucket = createHash("sha256").update(key).digest("hex");
  const row = await env.DB.prepare(`INSERT INTO auth_rate_limits(bucket,window_start,attempts)
    VALUES (?,unixepoch(),1) ON CONFLICT(bucket) DO UPDATE SET
    attempts=CASE WHEN auth_rate_limits.window_start < unixepoch()-900 THEN 1 ELSE auth_rate_limits.attempts+1 END,
    window_start=CASE WHEN auth_rate_limits.window_start < unixepoch()-900 THEN unixepoch() ELSE auth_rate_limits.window_start END
    RETURNING attempts`).bind(bucket).first<{ attempts: number }>();
  return !row || row.attempts > maximum;
}

export async function phoneLogin(request: Request, purpose: "member" | "admin") {
  try {
    sessionSecret(); // Fail closed before sending SMS if session signing is unavailable.
    if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ message: "JSON required." }, { status: 415 });
    const text = await request.text();
    if (text.length > 4096) return Response.json({ message: "Request too large." }, { status: 413 });
    const body = JSON.parse(text);
    const phone = normalizeIndianPhone(String(body.phone || ""));
    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    const code = String(body.code || "");
    const email = normalizeContactEmail(body.email);
    if (!/^\+91[6-9]\d{9}$/.test(phone) || !name || name.length > 120 || (code && !/^\d{6}$/.test(code)) || (body.email && !email)) {
      return Response.json({ message: "Enter a valid name, Indian mobile number and six-digit code." }, { status: 400 });
    }
    if (purpose === "admin" && !isConfiguredAdminPhone(phone)) return Response.json({ message: "Admin access is not available for this number." }, { status: 403 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("OTP configuration missing");
    // Shared PostgreSQL counters work across workers/redeploys. Never log raw PII.
    if (await limited(`phone:${phone}:${code ? "verify" : "send"}`, code ? 10 : 4)) return Response.json({ message: "Too many attempts. Please wait 15 minutes." }, { status: 429 });
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) } });
    if (!code) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return Response.json({ message: "Unable to send a verification code. Try again later." }, { status: 503 });
      return Response.json({ needsCode: true, message: "Enter the verification code sent to your mobile." });
    }
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
    if (error || !data.user || normalizeIndianPhone(data.user.phone || "") !== phone) return Response.json({ message: "Invalid or expired verification code." }, { status: 401 });
    const identity = { id: data.user.id, phone };
    const token = purpose === "admin" ? await createAdminSession(identity) : await env.DB.transaction(async () => {
      await env.DB.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?,0))").bind(`login:${phone}`).all();
      const customer = await ensureCustomerForUser({ ...identity, email: "", name });
      if (!customer || customer.status !== "active") throw new Error("Account unavailable");
      await recordPhoneLogin(customer.id, { ...identity, email: "", name });
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
