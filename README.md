# P&R commerce storefront

P&R is a React/Next-compatible Vinext storefront that runs on Cloudflare
Workers with Cloudflare D1 for commerce and authentication data, and R2 for
media. Product prices, orders, coupons and payments use paise in D1.

## Local development

```bash
npm install
npm run db:migrate:local
npm run dev
```

Run the normal checks with:

```bash
npm run lint
npm test
```

## Authentication

Customer registration and login use `/register` and `/login`. Better Auth
stores password hashes, accounts and server-side sessions in D1. Browser
sessions use HttpOnly, SameSite cookies; secure cookies are enabled in
production. Better Auth's origin/CSRF checks remain enabled, and sign-up/sign-in
are database rate-limited.

`/account` requires an authenticated session. Guest checkout remains public.
The customer record is linked to Better Auth through `customers.auth_user_id`.

Administrator access uses the existing `admin_roles` table. `/admin` pages and
`/api/admin/*` endpoints validate the session and an active `ADMIN` or
`SUPER_ADMIN` role server-side. `ADMIN_EMAILS` is never used as a runtime access
bypass.

### First local administrator

Set a single initial email in `ADMIN_EMAILS`, a high-entropy `BETTER_AUTH_SECRET`,
the local `BETTER_AUTH_URL`, and a temporary `ADMIN_BOOTSTRAP_TOKEN`. Start the
app, choose the administrator password locally, and run:

```bash
read -s ADMIN_PASSWORD
printf '%s' "$ADMIN_PASSWORD" | ADMIN_BOOTSTRAP_TOKEN="$ADMIN_BOOTSTRAP_TOKEN" AUTH_BOOTSTRAP_URL=http://localhost:3000 npm run auth:bootstrap-admin
unset ADMIN_PASSWORD ADMIN_BOOTSTRAP_TOKEN
```

The endpoint is unavailable in production and delegates password hashing to
Better Auth. It creates a D1 `SUPER_ADMIN` role. Sign in at `/admin/login`.

## Configuration

Copy `.env.example` to `.env.local`. Required production values:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` when online payments are enabled

Google login becomes available only when both `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are configured. The Worker requires the `DB` D1 and
`MEDIA` R2 bindings declared in `.openai/hosting.json`.

## Deployment preparation

Use Cloudflare Workers for the existing Vinext runtime. Before any production
deployment, replace the placeholder D1 configuration in `wrangler.d1.jsonc`,
apply migrations to a staging D1 database, configure Worker secrets, and test
the Razorpay webhook on the public HTTPS origin.
