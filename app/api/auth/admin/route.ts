import { adminCookieOptions, createAdminSession, isConfiguredAdminPhone } from "../../../auth";
import { normalizeIndianPhone } from "../../_lib/account";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { name?: string; phone?: string };
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const phone = normalizeIndianPhone(String(body.phone || ""));
  if (!name || !phone) return Response.json({ message: "Enter your name and a valid Indian mobile number." }, { status: 400 });
  if (!isConfiguredAdminPhone(phone)) return Response.json({ message: "This mobile number is not authorised for the admin panel." }, { status: 403 });
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `pr_admin=${await createAdminSession(phone)}; Path=/; Max-Age=${adminCookieOptions.maxAge}; HttpOnly; SameSite=Lax${adminCookieOptions.secure ? "; Secure" : ""}`);
  return response;
}
