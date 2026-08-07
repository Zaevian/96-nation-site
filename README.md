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

## Sanity Studio

Embedded CMS at **[http://localhost:3000/studio](http://localhost:3000/studio)** when env is set:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
# optional:
SANITY_API_READ_TOKEN=
```

Without a project id, `/studio` shows setup instructions and the production build still succeeds. Schemas, desk structure, seed steps: [`docs/SANITY.md`](./docs/SANITY.md).

## Project layout

```text
app/                 # Next.js App Router
  layout.tsx
  page.tsx           # Hello / brand placeholder
  studio/[[...tool]] # Embedded Sanity Studio
  globals.css        # @import "tailwindcss"
lib/sanity/          # client, env, image helpers
sanity/              # schemaTypes, desk structure
sanity.config.ts
docs/SANITY.md       # seed + publish checklist
public/
postcss.config.mjs   # @tailwindcss/postcss
.env.example
DESIGN.md
```

Marketing routes, checkout, and `/admin` land in later PRs per the design rollout.

## License / ownership

Private project for 96 Nation.
