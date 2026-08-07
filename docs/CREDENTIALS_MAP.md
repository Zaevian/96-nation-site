# Credentials map

**Who owns which SaaS account, who pays invoices, and who to escalate to.**  
Fill placeholders at handoff. Do **not** store passwords or API keys in this file — only ownership and dashboard URLs.

Last updated: _YYYY-MM-DD_  
Technical contact until transition: _TBD_  
Owner org pays invoices from: _transition date TBD_

---

## Ownership matrix

| Service | Dashboard | Account email / org | Primary owner | Pays invoice | Technical access | Notes |
|---------|-----------|---------------------|---------------|--------------|------------------|-------|
| **DNS / Registrar** | _(e.g. Namecheap / Cloudflare / Google Domains)_ | _TBD_ | **Owner** (unless delegated) | Owner | Engineer (temp) | Domain: `96nation.net`. Document login 2FA owner. |
| **Vercel** | [vercel.com](https://vercel.com) | _TBD_ | _TBD_ | Owner | Engineer | Hosting, env, cron, deploys |
| **Sanity** | [sanity.io/manage](https://www.sanity.io/manage) | _TBD_ | Owner (editors) | Owner | Engineer | CMS project + Studio invites |
| **Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard) | _TBD_ | Engineer (until handoff) | Owner | Engineer | DB, Auth, service role — **high sensitivity** |
| **Stripe** | [dashboard.stripe.com](https://dashboard.stripe.com) | _TBD_ | Owner | Owner (fees) | Engineer | Live vs test mode; webhooks; refunds |
| **Resend** | [resend.com](https://resend.com) | _TBD_ | Engineer (until handoff) | Owner | Engineer | Domain DNS records for SPF/DKIM |
| **Upstash** | [console.upstash.com](https://console.upstash.com) | _TBD_ | Engineer | Owner | Engineer | Redis REST for rate limits |
| **Sentry** | [sentry.io](https://sentry.io) | _TBD_ | Engineer | Owner | Engineer | Required before live ticketing |
| **GitHub / git host** | _TBD_ | _TBD_ | _TBD_ | Owner | Engineer | Repo access; branch protection |
| **Google / email (admin notify)** | _TBD_ | _TBD_ | Owner | Owner | — | Inbox for `ADMIN_NOTIFY_EMAIL` |

---

## Escalation

| Severity | Contact | Channel |
|----------|---------|---------|
| Site down / checkout broken | _Primary technical: TBD_ | _phone / SMS / chat_ |
| Payment / refund dispute | Owner + Stripe support | Stripe Dashboard |
| Data breach / PII concern | Owner + technical contact | Immediate call; do not discuss details in public channels |
| DNS / domain expiry | Registrar owner | Registrar support |

**Business owner (decision maker):** _Name / email / phone_  
**Backup admin editor:** _Name / email_  
**Engineer (build / transition):** _Name / email / phone_  
**Transition / handoff date:** _YYYY-MM-DD_

---

## Access hygiene

- Prefer **SSO / magic link / 2FA** on every dashboard.
- Service role keys and Stripe secret keys: Vercel env only; rotate on personnel change (see [`RUNBOOK.md`](./RUNBOOK.md#secret-rotation)).
- When engineer access ends: remove from Vercel, Supabase, Stripe, Sanity, GitHub, Sentry, Upstash, Resend; rotate secrets.
- `ADMIN_EMAILS` allowlist: update when staff change; redeploy after env update.
- Stripe **live** keys only on Production; Preview stays on **test**.

---

## Invoice checklist (post-handoff)

Owner org should receive and pay:

- [ ] Vercel (Hobby/Pro)
- [ ] Sanity (if over free tier)
- [ ] Supabase (Free/Pro)
- [ ] Upstash (if over free)
- [ ] Resend (usage)
- [ ] Sentry (if Team)
- [ ] Stripe (transaction fees automatic)
- [ ] Domain renewal (annual)

Rough amounts: [`COSTS.md`](./COSTS.md).
