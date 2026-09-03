import { normalizeIndianPhone } from "../../../_lib/account";
import { createSupabaseServerClient } from "../../../../supabase/server";

type Body = { phone?: string; name?: string; intent?: "register" | "login" };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Body;
  const phone = normalizeIndianPhone(String(body.phone || ""));
  const intent = body.intent === "register" ? "register" : "login";
  const name = String(body.name || "").trim().replace(/\s+/g, " ").slice(0, 120);
  if (!phone) return Response.json({ message: "Enter a valid Indian mobile number." }, { status: 400 });
  if (intent === "register" && name.length < 2) return Response.json({ message: "Enter your full name." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: intent === "register",
      data: intent === "register" ? { full_name: name } : undefined,
    },
  });
  if (error) return Response.json({ message: error.message }, { status: 400 });
  return Response.json({ sent: true, phone });
}
