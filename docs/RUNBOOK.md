# Runbook — deploy, webhooks, incidents, rollback

Operational procedures for engineers and the technical contact. Owner day-to-day: [`ADMIN.md`](./ADMIN.md). Env matrix: [`ENV.md`](./ENV.md). Live go-live: [`CUTOVER.md`](./CUTOVER.md).

---

## Architecture (ops view)

| Layer | Role |
|-------|------|
| **Vercel** | Next.js host, preview deploys, Cron, env |
| **Sanity** | Content (events, pages, media) |
| **Supabase Postgres** | Orders, inventory, forms, outbox, webhooks audit, admin audit |
| **Stripe Checkout** | Paid tickets (hosted; no card data on our servers) |
| **Resend** | Confirmation + admin notification email |
| **Upstash Redis** | Rate limits (multi-instance) |
| **Sentry** | Error alerts (required before live ticketing) |

Feature flags:

```bash
NEXT_PUBLIC_TICKETING_ENABLED=true   # false hides CTAs / blocks checkout
NEXT_PUBLIC_MAINTENANCE_MODE=false
FACILITY_FEE_CENTS=100               # paid orders only
```

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill secrets
npm run dev                  # http://localhost:3000
```

Apply DB migrations (Supabase CLI or SQL editor):

```bash
# example — project-linked CLI
supabase db push
# optional local seed
# supabase/seed.sql
```

### Stripe CLI (local webhooks)

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli) and `stripe login`.
2. Use **test** keys in `.env.local` (`sk_test_…`, `pk_test_…`).
3. Forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` in `.env.local` and restart `npm run dev`.
5. Trigger a test Checkout (or `stripe trigger checkout.session.completed` — prefer real checkout for full inventory path).
6. Confirm order moves to `paid`/`fulfilled` in `/admin/orders` and webhook row in `stripe_webhook_events`.

### Local cron (optional)

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/release-reservations

curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/reconcile-orders
```

Schedules in production (`vercel.json`):

| Path | Schedule |
|------|----------|
| `/api/cron/release-reservations` | every 5 minutes |
| `/api/cron/reconcile-orders` | every 15 minutes |

Vercel sends `Authorization: Bearer ${CRON_SECRET}` when `CRON_SECRET` is set.

### Health check

```bash
curl -s https://YOUR_HOST/api/health
# { "ok": true, "db": "ok" }  or db: "unconfigured" / "error"
```

---

## Deploy

1. Merge to `main` (or promote the production deployment in Vercel).
2. Confirm **Production** env vars match [`ENV.md`](./ENV.md) (especially Stripe **live** secrets, `CRON_SECRET`, `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`).
3. After deploy: hit `/api/health`, open home + one event, smoke-test admin login.
4. Preview deploys use **Preview** env — keep Stripe **test** keys on preview.

### Secret rotation

1. Rotate in provider dashboard (Supabase / Stripe / Resend / Upstash / Sanity tokens).
2. Update Vercel **Preview** and/or **Production** env.
3. Redeploy (env changes require redeploy for most vars).
4. For Stripe webhooks: update endpoint signing secret (`STRIPE_WEBHOOK_SECRET`) to match the dashboard endpoint.
5. Never commit `.env` or service role keys. Never put secrets in query strings (revalidate / cron / inventory sync use Bearer or custom headers only).

---

## Stripe webhooks (production)

- Endpoint: `POST https://96nation.net/api/stripe/webhook` (or current production host).
- Events: at least `checkout.session.completed`, `checkout.session.expired`, `charge.refunded` / refund-related events as implemented.
- Signing secret → `STRIPE_WEBHOOK_SECRET`.
- Dashboard → Developers → Webhooks → delivery log for failures.

### Replay a failed delivery

1. Stripe Dashboard → Webhook endpoint → event → **Resend**.
2. Or use **Reconcile** on the order in `/admin/orders/[id]`.
3. Inspect `stripe_webhook_events` for `processing` / `failed` rows if needed.

### Daily checks (first 2 live events — then weekly)

- [ ] Stripe webhook delivery success rate (no multi-hour failure streak).
- [ ] `/admin/orders` — no long-stuck `pending` with a session id older than ~35m (cron should reconcile).
- [ ] Sentry — no new spike of 5xx on checkout/webhook.
- [ ] Spot-check one confirmation email (spam folder if missing).
- [ ] `GET /api/health` returns `ok: true`.

---

## Rollback

### A. Instant app rollback (preferred for bad deploy)

1. Vercel → Project → Deployments → prior good deployment → **Promote to Production**.
2. Verify `/api/health` and home page.
3. Confirm Stripe webhook still points at the same production URL (rollback does not change Stripe config).

### B. Kill switch — disable ticketing

Does **not** undeploy the site; hides purchase CTAs and blocks checkout APIs.

1. Vercel → Production env → set `NEXT_PUBLIC_TICKETING_ENABLED=false`.
2. Redeploy production (required for `NEXT_PUBLIC_*`).
3. Verify event pages no longer offer buy/RSVP.
4. Existing paid orders remain in DB; process refunds via Stripe if cancelling a show.

### C. Content rollback

- Sanity document history / unpublish or set event **Cancelled**.

### D. Database

- Migrations are **fix-forward** only. Do not drop columns with production data without a plan.
- Supabase backups / PITR (Pro): restore only with engineer + owner approval; dumps are **PII-classified**.

---

## Incidents

### Sold-out emergency / oversell suspected

1. Set `NEXT_PUBLIC_TICKETING_ENABLED=false` and redeploy **or** set event capacity carefully after audit.
2. Compare Stripe successful payments vs `orders` with status `paid`/`fulfilled` for that event.
3. Reconcile stuck rows; refund extras in Stripe if oversold.
4. Inventory: `ticket_inventory` rows per `(event_id, ticket_type_id)` — `capacity`, `sold_count`, `reserved_count`.

### Stuck `pending` after payment

1. Admin → order → **Reconcile**.
2. Confirm Stripe session `payment_status === paid`.
3. Check webhook deliveries and `CRON_SECRET` cron logs (`reconcile-orders` every 15m).
4. Manually fulfill only via reconcile path (avoid raw SQL updates).

### Webhook secret / URL mismatch after env change

1. Stripe Dashboard → endpoint URL must match production.
2. Copy new `whsec_…` into Vercel `STRIPE_WEBHOOK_SECRET` → redeploy.
3. Resend failed events.

### Email not sending

1. Resend domain verified (SPF/DKIM); `EMAIL_FROM` on that domain.
2. `RESEND_API_KEY` valid.
3. Check `email_outbox` (if present) for failed rows; Sentry for API errors.
4. Admin alerts: `ADMIN_NOTIFY_EMAIL`.

### Cron unauthorized / not running

1. `CRON_SECRET` set in Vercel Production.
2. Paths match `vercel.json`.
3. Manual Bearer curl (above) to confirm auth.

### DNS / SSL

1. Domain at registrar points to Vercel (A/CNAME as Vercel docs).
2. Vercel project domain shows Valid / SSL issued.
3. `NEXT_PUBLIC_SITE_URL=https://96nation.net` (no trailing slash).

---

## Data subject requests (PII)

Buyer/form PII lives in Supabase (`orders`, `form_submissions`). v1 tooling:

```bash
# stubs — fill SUPABASE_* in env; see scripts for usage
npx tsx scripts/pii-export.ts --email buyer@example.com
npx tsx scripts/pii-delete.ts --email buyer@example.com --confirm
```

- **Export:** JSON of orders + form rows for that email (support / DSAR).
- **Delete:** anonymize or hard-delete per policy in scripts (review before production use).
- Prefer audited process; do not paste full dumps into Slack/email.

---

## What breaks first (priority)

1. Stripe webhooks (URL / secret mismatch after env change).
2. Resend domain auth → spam or bounce.
3. Custom domain DNS / SSL.
4. Cron `CRON_SECRET` missing → reservations never release / reconcile lag.
5. Inventory desync if Sanity capacity changed without sync.

---

## Related docs

| Doc | Topic |
|-----|--------|
| [`ENV.md`](./ENV.md) | Full env matrix + rotation |
| [`ADMIN.md`](./ADMIN.md) | Studio + admin owner flows |
| [`CUTOVER.md`](./CUTOVER.md) | Phase 0 + live ticketing checklist |
| [`CREDENTIALS_MAP.md`](./CREDENTIALS_MAP.md) | Who owns each SaaS |
| [`COSTS.md`](./COSTS.md) | Monthly cost notes |
| [`SANITY.md`](./SANITY.md) | CMS seed + revalidation |
