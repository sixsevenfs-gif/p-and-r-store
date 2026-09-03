import { createMemberSession, memberCookieOptions } from "../../../auth";
import { signInNameAndPhone } from "../../_lib/account";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { name?: string; phone?: string };
  const customer = await signInNameAndPhone(String(body.name || ""), String(body.phone || ""));
  if (!customer) return Response.json({ message: "Enter your full name and a valid Indian mobile number." }, { status: 400 });
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `pr_member=${await createMemberSession(customer.id)}; Path=/; Max-Age=${memberCookieOptions.maxAge}; HttpOnly; SameSite=Lax${memberCookieOptions.secure ? "; Secure" : ""}`);
  return response;
}
