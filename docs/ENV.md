# Environment variables

Draft matrix for local / Vercel preview / production.  
**Never commit `.env` or service role keys.** Rotate secrets in provider dashboards → update Vercel env → redeploy (see RUNBOOK when published).

| Variable | Local | Preview | Prod | Public? | Notes |
|----------|-------|---------|------|---------|--------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://*.vercel.app` | `https://96nation.net` | yes | Canonical origin for redirects, OG, success links |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ✓ | ✓ | ✓ | yes | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` or `development` | ✓ | `production` | yes | |
| `NEXT_PUBLIC_SANITY_API_VERSION` | ✓ | ✓ | ✓ | yes | e.g. `2025-01-01` (match root `.env.example`) |
| `SANITY_API_READ_TOKEN` | ✓ | ✓ | ✓ | **no** | Server reads / drafts |
| `SANITY_PREVIEW_SECRET` | ✓ | ✓ | ✓ | **no** | Draft preview gate |
| `SANITY_REVALIDATE_SECRET` | ✓ | ✓ | ✓ | **no** | On-demand revalidation webhook |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ | yes | Admin magic-link auth only in v1 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ | ✓ | **no** | **Server only** — orders, inventory, forms, webhooks (bypasses RLS) |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_test_…` | `sk_live_…` | **no** | |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` (CLI) | `whsec_` | `whsec_` | **no** | Per-endpoint secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | `pk_test_…` | `pk_live_…` | yes | If client needs it |
| `RESEND_API_KEY` | ✓ | ✓ | ✓ | **no** | Transactional email |
| `EMAIL_FROM` | `onboarding@resend.dev` | verified domain | verified domain | **no** | |
| `ADMIN_NOTIFY_EMAIL` | ✓ | ✓ | ✓ | **no** | Form / ops alerts |
| `ADMIN_EMAILS` | comma list | comma list | comma list | **no** | Allowlist for `/admin` |
| `UPSTASH_REDIS_REST_URL` | ✓ | ✓ | ✓ | **no** | Rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ | ✓ | ✓ | **no** | |
| `SENTRY_DSN` | optional | ✓ | **required** before live ticketing | yes (public DSN OK) | |
| `CRON_SECRET` | ✓ | ✓ | ✓ | **no** | `Authorization: Bearer` for `/api/cron/*` |
| `INVENTORY_SYNC_SECRET` | ✓ | ✓ | ✓ | **no** | Sanity → Postgres capacity sync |
| `NEXT_PUBLIC_TICKETING_ENABLED` | `true` | `true` | `true` | yes | Feature flag |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | `false` | `false` | `false` | yes | |
| `FACILITY_FEE_CENTS` | `100` | `100` | `100` (default $1.00; owner may set other values incl. `0`) | **no** | Snapshotted onto orders at create |
| `DEFAULT_PHONE_REGION` | `US` | `US` | `US` | **no** | E.164 parsing default |

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
FACILITY_FEE_CENTS=100
DEFAULT_PHONE_REGION=US
NEXT_PUBLIC_TICKETING_ENABLED=true
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## Migrations

SQL lives in `supabase/migrations/`. Apply with Supabase CLI (`supabase db push` / `supabase migration up`) or the SQL editor for one-off bootstrap. Seed sample inventory: `supabase/seed.sql` (local only).

## Rotation

1. Rotate key in Supabase / Stripe / Resend / Upstash dashboard.  
2. Update Vercel project env (preview + production as needed).  
3. Redeploy.  
4. Invalidate old webhook secrets and re-point Stripe CLI / endpoints.
