import { createSupabaseServerClient } from "./supabase/server";

export function appEnv(name: string) {
  return process.env[name];
}

export type AuthSession = {
  user: { id: string; email: string; phone: string; name: string };
};

/** Validate the access token with Supabase before protected data is used. */
export async function getAuthSession(request?: Request): Promise<AuthSession | null> {
  void request;
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || (!user.email && !user.phone)) return null;
  const email = user.email || "";
  const phone = user.phone || "";
  return {
    user: {
      id: user.id,
      email,
      phone,
      name: String(user.user_metadata?.full_name || user.user_metadata?.name || phone || email.split("@")[0]),
    },
  };
}

export function safeReturnPath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
