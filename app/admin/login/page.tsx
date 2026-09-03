import AuthForm from "../../auth-form";
import { requireAdmin } from "../../api/_lib/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  const admin = await requireAdmin();
  if (admin) redirect("/admin/dashboard");
  return <main className="admin-login"><p>P&R / ADMIN</p><h1>Store operations</h1><span>Sign in with your administrator email and password to continue.</span><AuthForm mode="login" nextPath="/admin/dashboard" admin /></main>;
}
