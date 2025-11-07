# Organic The Label

A dynamic, personalized platform for music producers and artists featuring exclusive content, educational resources, and a marketplace for digital and physical products.

## About

Organic The Label is a community-driven platform that connects music producers and artists. The website features a personalized "explore" page that serves as the home screen, designed to encourage users to sign up for the email list and accept personalization by subscribing to a free membership tier. 

**Key Features:**
- **Personalized Explore/Home Page**: Dynamic homepage showing recent producer and artist news, forum/discord discussions, and the latest kits, packs, and resources
- **Free Subscription Incentives**: Exclusive advice, tips, educational videos, free resources, and reminders for future events and deals
- **Producer & Artist Discovery**: Tools to find and connect with producers and artists
- **YouTube Integration**: Dedicated pages for deeper discussions and details behind YouTube posts
- **Store Pages**: 
  - General store page
  - Separate pages for "Kits, Packs, & Banks" (digital products)
  - Physical merchandise store
- **Future Premium Membership**: Access to premium content and exclusive features

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm/yarn
- Supabase account and project
- Stripe account (for payment processing)

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
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Database (if using Turso)
   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
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

- `pnpm dev` - Start development server with seed data generation
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm serve` - Build and start production server
- `pnpm lint` - Run ESLint
- `pnpm generate-seed` - Generate seed data for development

### Project Structure

```
/ (root)
├── app/                              # Next.js App Router
│   ├── account/                      # User account pages
│   │   ├── page.tsx                  # Account dashboard
│   │   └── reset-password/           # Password reset flow
│   ├── api/                          # API routes
│   │   └── auth/                     # Authentication endpoints
│   │       ├── confirm/              # Email confirmation
│   │       ├── get-user.ts           # Get user data
│   │       ├── login.ts              # Login handler
│   │       ├── provider.ts           # Auth provider
│   │       ├── reset-password-request.ts
│   │       ├── sign-out.ts
│   │       └── update-user.ts
│   ├── components/                   # Shared components
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── profile-dropdown.tsx
│   ├── login/                        # Login page
│   ├── signup/                       # Signup page
│   ├── search/                       # Search functionality
│   ├── store/                        # Store pages
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Explore/Home page
│   ├── global-error.tsx              # Global error boundary
│   └── not-found.tsx                 # 404 page
├── lib/                              # Utility libraries
│   ├── font-tags.ts                  # Font configuration
│   ├── schemas.ts                    # Zod schemas
│   ├── stripe.ts                     # Stripe client
│   ├── store/                        # State management
│   │   ├── authStore.ts
│   │   └── index.ts
│   └── supabase/                     # Supabase clients
│       ├── client-base.ts
│       └── server-base.ts
├── store/                            # Global state
│   └── auth-context.tsx              # Auth context provider
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
│       └── middleware.ts
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

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Radix UI

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.