# Phase 0 + live ticketing cutover checklist

Ops checklist for foundations and going **live** with real Stripe charges.  
Not a code merge gate for early PRs — required before selling paid tickets in production.

Related: [`ENV.md`](./ENV.md) · [`RUNBOOK.md`](./RUNBOOK.md) · [`CREDENTIALS_MAP.md`](./CREDENTIALS_MAP.md) · [`COSTS.md`](./COSTS.md) · [`ADMIN.md`](./ADMIN.md)

---

## Phase 0 — Foundations

Owner + engineer. Feature-complete on `*.vercel.app` is OK **without** custom domain.

### Accounts & ownership

- [ ] Registrar / DNS owner named in [`CREDENTIALS_MAP.md`](./CREDENTIALS_MAP.md)
- [ ] Create / confirm projects:
  - [ ] **Vercel** (this repo connected; Production + Preview)
  - [ ] **Sanity** (dataset, CORS for localhost + prod origins)
  - [ ] **Supabase** (project; Auth email magic link enabled)
  - [ ] **Stripe** (test mode first)
  - [ ] **Resend**
  - [ ] **Upstash** Redis REST
  - [ ] **Sentry** project + DSN
- [ ] Invoices / who pays recorded in CREDENTIALS_MAP
- [ ] Engineer + owner 2FA on all dashboards

### Domain (when ready — not a merge blocker)

- [ ] DNS points to Vercel; SSL valid
- [ ] `NEXT_PUBLIC_SITE_URL=https://96nation.net` (or current canonical host)
- [ ] Optional: www → apex (or reverse) redirect configured

### Email

- [ ] Resend **domain verify** (SPF + DKIM) before real buyer email
- [ ] `EMAIL_FROM` uses verified domain in production
- [ ] `ADMIN_NOTIFY_EMAIL` receives a test form alert
- [ ] Confirmation email received from a **test** checkout (not spam folder only)

### Environment matrix

- [ ] Local `.env.local` from [`.env.example`](../.env.example) — see [`ENV.md`](./ENV.md)
- [ ] Vercel **Preview**: Stripe **test** keys, non-prod dataset/secrets as appropriate
- [ ] Vercel **Production**: live Stripe keys only when ready for cutover; all secrets set
- [ ] `ADMIN_EMAILS` includes owner (+ helpers)
- [ ] `CRON_SECRET`, `INVENTORY_SYNC_SECRET`, `SANITY_REVALIDATE_SECRET` set (long random)
- [ ] `SENTRY_DSN` set on Production (**required** before live ticketing)
- [ ] `NEXT_PUBLIC_TICKETING_ENABLED=true` only when ready; use `false` for content-only soft launch

### Database

- [ ] All `supabase/migrations/*` applied to the production project
- [ ] RLS enabled; no accidental public table policies (service role only path)
- [ ] Health: `GET /api/health` → `{ ok: true, db: "ok" }`

### CMS

- [ ] Site settings published
- [ ] Privacy + Terms pages published (checkout legal gates)
- [ ] Sanity revalidate webhook → `POST /api/revalidate` with Bearer secret ([`SANITY.md`](./SANITY.md))
- [ ] Sample/real event draft ready; inventory sync path known

### CI / quality

- [ ] GitHub Actions CI green on main: **lint + unit + build + axe** (see `.github/workflows/ci.yml`)
- [ ] Manual a11y smoke per [`A11Y.md`](./A11Y.md) if brand tokens changed

---

## Soft launch (test mode / low risk)

Do this **before** flipping Stripe to live.

- [ ] Production (or preview URL) with **Stripe test** keys works end-to-end:
  - [ ] Publish event with small capacity
  - [ ] Paid Checkout (test card) → order `paid`/`fulfilled` in `/admin`
  - [ ] Confirmation email delivered
  - [ ] Door CSV export rows = quantity
  - [ ] Free ticket type RSVP (if used) consumes inventory without Stripe
- [ ] Webhook endpoint receives test events (Stripe Dashboard)
- [ ] Cron: reservations release after TTL; reconcile clears stuck pending
- [ ] Admin magic link login for all allowlisted emails
- [ ] Forms: Genesis/contact submit + appear in `/admin/forms` + notify email
- [ ] Rollback drill (staging or low-traffic window):
  - [ ] Vercel promote previous deployment
  - [ ] Set `NEXT_PUBLIC_TICKETING_ENABLED=false`, redeploy, confirm CTAs gone, re-enable

---

## Live ticketing cutover

Schedule a quiet window. Prefer a **small-capacity** first event.

### Pre-flip

- [ ] Phase 0 + soft launch items complete
- [ ] Sentry alert routing verified (email/Slack to technical contact)
- [ ] Stripe account activated for live charges; business details complete
- [ ] `FACILITY_FEE_CENTS` agreed (default `100` = $1.00)
- [ ] Legal pages reviewed by owner
- [ ] CREDENTIALS_MAP filled; owner knows refund path ([`ADMIN.md`](./ADMIN.md#refunds-owner-steps))

### Flip to live

1. [ ] Stripe Dashboard: create/update **live** webhook → `https://<prod-host>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
2. [ ] Copy live endpoint `whsec_…` → Vercel Production `STRIPE_WEBHOOK_SECRET`
3. [ ] Set Production `STRIPE_SECRET_KEY=sk_live_…` (**required** for paid Checkout)
4. [ ] Optional: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…` — **not used by v1 server Checkout**; set only if you want it ready for future client Stripe.js
5. [ ] Confirm `NEXT_PUBLIC_SITE_URL` matches the public origin buyers use
6. [ ] `NEXT_PUBLIC_TICKETING_ENABLED=true`
7. [ ] Redeploy Production
8. [ ] Force inventory sync for the first live event (`POST /api/inventory/sync` — [`RUNBOOK.md`](./RUNBOOK.md#force-inventory-sync))
9. [ ] **One real low-value purchase** (or Stripe live test if available) by owner/engineer:
   - [ ] Pay → success page
   - [ ] Email confirmation
   - [ ] Order visible in `/admin/orders`
   - [ ] Webhook delivery **200** in Stripe live log
10. [ ] Optional: full refund of the test order → status `refunded` + capacity restored
11. [ ] Publish real event with intended capacity; share `/events/{slug}` or `/t/{code}`

### First 48 hours / first 2 events

Daily checks in [`RUNBOOK.md`](./RUNBOOK.md#daily-checks-first-2-live-events--then-weekly):

- [ ] Webhook success
- [ ] No stuck `pending` pile-up
- [ ] Sentry quiet / triaged
- [ ] Spot-check door CSV before doors open

### Abort criteria → kill switch

If checkout charges but does not fulfill, or webhooks fail repeatedly:

1. `NEXT_PUBLIC_TICKETING_ENABLED=false` + redeploy ([`RUNBOOK.md`](./RUNBOOK.md#b-kill-switch--disable-ticketing))
2. Vercel rollback if bad code
3. Reconcile/refund affected orders in Stripe
4. Fix webhook/env; soft-launch again before re-enabling

---

## Definition of done (product)

From system design — sign off when true in production:

1. [ ] Owner publishes event in `/studio` and shares `/events/{slug}` or `/t/{code}`
2. [ ] Paid mobile purchase → `paid` in admin → email received → PII stored (E.164 phone)
3. [ ] Free RSVP works without Stripe and consumes capacity
4. [ ] Concurrent reserve prevents oversell (no charge-then-refund as primary control)
5. [ ] Genesis forms submit + appear in `/admin/forms`
6. [ ] Galleries/videos owner-updatable
7. [ ] Critical paths axe-clean; keyboard checkout works
8. [ ] Handoff docs + costs + credentials map; Sentry verified; Stripe **live** webhook OK
9. [ ] Rollback drill: Vercel rollback + `TICKETING_ENABLED=false`

**Signed off by:** _name_ · **Date:** _YYYY-MM-DD_
