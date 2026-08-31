import AuthForm from "../../auth-form";
import { getAuthSession } from "../../auth";
import { requireAdmin } from "../../api/_lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  const admin = await requireAdmin();
  if (admin) redirect("/admin/dashboard");
  const session = await getAuthSession();
  return <main className="admin-login"><p>P&R / ADMIN</p><h1>Store operations</h1><span>{session?.user ? "You do not have admin access." : "Sign in with your administrator email and password to continue."}</span>{session?.user ? <Link href="/">Return to storefront</Link> : <><AuthForm mode="login" nextPath="/admin/dashboard" admin /><Link href="/register?next=%2Fadmin%2Fdashboard">Create a customer account</Link></>}</main>;
}
