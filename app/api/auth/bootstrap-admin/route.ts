/** The Better Auth/D1 bootstrap was retired with the Supabase migration. */
export async function POST() {
  return Response.json({ message: "Use Supabase Auth and admin_users to bootstrap an administrator." }, { status: 410 });
}
