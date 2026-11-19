# Organic Sonics (Organic The Label)

A dynamic, personalized platform for music producers and artists featuring exclusive content, educational resources, and a marketplace for digital and physical products.

## About

Organic Sonics is a community-driven platform that connects music producers and artists. The website features an Explore page for signed-in and signed-out visitors, and recommendations for signed-in users that can be turned off in the account.

**Key Features:**

- **Home (`/`)**: Aurora-wave hero with a live preview playlist, featured kits, latest drop, and email signup (first visits get the scroll-scrub splash)
- **Storefront powered by Shopify (`/store`, `/store/$handle`)**:
  - Backed by the Shopify Storefront API
  - Filters for category, tags, exclusivity, and sort, plus search
  - Pagination using Shopify cursors (`hasNextPage` / `endCursor`)
  - Products parsed and validated before rendering
  - Cart drawer with quantity controls and handoff to Shopify checkout
  - Audio previews from the `custom.audio_preview_urls` metafield
  - Purchases grant entitlements through the `orders/paid` webhook (`apps/api`)
- **Compositions (`/compositions`)**: Free loop library with Instagram / YouTube embeds, URL-synced filters, and downloads
- **Free resources & newsletter (`/free`, `/newsletter`)**: Starter kit request and newsletter signup, synced to MailerLite with Resend delivery emails
- **Work With Me (`/work-with-me`)**: Spotify catalog, recent Instagram / YouTube posts, Muso.ai credits, and an inquiry form
- **Contact & support (`/contact`)**: Support form stored in Supabase, with status-change emails
- **Accounts (`/signup`, `/login`, `/account`)**: Supabase Auth (password, magic link, password reset) with hCaptcha; anonymous activity is merged into the account on sign-in
- **Explore (`/explore`)**: New kits, free loops, free resources, and membership, plus "Recommended for you" for signed-in users
- **Recommendations**: Rule-based, from the user's favorites and what they browse and play, on `/explore` and `/store`. Turned off with one checkbox on `/account`. No data goes to an outside service
- **Planned**: AI ranking on top of the rules, a premium membership tier, producer & artist discovery

## Repository layout

This is a bun workspace.

| Path | What it is |
|---|---|
| `apps/v2` | The website: TanStack Start on Vercel. Start with [apps/v2/docs/internal-docs/overview.md](./apps/v2/docs/internal-docs/overview.md) |
| `apps/api` | Webhooks and cron: Hono on Vercel. Never serves pages |
| `packages/content-schema` | Zod schemas and product taxonomy shared with the private admin app |
| `supabase/` | Config and SQL migrations |
| `docs/` | Release process, release checklist |
| `app/`, `lib/`, `features/`, `store/`, `ui-components/`, `utils/`, `tests/` and root config | The archived v1 Next.js app. It no longer deploys and has no CI jobs. Do not build on it |

## Local Development

### Prerequisites

- [bun](https://bun.sh) 1.4 (CI pins 1.4.2; the lockfile is `bun.lock`)
- Node.js 24 (Playwright and the `apps/api` runtime)
- A Supabase project (schema lives in `supabase/migrations`)
- A Shopify store with Storefront API access
- An Upstash Redis database, separate from production
- Resend and MailerLite accounts for email flows (optional for basic browsing)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd organic-the-label
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   Copy [`apps/v2/.env.example`](./apps/v2/.env.example) to `apps/v2/.env.development` (and [`apps/api/.env.example`](./apps/api/.env.example) for the worker), then fill in keys from your own dev dashboards. Never commit real secrets.

   ```bash
   cp apps/v2/.env.example apps/v2/.env.development
   ```

4. **Run the development server**

   ```bash
   bun run dev:v2
   ```

   The site runs on [http://localhost:3001](http://localhost:3001). `bun run dev:api` starts the worker.

### Available Scripts

Run these from the repo root.

**Develop**

- `bun run dev:v2` / `bun run dev:api` - Start the site or the worker
- `bun run --cwd apps/v2 build` - Production build of the site
- `bun run --cwd apps/v2 preview` - Serve that build locally

**Quality**

- `bun run lint:v2` - ESLint for the site (zero warnings allowed)
- `bun run type-check:v2` / `bun run type-check:api` - TypeScript with `--noEmit`
- `bun run --cwd apps/v2 check:entry` - Fails when the entry bundle is over its 150 KB gzip budget (run after a build)

**Tests** (see [apps/v2/docs/internal-docs/testing.md](./apps/v2/docs/internal-docs/testing.md))

- `bun run --cwd apps/v2 test` - Site unit tests (bun test)
- `bun run --cwd apps/v2 test:e2e` - Playwright, on its own sandboxed server at port 3101; emails and MailerLite calls are recorded, never sent
- `bun run --cwd apps/v2 test:e2e:smoke` - The `@smoke` subset
- `bun run --cwd apps/api test` - Worker tests

**Release** (see [docs/release-process.md](./docs/release-process.md))

- `GITHUB_TOKEN="$(gh auth token)" bun run release` - Bump version, update `CHANGELOG.md`, commit, and tag. A major version uses the override path in the release doc
- `bun run changelog` - Print the unreleased changelog section

## Tech Stack

- **Framework**: TanStack Start, TanStack Router and TanStack Query on Vite, with server-side rendering
- **UI**: React 19, Tailwind CSS 4, Bebas Neue and Inter
- **Language**: TypeScript
- **Validation**: Zod
- **Data & auth**: Supabase (Auth, PostgreSQL with row-level security)
- **Cache**: Upstash Redis and the Vercel CDN
- **Commerce**: Shopify Storefront API
- **Email**: Resend (transactional) and MailerLite (lists)
- **Social**: Spotify Web API, YouTube Data API, Instagram Graph API (token refreshed by an `apps/api` cron)
- **Bot protection**: hCaptcha
- **Worker**: Hono (`apps/api`)
- **Testing**: bun test, Playwright, axe
- **Commits & releases**: husky and commitlint (Conventional Commits), git-cliff (see `CONTRIBUTING.md`)

## Deploy

`apps/v2` and `apps/api` deploy to Vercel as separate projects. `main` is production (organicsonics.com) and `dev` is staging (dev.organicsonics.com). After a v2 deployment, `.github/workflows/post-deploy-flush.yml` flushes that environment's Redis and CDN caches. CI, environments and secrets: [apps/v2/docs/internal-docs/ci-cd.md](./apps/v2/docs/internal-docs/ci-cd.md).
