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
| `SANITY_REVALIDATE_SECRET` | optional for local; **required in prod** for publish→site updates | Shared secret for `POST /api/revalidate` |

Copy from `.env.example` into `.env.local`. Without `NEXT_PUBLIC_SANITY_PROJECT_ID`, `/studio` shows a setup message and **`npm run build` still passes**.

## On-demand revalidation

Publish in Studio should update public pages without a full redeploy.

1. Set `SANITY_REVALIDATE_SECRET` (long random string) in Vercel env.
2. In [Sanity project → API → Webhooks](https://www.sanity.io/manage), create a webhook:
   - **URL:** `https://96nation.net/api/revalidate` (or preview host)
   - **Trigger:** Create / Update / Delete on dataset
   - **Filter (example):** `_type in ["event", "page", "siteSettings", "gallery", "video"]`
   - **Projection (optional):** `{_type, "slug": slug.current}`
   - **Auth:** `Authorization: Bearer <SANITY_REVALIDATE_SECRET>`  
     (or `?secret=` query / `x-sanity-revalidate-secret` header)
3. On success the route returns `{ ok: true, tags: [...], paths: [...] }` and calls `revalidateTag` / `revalidatePath`.

Cache tags used by the app:

| Tag | Content |
|-----|---------|
| `events` | Event list, detail, short links, home featured |
| `event:{slug}` | Single event detail |
| `site-settings` | Nav, home, about, default OG |
| `pages` / `page:{slug}` | CMS pages (privacy, terms, …) |
| `galleries` / `videos` | Media lists |

**Local test:**

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer $SANITY_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"_type":"event","slug":"sample-show"}'
```

Without the secret configured, the route returns **401** (build still succeeds).

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
