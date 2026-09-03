import { ensureCustomerForUser, normalizeIndianPhone, recordPhoneLogin } from "../../../_lib/account";
import { createSupabaseServerClient } from "../../../../supabase/server";

type Body = { phone?: string; token?: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Body;
  const phone = normalizeIndianPhone(String(body.phone || ""));
  const token = String(body.token || "").trim();
  if (!phone || !/^\d{6,8}$/.test(token)) return Response.json({ message: "Enter the mobile number and OTP sent to it." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user) return Response.json({ message: error?.message || "That OTP is invalid or has expired." }, { status: 401 });

  const customer = await ensureCustomerForUser({
    id: data.user.id,
    email: data.user.email || "",
    phone: data.user.phone || phone,
    name: String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || "P&R Member"),
  });
  if (!customer) return Response.json({ message: "Your member profile could not be created." }, { status: 500 });
  await recordPhoneLogin(customer.id, { id: data.user.id, email: data.user.email || "", phone: data.user.phone || phone, name: String(data.user.user_metadata?.full_name || "P&R Member") });
  return Response.json({ verified: true, customerId: customer.id });
}
