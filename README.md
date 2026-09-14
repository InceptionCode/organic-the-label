# Organic Sonics (Organic The Label)

A dynamic, personalized platform for music producers and artists featuring exclusive content, educational resources, and a marketplace for digital and physical products.

## About

Organic Sonics is a community-driven platform that connects music producers and artists. The website features a personalized "explore" page that serves as the home screen, designed to encourage users to sign up for the email list and accept personalization by subscribing to a free membership tier.

**Key Features:**

- **Personalized Explore/Home Page**: Dynamic homepage showing recent producer and artist news, forum/discord discussions, and the latest kits, packs, and resources
- **Free Subscription Incentives**: Exclusive advice, tips, educational videos, free resources, and reminders for future events and deals
- **Producer & Artist Discovery**: Tools to find and connect with producers and artists
- **YouTube Integration**: Dedicated pages for deeper discussions and details behind YouTube posts
- **Storefront powered by Shopify**:
  - `/store` page backed by Shopify Storefront API
  - Filters for category, tags, exclusivity, and sort (price, title, created_at)
  - Pagination using Shopify cursors (`hasNextPage` / `endCursor`)
  - Products normalized and validated via Zod before rendering
- **Personalized Store Experience**:
  - Membership-aware upsell and messaging (`MembershipContent`)
  - Future recommendations and deals based on user preferences (`Recommendations`)
- **Future Premium Membership**: Access to premium content and exclusive features



## Shopify Storefront Integration

The store experience is backed by the **Shopify Storefront API**, with a thin integration layer in `lib/Shopify` and the `/store` route.

- **GraphQL Query & Types**
  - `lib/Shopify/queries.ts` defines all GraphQL queries and `PageResponse` types.
- **Normalization & Validation**
  - `lib/schemas.ts` defines Zod schemas used for normalization and validation between the client and server.
  - Any parsing errors are surfaced with context to help debug upstream Shopify data.



## Local Development



### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm/yarn
- Supabase account and project
- Shopify Storefront SDK



### Setup

1. **Clone the repository**
  ```bash
   git clone <repository-url>
   cd organic-the-label
  ```
2. **Install dependencies**
  ```bash
   pnpm install
   # or
   npm install
  ```
3. **Set up environment variables**
  Copy `[.env.example](./.env.example)` to `.env.local` in the project root, then replace the placeholders with keys from your own Supabase, Shopify, and email dashboards. Never commit real secrets.
  ```bash
  cp .env.example .env.local
  ```
4. **Run the development server**

```bash
 pnpm dev
 # or
 npm run dev
```

 The dev server will:

- Generate seed data automatically
- Start the Next.js development server with Turbopack
- Run on [http://localhost:3000](http://localhost:3000)

1. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm serve` - Build and start production server
- `pnpm lint` - Run ESLint
- `pnpm generate-dev` - Start development server with seed data generation
- `pnpm generate-seed` - Generate seed data for development



### Project Structure

```
/ (root)
├── app/                              # Next.js App Router
│   ├── store/                        # Shopify-backed storefront
│   │   ├── [handle]/                 # Product detail page (PDP) + product components
│   │   ├── components/               # Filters, grid, cart widget, layout pieces
│   │   ├── page.tsx                  # Collection / store listing
│   │   └── store-layout.tsx
│   ├── global-error-test/            # Dev-only error UI experiments
│   ├── api/                          # Route handlers + colocated server modules
│   │   ├── activity/track/           # Activity event ingestion
│   │   ├── auth/                     # Bootstrap, confirm, init; magic link & user helpers
│   │   ├── composition/download/     # Zip + stream composition files
│   │   ├── cron/                     # Instagram token refresh
│   │   ├── email/                    # Newsletter subscribe
│   │   ├── instagram/                # Media proxy
│   │   ├── membership-cta/dismiss/
│   │   ├── resources/                # Free resource requests
│   │   ├── store/                    # Products, cart CRUD, entitlements, revalidation, orders
│   │   ├── support/
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
│   └── explore/                      # Explore sections
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
├── store/                            # Client providers & hydration
├── ui-components/                    # Shared primitives (Radix-based), audio/hero helpers, icons/
├── utils/
├── public/                           # Static assets
│   ├── brand-assets/                 # Logos & brand reference (preferred over placeholders)
│   ├── organic-sonics-hero/          # Scroll-scrub hero frames
│   ├── *.svg
│   └── sample-data.json
├── docs/                             # Runbooks (Supabase, Shopify, releases, testing)
│   └── internal-docs/                # Architecture notes (cart, Instagram, testing blueprint)
├── tests/                            # Vitest unit/integration + Playwright e2e (see tests/README.md)
├── scripts/
│   └── release.sh
├── .github/                          # CI workflows, PR templates
├── .env.example                      # Env var template (copy to .env.local)
├── proxy.ts                          # Next.js 16 proxy (session refresh via utils/supabase/middleware)
```



### Testing folder structure (overview)

Application code lives at the **repository root** (there is no `src/` directory). Conventions: `[docs/testing-strategy.md](./docs/testing-strategy.md)` and `[tests/README.md](./tests/README.md)`.

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
- **Icons & motion**: Lucide React, Framer Motion
- **Bot protection**: `@hcaptcha/react-hcaptcha`

**Data & auth**

- **Supabase**: `@supabase/supabase-js`, `@supabase/ssr` (Auth, PostgreSQL, server/client helpers)

**Forms & validation**

- **Conform**: `@conform-to/react`, `@conform-to/zod` with **Zod** 4

**State & HTTP**

- **Client state**: Zustand
- **HTTP**: Axios

**Development & quality**

- **Lint / format**: ESLint 9, `eslint-config-next`, Prettier
- **Unit / component testing**: Vitest, Testing Library, jsdom (see planned `tests/` layout in this README and `docs/testing-strategy.md`)
- **E2E**: Cypress
- **Screenshots / automation**: Puppeteer (`screenshot.mjs`)



## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shopify Storefront API (GraphQL)](https://shopify.dev/docs/api/storefront/2026-01)
- [Shopify Storefront API Client for JavaScript](https://www.npmjs.com/package/@shopify/storefront-api-client)



## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.