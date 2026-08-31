import { redirect } from "next/navigation";
import AuthForm from "../auth-form";
import { getAuthSession, safeReturnPath } from "../auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = safeReturnPath(next, "/account");
  if (await getAuthSession()) redirect(nextPath);
  return <main className="auth-screen"><section><p>P&R MEMBERS</p><h1>Welcome back.</h1><span>Sign in to manage your orders, saved pieces and account.</span><AuthForm mode="login" nextPath={nextPath} /><a className="auth-secondary" href={`/register?next=${encodeURIComponent(nextPath)}`}>Create an account</a></section></main>;
}
