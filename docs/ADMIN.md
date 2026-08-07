# Admin guide — Studio + `/admin`

Owner-facing guide for day-to-day content and ops. Technical deploy/rollback lives in [`RUNBOOK.md`](./RUNBOOK.md). Env vars: [`ENV.md`](./ENV.md).

## Two consoles

| Console | URL | Purpose |
|---------|-----|---------|
| **Sanity Studio** | `/studio` | Events, pages, galleries, videos, site settings, form chrome |
| **Ops admin** | `/admin` | Orders, door CSV, reconcile, form inbox |

Sign in to Studio with your Sanity account (invite teammates in [sanity.io/manage](https://www.sanity.io/manage)).  
Sign in to `/admin` with **magic link** email (Supabase Auth). Your email must appear in `ADMIN_EMAILS` (comma-separated, case-insensitive).

---

## Sanity Studio (`/studio`)

### First-time setup

1. Set Sanity env vars (see [`SANITY.md`](./SANITY.md) and [`.env.example`](../.env.example)).
2. Open `/studio` and log in.
3. Complete **Site settings** (title, hero, social, default OG image, timezone).
4. Seed Privacy / Terms / Genesis pages as needed.

### Publish an event (checklist)

1. **Events** → Create (or open draft).
2. Fill required fields:
   - Title, slug (kebab-case), `startAt`
   - Hero image **with alt text**
   - ≥1 ticket type: `id`, `name`, `priceCents`, `capacity`, `maxPerOrder`
   - Ticket type `id`s unique within the event
3. Optional: `shortCode` (e.g. `SHOW1`) → public short link `/t/SHOW1`.
4. Optional: venue, description, OG image (falls back to hero when published).
5. Set status **Published** only when ready to sell / show publicly.
6. Click **Publish** in Studio.
7. Confirm the public page: `/events/{slug}` (and `/t/{code}` if set).

**Capacity:** Sanity ticket type `capacity` seeds Postgres inventory (via inventory sync). After on-sale, **Postgres is the source of truth** for sold/reserved counts. Lowering capacity below `sold + reserved` is blocked or unsafe — raise capacity carefully; never delete a ticket type that has sales.

**Free / RSVP:** set `priceCents` to `0` on the ticket type. Checkout uses the free RSVP path (no Stripe); inventory still decrements.

**Paid tickets:** `priceCents` is the base ticket amount in cents (e.g. `700` = $7.00). A facility fee (`FACILITY_FEE_CENTS`, default $1.00) is added as a separate Checkout line item for paid orders only.

### Cancel or unpublish an event

- Set status **Cancelled** (or unpublish) in Studio and Publish.
- Existing paid orders remain valid; stop new sales by capacity or by setting `NEXT_PUBLIC_TICKETING_ENABLED=false` site-wide if needed (see RUNBOOK).

### Galleries

- Create gallery → add images → **every image needs alt text**.
- Publish. Public list: `/galleries`.

### Videos

- Prefer **YouTube or Vimeo URL** (`externalUrl`) — do not upload large video files to Sanity for v1.
- Public list: `/videos`.

### Pages & legal

- CMS pages for privacy, terms, about, genesis (slugs). Fallbacks exist in code if CMS is empty.
- Checkout requires acceptance of Privacy + Terms before submit.

### After publish: site updates

On-demand revalidation (`POST /api/revalidate` with `SANITY_REVALIDATE_SECRET`) should refresh public pages without a full redeploy. Setup: [`SANITY.md`](./SANITY.md#on-demand-revalidation). If a page looks stale, wait a minute, hard-refresh, or redeploy.

### Inventory sync

Ticket capacities in Postgres are kept in sync via `POST /api/inventory/sync` (secret: `INVENTORY_SYNC_SECRET`). After changing capacities in Studio, ensure sync has run (or re-publish / trigger webhook if configured). See RUNBOOK if inventory and Studio disagree.

---

## Ops admin (`/admin`)

### Login

1. Open `/admin/login`.
2. Enter an allowlisted email → receive magic link → click link.
3. Land on **Orders** (default).

If you see “not allowed”, add your email to `ADMIN_EMAILS` in Vercel env and redeploy (or update local `.env.local`).

### Orders (`/admin/orders`)

- Filter by **event** and **status** (`pending`, `paid`, `fulfilled`, `expired`, `cancelled`, `failed`, `refunded`, `partially_refunded`).
- Open an order for buyer PII, amounts, Stripe session id, and actions.
- **Export CSV** — door list: one row per ticket unit (quantity expanded). Export is **audit-logged**.
  - Columns: `order_id`, `ticket_index`, `quantity_total`, `event_slug`, `ticket_type_id`, `buyer_name`, `buyer_email`, `buyer_phone`, `status`, `paid_at`
- **Reconcile** — pulls Stripe session state and fulfills or expires stuck orders. Use when:
  - Order stays `pending` after successful payment
  - Webhook missed or failed
  - Refund status not reflected yet

### Refunds (owner steps)

1. Open the order in `/admin/orders/[id]`.
2. Click **Refund in Stripe** (opens Stripe Dashboard for that payment).
3. Issue a **full refund** in Stripe.
4. Within ~15 minutes the webhook should set status `refunded` and restore capacity once.
5. If status is wrong: click **Reconcile**. If still wrong, escalate (see RUNBOOK / `stripe_webhook_events`).
6. **Partial refund:** status becomes `partially_refunded`; edit the door list manually; capacity is **not** auto-restored.

### Forms (`/admin/forms`)

- Inbox for Genesis signup, service inquiry, and contact (latest submissions).
- Payload shows name, email, and form fields. Admin email alerts go to `ADMIN_NOTIFY_EMAIL` when Resend is configured.

### What not to do in Supabase Table Editor

Owner day-to-day work should stay in `/studio` and `/admin`. Direct table edits risk inventory corruption and skipped audit logs. Leave SQL / service role to the technical contact.

---

## Share links for social

| Link | Use |
|------|-----|
| `https://96nation.net/events/{slug}` | Canonical event page + OG preview |
| `https://96nation.net/t/{code}` | Short redirect from Instagram / Link in Bio / QR |

After publish, test the short link once on mobile.

---

## Quick troubleshooting

| Symptom | What to try |
|---------|-------------|
| Studio blank / setup message | Missing `NEXT_PUBLIC_SANITY_PROJECT_ID` |
| Event not on site after publish | Revalidate webhook secret; check event status **Published** |
| Cannot log into `/admin` | Email not in `ADMIN_EMAILS`; magic link expired; Supabase auth env |
| No orders | Ticketing disabled flag; Stripe test vs live keys; checkout errors |
| CSV wrong count | Quantity expands rows; filter by paid/fulfilled only for door |
| Email not received | Resend domain/SPF/DKIM; check spam; `EMAIL_FROM` must be verified domain in prod |

More detail: [`RUNBOOK.md`](./RUNBOOK.md).
