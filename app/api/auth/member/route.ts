import { createMemberSession, memberCookieOptions } from "../../../auth";
import { signInNameAndPhone } from "../../_lib/account";
import { captureEmailContact, normalizeContactEmail } from "../../_lib/email-contacts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { name?: string; phone?: string; email?: string };
  const email = normalizeContactEmail(body.email);
  if (body.email && !email) return Response.json({ message: "Enter a valid email address or leave it blank." }, { status: 400 });
  const customer = await signInNameAndPhone(String(body.name || ""), String(body.phone || ""));
  if (!customer) return Response.json({ message: "Enter your full name and a valid Indian mobile number." }, { status: 400 });
  if (email) await captureEmailContact(email, "account");
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `pr_member=${await createMemberSession(customer.id)}; Path=/; Max-Age=${memberCookieOptions.maxAge}; HttpOnly; SameSite=Lax${memberCookieOptions.secure ? "; Secure" : ""}`);
  return response;
}
