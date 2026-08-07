# Environment variables

Matrix for **local / Vercel preview / production**.  
Canonical sketch also lives in root [`.env.example`](../.env.example).  
**Never commit `.env` or service role keys.** Rotation: provider dashboard → Vercel env → redeploy ([`RUNBOOK.md`](./RUNBOOK.md)).

| Variable | Local | Preview | Prod | Public? | Notes |
|----------|-------|---------|------|---------|--------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://*.vercel.app` | `https://96nation.net` | yes | Canonical origin for redirects, OG, success links (no trailing slash) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ✓ | ✓ | ✓ | yes | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` or `development` | ✓ | `production` | yes | |
| `NEXT_PUBLIC_SANITY_API_VERSION` | ✓ | ✓ | ✓ | yes | e.g. `2025-01-01` (match `.env.example`) |
| `SANITY_API_READ_TOKEN` | ✓ | ✓ | ✓ | **no** | Server reads / drafts |
| `SANITY_PREVIEW_SECRET` | optional | optional | optional | **no** | **Reserved — no runtime reader in v1.** Draft / Presentation preview later; setting it does nothing today |
| `SANITY_REVALIDATE_SECRET` | ✓ | ✓ | ✓ | **no** | On-demand revalidation webhook |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ | yes | Admin magic-link auth only in v1 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ | ✓ | **no** | **Server only** — orders, inventory, forms, webhooks (bypasses RLS) |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_test_…` | `sk_live_…` | **no** | Live keys only on Production at cutover; **required** for paid Checkout |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` (CLI) | `whsec_` | `whsec_` | **no** | Per-endpoint signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | optional | optional | yes | **Not required for v1** — Checkout is server-created with `STRIPE_SECRET_KEY` only. Keep for future client Stripe.js; safe to set live `pk_…` alongside cutover |
| `RESEND_API_KEY` | ✓ | ✓ | ✓ | **no** | Transactional email |
| `EMAIL_FROM` | `onboarding@resend.dev` | verified domain | verified domain | **no** | Must match verified domain in prod |
| `ADMIN_NOTIFY_EMAIL` | ✓ | ✓ | ✓ | **no** | Form / ops alerts |
| `ADMIN_EMAILS` | comma list | comma list | comma list | **no** | Allowlist for `/admin` (lowercase match) |
| `UPSTASH_REDIS_REST_URL` | ✓ | ✓ | ✓ | **no** | Rate limits (multi-instance) |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ | ✓ | ✓ | **no** | |
| `SENTRY_DSN` | optional | ✓ | **required** before live ticketing | yes (public DSN OK) | |
| `CRON_SECRET` | ✓ | ✓ | ✓ | **no** | `Authorization: Bearer` for `/api/cron/*` |
| `INVENTORY_SYNC_SECRET` | ✓ | ✓ | ✓ | **no** | Sanity → Postgres capacity sync |
| `NEXT_PUBLIC_TICKETING_ENABLED` | `true` | `true` | `true` | yes | Feature flag; `false` kills checkout CTAs (**implemented**) |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | `false` | `false` | `false` | yes | **Reserved — no runtime reader in v1.** Setting it does **not** show a maintenance banner yet; use `NEXT_PUBLIC_TICKETING_ENABLED=false` to stop sales |
| `FACILITY_FEE_CENTS` | `100` | `100` | `100` (default $1.00; owner may set other values incl. `0`) | **no** | Snapshotted onto paid orders at create |
| `DEFAULT_PHONE_REGION` | `US` | `US` | `US` | **no** | E.164 parsing default |
| `ALLOW_UNPERSISTED_FORMS` | optional `1` | **unset** | **never** | **no** | Dev-only force-flag. Also: when `NODE_ENV !== "production"`, forms may soft-succeed without service role even if this is unset. **Never** set in Production |

## Supabase access model (v1)

| Client | Key | RLS |
|--------|-----|-----|
| Browser (public site) | none for business data | N/A — no direct table access |
| Browser (`/admin` login) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth session only; **no** table policies for anon/authenticated |
| Next.js server | `SUPABASE_SERVICE_ROLE_KEY` via `createServiceClient()` | Bypasses RLS after app-level checks |

All ticketing / forms / inventory / webhook writes go through `lib/supabase/server.ts` → `createServiceClient()`.

## Local `.env.example` sketch

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_READ_TOKEN=
SANITY_PREVIEW_SECRET=
SANITY_REVALIDATE_SECRET=

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
ADMIN_NOTIFY_EMAIL=
ADMIN_EMAILS=owner@example.com

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

CRON_SECRET=
INVENTORY_SYNC_SECRET=
SENTRY_DSN=
FACILITY_FEE_CENTS=100
DEFAULT_PHONE_REGION=US
NEXT_PUBLIC_TICKETING_ENABLED=true
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Dev-only — never set in production:
# ALLOW_UNPERSISTED_FORMS=1
```

### Forms persistence (local vs prod)

| Environment | Behavior without service role |
|-------------|-------------------------------|
| `NODE_ENV !== "production"` | Soft-allow: form POST may return 200 without writing to Supabase (dev convenience) |
| Production | Requires service role; missing DB → error. `ALLOW_UNPERSISTED_FORMS` must stay unset |
| Any env + `ALLOW_UNPERSISTED_FORMS=1` | Explicit soft-allow (local only; **never** Production) |

## Cron auth

Vercel Cron invokes `GET /api/cron/*` with `Authorization: Bearer ${CRON_SECRET}` when `CRON_SECRET` is set. Schedules live in `vercel.json`:

- `release-reservations` — every 5m  
- `reconcile-orders` — every 15m  

## Stripe webhook

Point Stripe to `POST /api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` to the endpoint signing secret (`whsec_…`).  
Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (see [`RUNBOOK.md`](./RUNBOOK.md)).

## Migrations

SQL lives in `supabase/migrations/`. Apply with Supabase CLI (`supabase db push` / `supabase migration up`) or the SQL editor for one-off bootstrap. Seed sample inventory: `supabase/seed.sql` (local only).

## Rotation

1. Rotate key in Supabase / Stripe / Resend / Upstash / Sanity dashboard.  
2. Update Vercel project env (preview + production as needed).  
3. Redeploy.  
4. Invalidate old webhook secrets and re-point Stripe CLI / endpoints.  
5. On personnel change: rotate service role + Stripe + remove dashboard users ([`CREDENTIALS_MAP.md`](./CREDENTIALS_MAP.md)).
