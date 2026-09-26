# Organic Sonics (Organic The Label)

A dynamic, personalized platform for music producers and artists featuring exclusive content, educational resources, and a marketplace for digital and physical products.

## About

Organic Sonics is a community-driven platform that connects music producers and artists. The website features a personalized "explore" page that serves as the home screen, designed to encourage users to sign up for the email list and accept personalization by subscribing to a free membership tier.

**Key Features:**

- **Home (`/`)**: Aurora-wave hero, featured kits, latest drop, stats bar, and email signup (first visits get the scroll-scrub splash)
- **Storefront powered by Shopify (`/store`, `/store/[handle]`)**:
  - Backed by the Shopify Storefront API
  - Filters for category, tags, exclusivity, and sort (price, title, created_at), plus search
  - Pagination using Shopify cursors (`hasNextPage` / `endCursor`)
  - Products normalized and validated via Zod before rendering
  - Cart drawer with quantity controls and handoff to Shopify checkout
  - Audio previews from the `custom.audio_preview_urls` metafield
  - Purchases grant entitlements through the `orders/paid` webhook
- **Compositions (`/compositions`)**: Free loop library with Instagram / YouTube embeds, URL-synced filters, and instant zip downloads
- **Free resources & newsletter (`/free`, `/newsletter`)**: Starter kit request and newsletter signup, synced to MailerLite with Resend delivery emails
- **Work With Me (`/work-with-me`)**: Spotify catalog, recent Instagram / YouTube posts, Muso.ai credits, and an inquiry form
- **Contact & support (`/contact`)**: Support form stored in Supabase, with status-change emails
- **Accounts (`/signup`, `/login`, `/account`)**: Supabase Auth (password, magic link, password reset) with hCaptcha; anonymous activity is merged into the account on sign-in
- **Explore (`/explore`)**: Personalized discovery page (news, community, discovery, resources, membership upsell) behind `NEXT_PUBLIC_EXPLORE_*` feature flags; shows a coming-soon state while disabled
- **Personalized Store Experience**: Membership-aware upsell and messaging (`MembershipContent`) and recommendations (`Recommendations`)
- **Planned**: Premium membership tier, producer & artist discovery, and deeper YouTube post pages

## Shopify Storefront Integration

The store experience is backed by the **Shopify Storefront API**, with a thin integration layer in `lib/Shopify` and the `/store` route.

- **GraphQL Query & Types**
  - `lib/Shopify/queries.ts` defines all GraphQL queries and `PageResponse` types.
- **Normalization & Validation**
  - `lib/schemas.ts` defines Zod schemas used for normalization and validation between the client and server.
  - Any parsing errors are surfaced with context to help debug upstream Shopify data.



## Local Development



### Prerequisites

- Node.js 20.9 or higher (Next.js 16 minimum; CI runs Node 23)
- pnpm 10 (CI uses pnpm 10; the lockfile is `pnpm-lock.yaml`)
- Supabase project (schema lives in `supabase/migrations`)
- Shopify store with Storefront API access tokens
- Resend and MailerLite accounts for email flows (optional for basic browsing)



### Setup

1. **Clone the repository**
  ```bash
   git clone <repository-url>
   cd organic-the-label
  ```
2. **Install dependencies**
  ```bash
   pnpm install
  ```
3. **Set up environment variables**
  Copy [`.env.example`](./.env.example) to `.env.local` in the project root, then replace the placeholders with keys from your own Supabase, Shopify, and email dashboards. Never commit real secrets.
  ```bash
  cp .env.example .env.local
  ```
4. **Run the development server**

```bash
 pnpm dev
```

 This starts Next.js with Turbopack on [http://localhost:3000](http://localhost:3000). It does **not** seed data; use `pnpm generate-dev` to load sample product data into Supabase first (it also starts the dev server with the Node inspector attached).

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

**App**

- `pnpm dev` - Start the Next.js dev server (Turbopack)
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm serve` - Build and start the production server
- `pnpm generate-dev` - Seed sample product data, then start the dev server with `--inspect`
- `pnpm generate-seed` - Seed sample product data (`seed.ts`) into Supabase

**Seeding** (copy the matching `*.example.ts` file first; the real seed files are gitignored)

- `pnpm seed:free-resources:dev` / `pnpm seed:free-resources:prod`
- `pnpm seed:compositions:dev` / `pnpm seed:compositions:prod`

**Quality**

- `pnpm lint` / `pnpm lint:fix` - ESLint (zero warnings allowed)
- `pnpm type-check` / `pnpm type-check:watch` - TypeScript with `--noEmit`

**Tests** (see [tests/README.md](./tests/README.md))

- `pnpm test` - All Vitest tests
- `pnpm test:unit` / `pnpm test:integration` / `pnpm test:watch` / `pnpm test:coverage`
- `pnpm test:ci` - Unit then integration (what PR CI runs)
- `pnpm test:e2e` / `pnpm test:e2e:smoke` - Playwright (starts or reuses `pnpm dev`)
- `pnpm test:e2e:cold` - Kill port 3000, clear `.next`, run Playwright as CI does
- `pnpm test:all` - `test:ci` + `test:e2e:cold`

**Release** (see [docs/release-process.md](./docs/release-process.md))

- `pnpm release` - Bump version, regenerate `CHANGELOG.md`, commit, and tag
- `pnpm changelog` - Regenerate `CHANGELOG.md` with git-cliff

### Project Structure

```
/ (root)
├── app/                              # Next.js App Router
│   ├── store/                        # Shopify-backed storefront
│   │   ├── [handle]/                 # Product detail page (PDP) + product components
│   │   ├── components/               # Filters, grid, cart widget, layout pieces
│   │   ├── page.tsx                  # Collection / store listing
│   │   └── store-layout.tsx
│   ├── account/                      # Account page (unverified-email banner)
│   ├── compositions/                 # Free loop library
│   ├── contact/                      # Support form
│   ├── explore/                      # Feature-flagged personalized page
│   ├── free/                         # Starter kit request
│   ├── login/                        # Sign in, magic link, reset password
│   ├── newsletter/
│   ├── search/                       # Search dialog
│   ├── signup/
│   ├── work-with-me/                 # Services, credits, inquiry form
│   ├── global-error-test/            # Dev-only error UI experiments
│   ├── api/                          # Route handlers + colocated server modules
│   │   ├── activity/track/           # Activity event ingestion
│   │   │   ├── auth/                     # Bootstrap, confirm, init; sign-in/up, magic link, reset actions
│   │   ├── composition/download/     # Zip + stream composition files
│   │   ├── cron/                     # Instagram token refresh (weekly, see vercel.json)
│   │   ├── email/                    # Newsletter subscribe
│   │   ├── instagram/                # Media proxy
│   │   ├── membership-cta/dismiss/
│   │   ├── resources/                # Free resource requests
│   │   ├── store/                    # Products, cart CRUD, entitlements, revalidation, orders/paid
│   │   ├── support/                  # Support request intake
│   │   └── webhooks/                 # MailerLite, compositions, support status
│   ├── components/                   # App chrome & marketing sections (navbar, cart, hero, etc.)
│   │   └── auth/                     # hCaptcha, magic link, reset-password UI
│   ├── styles/
│   │   └── globals.css               # Global / Tailwind entry (with brand tokens)
│   ├── layout.tsx
│   ├── page.tsx                      # Home (featured kits, latest drop, etc.)
│   ├── global-error.tsx
│   └── not-found.tsx
├── features/                         # Feature slices (co-located UI + config) / feature flags, mock data, types
│   └── explore/                      # Explore sections + NEXT_PUBLIC_EXPLORE_* flags
├── lib/                              # Domain logic & integrations
│   ├── Shopify/                      # Storefront client, GraphQL queries/mutations, caches
│   ├── composition/                  # Composition cache + embed URL helpers
│   ├── email/                        # Resend + MailerLite clients, contact sync
│   ├── instagram/                    # Token + media fetch
│   ├── membership-cta/               # CTA visibility helpers
│   ├── product/                      # Filter / search param builders
│   ├── filters/                      # Shared filter types
│   ├── spotify/                      # Artist catalog
│   ├── store/                        # Zustand stores (auth, cart, activity), cart cookie, parsers
│   ├── supabase/                     # Profiles, anon visitor flow, activity insert, Zod schemas
│   ├── validation/                   # Email, support, work-with-me Zod schemas
│   ├── work-with-me/                 # Page content, embeds, recent posts
│   ├── youtube/                      # Channel fetch
│   ├── schemas.ts                    # Zod schemas (products, users, entitlements, …)
│   ├── constants.ts
│   ├── font-tags.ts
│   └── utils.ts
├── store/                            # Auth/cart providers, InitAuthStore, ActivityHydrator
├── ui-components/                    # Shared primitives (Radix-based), audio/hero helpers, icons/
├── utils/                            # helpers/, hooks/, supabase/ (browser, server, admin clients + session middleware)
├── supabase/                         # config.toml + SQL migrations
├── public/                           # Static assets
│   ├── brand-assets/                 # Logos & brand reference (preferred over placeholders)
│   ├── organic-sonics-hero/          # Scroll-scrub hero frames
│   ├── *.svg
│   └── sample-data.json
├── docs/                             # Release process, release checklist, testing strategy
│   └── internal-docs/                # Gitignored: Supabase, Shopify ops, auth flow, cart, Instagram, testing blueprint
├── tests/                            # Vitest unit/integration + Playwright e2e (see tests/README.md)
├── scripts/
│   └── release.sh                    # Used by `pnpm release`
├── seed.ts, seed-*.example.ts        # Seed scripts (copy examples to seed-*.ts, gitignored)
├── vercel.json                       # Cron schedule
├── .github/                          # CI workflows, PR templates
├── .env.example                      # Env var template (copy to .env.local)
├── proxy.ts                          # Next.js 16 proxy (session refresh via utils/supabase/middleware)
├── playwright.config.ts / vitest.config.ts
```



### Testing folder structure (overview)

Application code lives at the **repository root** (there is no `src/` directory). Conventions: [docs/testing-strategy.md](./docs/testing-strategy.md) and [tests/README.md](./tests/README.md).

```
tests/
├── unit/                  # Pure logic — no DOM, no network
├── integration/           # Component behavior — DOM, mocked network (MSW)
├── e2e/                   # Playwright against the running app
├── fixtures/              # Typed reusable data (products, users, cart, compositions)
├── mocks/                 # MSW handlers + server
├── utils/                 # Custom render + fixture factories
└── README.md
```



## Tech Stack

**Application**

- **Framework**: Next.js 16 (App Router, Turbopack in `pnpm dev`, `proxy.ts` for the network boundary)
- **UI**: React 19 with `babel-plugin-react-compiler`
- **Language**: TypeScript 5

**Styling & UI**

- **CSS**: Tailwind CSS 4 (`@tailwindcss/postcss`), PostCSS, Autoprefixer; `tailwind-merge`, `tailwind-variants`, `tw-animate-css`, `clsx`
- **Primitives**: Radix UI, **class-variance-authority** (CVA)
- **Theming**: `next-themes`
- **Icons & motion**: Lucide React, Heroicons, Framer Motion
- **Shaders**: `@paper-design/shaders-react` (grain gradient hero)
- **Bot protection**: `@hcaptcha/react-hcaptcha`

**Data, auth & integrations**

- **Supabase**: `@supabase/supabase-js`, `@supabase/ssr` (Auth, PostgreSQL, server/client helpers)
- **Commerce**: `@shopify/storefront-api-client` (Storefront API `2026-01`)
- **Email**: Resend (transactional) + MailerLite (contacts, groups, webhooks)
- **Social**: Spotify Web API, YouTube Data API, Instagram Graph API (token refreshed by a Vercel cron)
- **Zips**: `fflate` for composition downloads

**Forms & validation**

- **Conform**: `@conform-to/react`, `@conform-to/zod` with **Zod** 4

**State**

- **Client state**: Zustand

**Development & quality**

- **Lint / format**: ESLint 9, `eslint-config-next`, Prettier
- **Unit / component testing**: Vitest, Testing Library, jsdom, MSW (see `tests/README.md` and `docs/testing-strategy.md`)
- **E2E**: Playwright
- **Commits & releases**: husky + commitlint (Conventional Commits), git-cliff (see `CONTRIBUTING.md`)
- **Screenshots / automation**: Puppeteer (`screenshot.mjs`)



## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shopify Storefront API (GraphQL)](https://shopify.dev/docs/api/storefront/2026-01)
- [Shopify Storefront API Client for JavaScript](https://www.npmjs.com/package/@shopify/storefront-api-client)



## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.