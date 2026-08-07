# Sanity CMS — setup, Studio, and seed

Embedded Studio route: **`/studio`**.

## Required environment

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | yes | From [sanity.io/manage](https://www.sanity.io/manage) |
| `NEXT_PUBLIC_SANITY_DATASET` | yes | Usually `production` (or `development` locally) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | yes | e.g. `2025-01-01` |
| `SANITY_API_READ_TOKEN` | optional | Draft/preview reads on the server |
| `SANITY_PREVIEW_SECRET` | optional | Presentation / draft preview (later) |
| `SANITY_REVALIDATE_SECRET` | optional | On-demand revalidation webhook |

Copy from `.env.example` into `.env.local`. Without `NEXT_PUBLIC_SANITY_PROJECT_ID`, `/studio` shows a setup message and **`npm run build` still passes**.

## Content model

| Type | Purpose |
|------|---------|
| `siteSettings` | Singleton: brand, home hero, about, nav, social, default OG |
| `page` | Static pages (Privacy, Terms, Genesis long-form, …) |
| `event` | Tickets, venue, shortCode, status draft/published/cancelled |
| `gallery` | Image sets with required alt text |
| `video` | **externalUrl** (YouTube/Vimeo) — no file upload default |
| `formConfig` | Optional form chrome / success copy for Genesis & contact |

### Event publish validation

Required for a clean event publish:

- `title`, `slug`, `startAt`
- `heroImage` (+ alt)
- ≥1 `ticketTypes` with `id`, `name`, `priceCents`, `capacity`, `maxPerOrder`
- Unique ticket type `id`s within the event
- When `status` is `published`: OG image or hero for share cards

Drafts may be saved with validation errors; fix red errors before publishing.

### Video

Set **Video URL** to a YouTube or Vimeo link. Provider is `youtube` / `vimeo`. Do not rely on Sanity file uploads for promo video.

## Seed instructions (manual)

There is no automated seed script in v1. After connecting a project:

1. Open `/studio` and sign in with your Sanity account (invite the owner).
2. **Site settings** (singleton in the desk):
   - Site title `96 Nation`, timezone `America/New_York`
   - Home hero title/subtitle and default OG image
   - Social links (Instagram, etc.)
3. **Pages** — create slugs such as:
   - `privacy`, `terms`, `about` (if not only in site settings), `genesis`
4. **Event** (draft first):
   - Title + generate slug
   - `startAt` in the future
   - One ticket type: id `general`, name `General Admission`, `priceCents` `700`, `capacity` `100`, `maxPerOrder` `8`
   - Hero image with alt
   - Optional `shortCode` e.g. `SHOW1` → later `/t/SHOW1`
   - Status **Draft** until ready, then **Published** + Studio Publish
5. **Gallery** — a few images, each with alt.
6. **Video** — title, slug, `externalUrl` to a YouTube or Vimeo promo.
7. **Form config** (optional) — `genesis-signup`, `service-inquiry`, `contact`.

CORS: add `http://localhost:3000` and your Vercel preview/production origins in the Sanity project API settings.

## Desk structure

- How to publish (in-app tip)
- Site settings (singleton `siteSettings`)
- Events, Pages, Galleries, Videos, Form configs

## CLI

```bash
# with env set
npx sanity dataset list
npx sanity schema extract   # optional
```

`sanity.cli.ts` reads the same `NEXT_PUBLIC_SANITY_*` variables.
