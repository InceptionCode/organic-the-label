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
- Stripe account (for payment processing)
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

   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   INTERNAL_SUPABASE_WEBHOOK_SECRET=your_webhook_secretkey

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Database (if using Turso)
   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token

   # Shopify Storefront
   SHOPIFY_DEV_STORE_DOMAIN=your-dev-store.myshopify.com
   SHOPIFY_PROD_STORE_DOMAIN=your-prod-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
   SHOPIFY_PUBLIC_ACCESS_TOKEN=your_storefront_public_token
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

5. **Open your browser**

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
│   ├── account/                      # Account dashboard
│   ├── explore/                      # Personalized explore route (+ page tracker)
│   ├── login/                        # Sign-in; reset-password sub-route
│   ├── signup/
│   ├── search/
│   ├── store/                        # Shopify-backed storefront
│   │   ├── [handle]/                 # Product detail page (PDP) + product components
│   │   ├── components/               # Filters, grid, cart widget, layout pieces
│   │   ├── page.tsx                  # Collection / store listing
│   │   └── store-layout.tsx
│   ├── global-error-test/            # Dev-only error UI experiments
│   ├── api/                          # Route handlers + colocated server modules
│   │   ├── activity/track/           # Activity event ingestion
│   │   ├── auth/                     # Bootstrap, confirm, init routes; magic link & user helpers
│   │   ├── membership-cta/dismiss/
│   │   └── store/                    # Products, cart CRUD, entitlements, revalidation, orders
│   ├── components/                   # App chrome & marketing sections (navbar, cart, hero, etc.)
│   │   └── auth/                     # hCaptcha, magic link, reset-password UI
│   ├── styles/
│   │   └── globals.css               # Global / Tailwind entry (with brand tokens)
│   ├── layout.tsx
│   ├── page.tsx                      # Home (featured kits, latest drop, etc.)
│   ├── global-error.tsx
│   └── not-found.tsx
├── features/                         # Feature slices (co-located UI + config)
│   └── explore/                      # Explore sections, feature flags, mock data, types
├── lib/                              # Domain logic & integrations
│   ├── Shopify/                      # Storefront client, GraphQL queries/mutations, caches
│   ├── store/                        # Zustand stores (auth, cart, activity), cart cookie, parsers
│   ├── supabase/                     # Profiles, anon visitor flow, activity insert, Zod schemas
│   ├── membership-cta/               # CTA visibility helpers
│   ├── product/                      # Filter / search param builders
│   ├── filters/                      # Shared filter types
│   ├── schemas.ts                    # Zod schemas (products, users, entitlements, …)
│   ├── constants.ts
│   ├── font-tags.ts
│   └── utils.ts
├── store/                            # Client providers & hydration
│   ├── auth-context.tsx
│   ├── cart-context.tsx
│   ├── activity-hydrator.tsx
│   └── init-auth-store.tsx
├── ui-components/                    # Shared primitives (Radix-based), audio/hero helpers, icons/
├── utils/                            # Cross-cutting helpers
│   ├── helpers/                      # checks, tokens, parsers; activity, analytics, Shopify utils
│   ├── hooks/                        # use-get-user, use-sign-out, use-storage, use-safe-parse-user
│   └── supabase/                     # Browser/server Supabase clients; session refresh (proxy)
├── public/                           # Static assets
│   ├── brand-assets/                 # Logos & brand reference (preferred over placeholders)
│   ├── *.svg
│   └── sample-data.json
├── docs/                             # Runbooks & internal notes (Supabase, Shopify, releases, testing)
├── supabase/
│   └── migrations/                   # Versioned SQL migrations
├── .github/                          # CI workflows, PR templates
├── proxy.ts                          # Next.js 16 proxy (session refresh via utils/supabase/middleware)
├── mock-supabase.ts                  # Mock Supabase for local/dev testing
├── seed.ts                           # Seed data script (pnpm generate-seed)
├── screenshot.mjs                    # Puppeteer screenshots against localhost (dev workflow)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json                   # shadcn-style component metadata
├── CLAUDE.md                         # Agent / frontend workflow notes for this repo
├── package.json
└── README.md                         # This file
```

### Testing folder structure (overview)

Planned layout for Vitest, Playwright, and shared test utilities. Application code in this repo lives at the **repository root** (there is no `src/` directory); `public/`, `proxy.ts`, and other config files live alongside the folders below. See `docs/testing-strategy.md` and `docs/testing-strategy.md` for conventions.

```
/
├── app/
├── ui-components/
├── features/
├── lib/
├── store/
├── utils/
│
├── tests/
│   ├── unit/
│   │   ├── cart/
│   │   ├── store/
│   │   ├── auth/
│   │   └── utils/
│   │
│   ├── integration/
│   │   ├── store/
│   │   ├── cart/
│   │   ├── auth/
│   │   └── membership/
│   │
│   ├── e2e/
│   │   ├── store.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── auth.spec.ts
│   │   └── membership.spec.ts
│   │
│   ├── fixtures/
│   │   ├── products.ts
│   │   ├── users.ts
│   │   ├── memberships.ts
│   │   └── sessions.ts
│   │
│   ├── mocks/
│   │   ├── shopify/
│   │   ├── supabase/
│   │   └── handlers.ts
│   │
│   ├── utils/
│   │   ├── render.tsx
│   │   ├── test-env.ts
│   │   ├── factories.ts
│   │   └── playwright/
│   │
│   └── README.md
│
├── playwright.config.ts
├── vitest.config.ts
├── vitest.setup.ts
└── .github/
    └── workflows/
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

**Visual effects (where used)**

- **WebGL / shaders**: `ogl`, `@paper-design/shaders-react`

**Data & auth**

- **Supabase**: `@supabase/supabase-js`, `@supabase/ssr` (Auth, PostgreSQL, server/client helpers)

**Commerce**

- **Shopify**: Storefront GraphQL via `@shopify/storefront-api-client`

**Forms & validation**

- **Conform**: `@conform-to/react`, `@conform-to/zod` with **Zod** 4

**State & HTTP**

- **Client state**: Zustand
- **HTTP**: Axios

**Payments**

- **Stripe**: Documented in environment variables for billing or future server flows; storefront purchases are Shopify-led

**Development & quality**

- **Lint / format**: ESLint 9, `eslint-config-next`, Prettier
- **Unit / component testing**: Vitest, Testing Library, jsdom (see planned `tests/` layout in this README and `docs/testing-strategy.md`)
- **E2E**: Cypress
- **Screenshots / automation**: Puppeteer (`screenshot.mjs`)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Shopify Storefront API (GraphQL)](https://shopify.dev/docs/api/storefront/2026-01)
- [Shopify Storefront API Client for JavaScript](https://www.npmjs.com/package/@shopify/storefront-api-client)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
