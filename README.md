# 96 Nation — Ticketing Hub

Mobile-first ticketing and content site for **[96nation.net](https://96nation.net)**: events, Stripe checkout / free RSVP, Genesis forms, Sanity CMS, and owner admin.

| Layer | Stack |
|-------|--------|
| App | **Next.js 15** App Router, **TypeScript**, **Tailwind CSS v4** |
| CMS | **Sanity** (embedded Studio at `/studio`) |
| Data | **Supabase** Postgres (orders, inventory, forms) + Auth (admin magic link) |
| Payments | **Stripe Checkout** (hosted) |
| Email | **Resend** |
| Host | **Vercel** (cron, previews, env) |
| Observability | **Sentry** · rate limits **Upstash** |

System design: [`DESIGN.md`](./DESIGN.md).

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill as integrations come online
npm run dev                  # http://localhost:3000
```

```bash
npm run build
npm run start
npm run lint
npm run test:unit
npm run build && npm run test:a11y   # axe smoke needs a prior build
```

Node.js **20+** required (`engines` in `package.json`).

Without SaaS credentials the app still **builds** and serves marketing stubs; Studio shows setup instructions; checkout/admin need env (see below).

---

## Documentation (handoff package)

| Doc | Contents |
|-----|----------|
| [`docs/ENV.md`](./docs/ENV.md) | **Every env var** — local / preview / prod matrix, rotation |
| [`docs/ADMIN.md`](./docs/ADMIN.md) | Owner guide: Studio publish, orders, CSV, refunds, forms |
| [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) | Deploy, Stripe CLI, webhooks, daily checks, rollback |
| [`docs/CUTOVER.md`](./docs/CUTOVER.md) | **Phase 0** + **live ticketing** cutover checklist |
| [`docs/CREDENTIALS_MAP.md`](./docs/CREDENTIALS_MAP.md) | Who owns which SaaS (fill placeholders at handoff) |
| [`docs/COSTS.md`](./docs/COSTS.md) | Rough monthly SaaS + Stripe fee notes |
| [`docs/A11Y.md`](./docs/A11Y.md) | WCAG checklist for editors + engineers |
| [`docs/SANITY.md`](./docs/SANITY.md) | CMS seed, schemas, revalidation webhook |
| [`.env.example`](./.env.example) | Copy-paste env skeleton |

**Kill switch:** set `NEXT_PUBLIC_TICKETING_ENABLED=false` in Vercel Production and redeploy (see RUNBOOK).

**PII scripts (stubs):** [`scripts/pii-export.ts`](./scripts/pii-export.ts), [`scripts/pii-delete.ts`](./scripts/pii-delete.ts) — `npm run pii:export -- --email …` / `npm run pii:delete -- --email … --confirm` (requires `tsx` devDependency).

---

## Phase 0 & go-live

Ops foundations (accounts, DNS, Resend domain, env matrix) and live Stripe cutover are tracked in:

**[`docs/CUTOVER.md`](./docs/CUTOVER.md)**

Custom domain DNS is **not** a merge blocker for product PRs; feature-complete on `*.vercel.app` is fine until DNS is ready.

---

## Key routes

| Path | Purpose |
|------|---------|
| `/` | Home (Sanity site settings + featured events) |
| `/events`, `/events/[slug]` | Event list + detail |
| `/t/[code]` | Short link → event (Sanity `shortCode`) |
| `/checkout/[slug]` | Ticket purchase / RSVP |
| `/checkout/success`, `/checkout/cancel` | Post-Checkout |
| `/galleries`, `/videos` | Media |
| `/genesis`, `/contact` | Forms |
| `/privacy`, `/terms` | Legal |
| `/studio` | Embedded Sanity Studio |
| `/admin` | Orders + forms (allowlisted email) |
| `/api/health` | Uptime probe |
| `/api/stripe/webhook` | Stripe webhooks |
| `/api/cron/*` | Reservation release + order reconcile |

---

## Project layout

```text
app/                 # App Router pages + API routes
components/          # UI, forms, admin, legal
lib/                 # Sanity, Supabase, Stripe, orders, email, env
sanity/              # Schema types + desk structure
supabase/migrations/ # Postgres inventory, orders, RLS, RPCs
docs/                # Handoff documentation
scripts/             # PII export/delete stubs
tests/               # Playwright axe + unit tests
.github/workflows/   # CI: lint, build, unit, axe
```

---

## Sanity Studio

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
```

Open **[http://localhost:3000/studio](http://localhost:3000/studio)**. Full seed + revalidation: [`docs/SANITY.md`](./docs/SANITY.md).

---

## Admin

1. Set `ADMIN_EMAILS=you@example.com` and Supabase URL/anon + service role.
2. `/admin/login` → magic link.
3. Orders (CSV, reconcile) and form inbox.

Owner steps: [`docs/ADMIN.md`](./docs/ADMIN.md).

---

## CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) on `main` and `execute-plan/**`:

1. `npm ci`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run build`
5. Playwright Chromium + `npm run test:a11y`

---

## Design tokens & a11y

Placeholder AA-safe dark tokens in `app/globals.css` (bg `#0a0a0a`, fg `#f5f5f5`, accent `#5eead4`). Skip link → `#main-content`; landmarks; mobile nav; `:focus-visible`. Editor/engineer checklist: [`docs/A11Y.md`](./docs/A11Y.md).

---

## License / ownership

Private project for 96 Nation. Credentials ownership: [`docs/CREDENTIALS_MAP.md`](./docs/CREDENTIALS_MAP.md).
