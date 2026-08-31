# P&R commerce storefront

P&R is a Next.js storefront and operations console backed by Supabase.

## Architecture

- Next.js: storefront, account area, checkout APIs, and `/admin`
- Supabase Auth: customer and administrator sessions
- Supabase PostgreSQL: catalog, inventory, carts, orders, coupons, payments, referrals, and audit data
- Supabase Storage: public product images in the `product-images` bucket
- Render: Node.js web service deployed automatically from GitHub `main`

## Local development

Copy `.env.example` to `.env.local`, configure the three Supabase values, then run:

```bash
npm install
npm run dev
```

Required configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
```

Use the Supabase transaction-pooler URI for `DATABASE_URL`. It is a server-only
secret and must never use a `NEXT_PUBLIC_` prefix or be committed.

## Supabase setup

Create the public `product-images` bucket with an 8 MB limit for JPEG, PNG,
WebP, and AVIF. Run these files in Dashboard > SQL Editor, in order:

1. `supabase/migrations/0001_auth_storage.sql`
2. `supabase/migrations/0002_commerce.sql`

After the intended administrator has registered, promote that user once:

```sql
insert into public.admin_users (user_id, role, status)
select id, 'SUPER_ADMIN', 'active'
from auth.users
where lower(email) = lower('owner@example.com')
on conflict (user_id) do update
set role = excluded.role, status = excluded.status;
```

Replace `owner@example.com` with the real administrator email. Admin access is
always checked server-side against `admin_users`.

## Render deployment

Create a Render **Web Service** from the private GitHub repository:

- Runtime: Node
- Branch: `main`
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Auto-deploy: On Commit
- Health check path: `/`

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`,
and `NODE_VERSION=22.13.0` in Render. Never commit `.env.local`.

Once Render provides the production URL, set that exact origin as Supabase
Authentication's Site URL and add `https://your-service.onrender.com/**` to the
allowed Redirect URLs.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
