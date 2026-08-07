# 96 Nation — Ticketing Hub

Mobile-first ticketing and content site for **96nation.net**: events, checkout, Genesis forms, and owner admin.

Stack (target): **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS v4**, Sanity, Supabase, Stripe, Resend, Vercel.

System design lives in [`DESIGN.md`](./DESIGN.md).

## Prerequisites

- Node.js 20+ and npm
- Accounts for SaaS services listed under Phase 0 (not required to run the hello scaffold)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill values as integrations land
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the **96 Nation** hello page with Tailwind utility styles applied.

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint
```

## Phase 0 checklist (ops — not a code PR)

Before production cutover, complete the foundations checklist in [`DESIGN.md`](./DESIGN.md#phase-0--foundations-ops-checklist-not-a-code-pr):

- [ ] Registrar / DNS owner named
- [ ] Domain pointing when ready (feature-complete on `*.vercel.app` without custom domain)
- [ ] Create projects: **Vercel**, **Sanity**, **Supabase**, **Stripe** (test), **Resend**, **Upstash**, **Sentry**
- [ ] Resend domain verify (SPF/DKIM) before real email
- [ ] Env matrix: local / preview / production — see **Appendix E** in `DESIGN.md` and [`.env.example`](./.env.example)

Custom domain DNS is **not** a merge blocker for early PRs.

## Project layout

```text
app/                 # Next.js App Router
  layout.tsx
  page.tsx           # Hello / brand placeholder
  globals.css        # @import "tailwindcss"
public/
postcss.config.mjs   # @tailwindcss/postcss
.env.example
DESIGN.md
```

Product routes (events, checkout, admin, studio) land in later PRs per the design rollout.

## License / ownership

Private project for 96 Nation.
