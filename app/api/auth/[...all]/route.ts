import { createSupabaseServerClient } from "../../../supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ all: string[] }> }) {
  const { all } = await params;
  const action = all.join("/");
  const supabase = await createSupabaseServerClient();

  if (action === "sign-out") {
    const { error } = await supabase.auth.signOut();
    const response = error ? Response.json({ message: error.message }, { status: 400 }) : Response.json({ ok: true });
    response.headers.append("Set-Cookie", "pr_member=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    return response;
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return Response.json({ message: "Email and password are required." }, { status: 400 });

  if (action === "sign-up/email") {
    const name = String(body.name || "").trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: new URL("/account", request.url).toString() },
    });
    if (error) return Response.json({ message: error.message }, { status: 400 });
    return Response.json({ user: data.user, requiresEmailConfirmation: !data.session });
  }

  if (action === "sign-in/email") {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return Response.json({ message: error.message }, { status: 401 });
    return Response.json({ user: data.user });
  }

  return Response.json({ message: "Unknown authentication action." }, { status: 404 });
}
