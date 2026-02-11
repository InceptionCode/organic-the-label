# Organic The Label

A dynamic, personalized platform for music producers and artists featuring exclusive content, educational resources, and a marketplace for digital and physical products.

## About

Organic The Label is a community-driven platform that connects music producers and artists. The website features a personalized "explore" page that serves as the home screen, designed to encourage users to sign up for the email list and accept personalization by subscribing to a free membership tier.

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
│   ├── account/                      # User account pages (dashboard, reset password)
│   ├── api/                          # API routes (auth, store, webhooks, etc.)
│   ├── components/                   # Shared layout + marketing components
│   ├── store/                        # Storefront pages and components
│   │   ├── components/               # Store filters, product grid, cart UI
│   │   └── page.tsx                  # Store landing page backed by Shopify
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Explore/Home page
│   ├── global-error.tsx              # Global error boundary
│   └── not-found.tsx                 # 404 page
├── lib/                              # Utility libraries
│   ├── font-tags.ts                  # Font configuration
│   ├── schemas.ts                    # Zod schemas (products, users, entitlements, etc.)
│   ├── stripe.ts                     # Stripe client
│   ├── Shopify/                      # Shopify Storefront API integration (client, queries, cache)
│   ├── store/                        # Shared state + adapters
│   │   ├── auth-store.ts             # Auth store (Zustand vanilla)
│   │   ├── cart-store.ts             # Cart store (Zustand vanilla)
│   │   └── parse-store-data.ts       # Normalize Shopify responses into Product[]
│   └── supabase/                     # Supabase clients
│       ├── client-base.ts
│       └── server-base.ts
├── store/                            # React context providers over stores
│   ├── auth-context.tsx              # Auth context provider (wraps auth-store)
│   └── cart-context.tsx              # Cart context provider (wraps cart-store)
├── ui-components/                    # Reusable UI components
│   ├── alert-dialog.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── text-field.tsx
│   ├── theme-provider.tsx
│   └── tooltip.tsx
├── utils/                            # Utility functions
│   ├── helpers/
│   │   └── checks.ts
│   ├── hooks/
│   │   ├── use-get-user.ts
│   │   ├── use-sign-out.ts
│   │   └── use-storage.ts
│   └── supabase/
│       └── middleware.ts             # RSC middleware helpers
├── public/                           # Static assets
│   ├── *.svg                         # SVG icons
│   └── sample-data.json              # Mock data for development
├── middleware.ts                     # Next.js middleware
├── mock-supabase.ts                  # Mock Supabase for testing
├── seed.ts                           # Database seeding script
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── postcss.config.mjs                # PostCSS configuration
├── components.json                   # Component configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Commerce**: Shopify Storefront API + Storefront API Client (`@shopify/storefront-api-client`)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Radix UI

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Shopify Storefront API (GraphQL)](https://shopify.dev/docs/api/storefront/2026-01)
- [Shopify Storefront API Client for JavaScript](https://www.npmjs.com/package/@shopify/storefront-api-client)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
