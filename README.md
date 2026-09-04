# P&R commerce storefront

P&R is a Next.js storefront and operations console backed by Supabase.

## Architecture

- Next.js: storefront, account area, checkout APIs, and `/admin`
- Signed name-and-mobile sessions: customer and administrator access
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

Run `supabase/migrations/0003_phone_members.sql` as well. Customer members use
their name and Indian mobile number; no email, password, or OTP is required.

Admin access is separate. Add the store owner's number to
`ADMIN_PHONE_NUMBERS` in both `.env.local` and Render, for example:

```text
ADMIN_PHONE_NUMBERS=9876543210
```

Only configured numbers can sign in at `/admin/login` and perform operational
actions such as updating orders to Shipped or Out for delivery.

## Render deployment

Create a Render **Web Service** from the private GitHub repository:

- Runtime: Node
- Branch: `main`
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Auto-deploy: On Commit
- Health check path: `/api/health`

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`,
`ADMIN_PHONE_NUMBERS`, `MEMBER_SESSION_SECRET`, and `NODE_VERSION=22.13.0` in
Render. Never commit `.env.local`.

Once Render provides the production URL, set that exact origin as Supabase
Authentication's Site URL and add `https://your-service.onrender.com/**` to the
allowed Redirect URLs.

## Separate operations and public deployments

Set `APP_MODE=admin` on the current Render service. `/` redirects to `/admin`;
customer pages (including `/user`, `/shop`, login and checkout) return 404.
Backend APIs remain available and admin authentication is still required.
Production defaults to this mode when `APP_MODE` is unset.

For local storefront development, run `npm run dev` and open `/`. Development
defaults to `all`, exposing both storefront and admin. Set `APP_MODE=storefront`
in `.env.local` to preview the public deployment's restrictions.

Later, create a separate public service from this repository with
`APP_MODE=storefront` and the required Supabase, database and payment settings.
The public website opens at `/`; `/admin`, `/admin-panel`, `/api/admin/*` and
`/api/auth/admin` return 404. Keep the operations service in `admin` mode.
Each service runs its own backend APIs against the shared database, keeping
browser API requests on the same origin. Configure the payment webhook on
only one service. Restart/redeploy after changing modes.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
