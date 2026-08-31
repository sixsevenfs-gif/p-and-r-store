import { getAuthSession } from "../../auth";
import { createSupabaseServerClient } from "../../supabase/server";

export type AdminIdentity = { userId: string; email: string; role: "SUPER_ADMIN" | "ADMIN" };
const normalize = (email: string) => email.trim().toLowerCase();

export async function roleForUser(user: { id: string; email: string }): Promise<AdminIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("admin_users").select("role,status").eq("user_id", user.id).maybeSingle();
  if (error || !data || data.status !== "active" || !["SUPER_ADMIN", "ADMIN"].includes(data.role)) return null;
  return { userId: user.id, email: normalize(user.email), role: data.role as AdminIdentity["role"] };
}

export async function requireAdmin(request?: Request): Promise<AdminIdentity | null> {
  const session = await getAuthSession(request);
  return session?.user ? roleForUser(session.user) : null;
}
