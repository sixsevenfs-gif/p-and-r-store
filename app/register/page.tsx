import { redirect } from "next/navigation";
import AuthForm from "../auth-form";
import { getAuthSession, safeReturnPath } from "../auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = safeReturnPath(next, "/account");
  if (await getAuthSession()) redirect(nextPath);
  return <main className="auth-screen"><section><p>P&R MEMBERS</p><h1>Create your account.</h1><span>Save pieces, track orders and keep your account details in one place.</span><AuthForm mode="register" nextPath={nextPath} /><a className="auth-secondary" href={`/login?next=${encodeURIComponent(nextPath)}`}>Already have an account? Sign in</a></section></main>;
}
