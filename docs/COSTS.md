# Estimated monthly SaaS costs

Order-of-magnitude **USD** for 96 Nation ticketing hub at expected scale (local events, low concurrent checkout). Not a quote — verify current pricing on each vendor’s site before budgeting.

**Assumption:** dozens to low thousands of tickets per event; not stadium scale.

---

## Fixed / platform (typical)

| Service | Free / low traffic | Typical paid step | Notes |
|---------|-------------------|-------------------|--------|
| **Vercel** | ~$0 Hobby | ~$20/mo Pro | Pro if commercial/team features or higher limits. Cron + serverless included on plan limits. |
| **Sanity** | Free growth tier often enough | Paid when over quota | Watch asset CDN / bandwidth if many large images. |
| **Supabase** | Free tier | ~$25/mo Pro | **Pro recommended** when holding real PII + better backups/PITR. |
| **Upstash Redis** | Free tier often enough | Pay-as-you-go | Rate limits only; tiny at this traffic. |
| **Resend** | Free tier then usage | Per-email after free quota | Domain verify required for production from-address. |
| **Sentry** | Free tier | Team plan if needed | **Required for live ticketing cutover** (alerting). |
| **Domain** | — | ~$10–20/**year** | Registrar; not monthly. |
| **GitHub** | Free private often enough | Team if needed | Repo hosting. |

**Rough platform floor (prod-ready):** ~$0–50/mo if free tiers suffice; **~$45–70/mo** if Vercel Pro + Supabase Pro + light extras.

---

## Variable — Stripe (primary cost driver)

| Item | Typical US card rate | Notes |
|------|----------------------|--------|
| Stripe processing | **2.9% + $0.30** per successful charge | Confirm current [Stripe pricing](https://stripe.com/pricing) for your country/account. |
| Refunds | Fees often not returned | Policy depends on Stripe + card networks. |
| Payouts / disputes | Extra if chargebacks | Rare at small scale; monitor Dashboard. |

### Example (illustrative only)

| Scenario | Gross ticket revenue | Stripe fees (approx.) |
|----------|----------------------|------------------------|
| 100 × $7 tickets (+ $1 facility fee → $8 checkout) | $800 | ~$100 × ($0.30 + 2.9%×$8) ≈ **$53** |
| 500 × $7 (+ fee) | $4,000 | ~**$266** |

Facility fee (`FACILITY_FEE_CENTS`, default 100) is collected as a separate Checkout line item for **paid** orders; it does not change Stripe’s percentage structure.

Free/RSVP events: **no Stripe fee** (no charge).

---

## Email volume (Resend)

| Traffic | Notes |
|---------|--------|
| Confirmation per paid/RSVP order | 1 buyer email |
| Admin notify per form | 1 to `ADMIN_NOTIFY_EMAIL` |
| Low hundreds of emails/month | Often within free tier |

Failed sends should not block webhooks (outbox pattern); still monitor bounce/spam after domain auth.

---

## What is *not* in this estimate

- Engineer time / training Loom.
- Legal review of Privacy / Terms.
- SMS (out of scope v1).
- Barcode scanners / door hardware.
- Multi-region or enterprise support contracts.

---

## Who pays

Post-handoff: **owner organization pays all invoices**.  
Engineer may remain technical contact until the date in [`CREDENTIALS_MAP.md`](./CREDENTIALS_MAP.md).

---

## Cost control tips

1. Keep Stripe **test mode** on preview; live keys only on production.
2. Prefer YouTube/Vimeo embeds over Sanity large video files.
3. Compress hero/gallery images; always set alt text.
4. Supabase Pro when you need reliable backups for PII — cheaper than a breach/recovery incident.
5. Disable ticketing (`NEXT_PUBLIC_TICKETING_ENABLED=false`) rather than leaving broken live checkout (see RUNBOOK).
