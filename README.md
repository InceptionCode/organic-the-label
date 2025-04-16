This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

// ✅ MVP FILE STRUCTURE

/ (root)
├── app/
│   ├── layout.tsx                    // RSC App Shell
│   ├── page.tsx                      // Explore page (home)
│   ├── product/[id]/page.tsx         // Dynamic product page (RSC)
│   ├── cart/page.tsx                 // Cart page (Client Component)
│   ├── checkout/route.ts             // Stripe session handler (Edge Function)
│   ├── api/
│   │   ├── stripe/checkout.ts        // Create checkout session
│   │   ├── user/preferences.ts       // Save preferences to Supabase + Turso
│   │   └── auth/route.ts             // Auth handler (Sign up, Login, JWT)
├── components/
│   ├── BeatPlayer.tsx                // Playable beat preview
│   ├── YouTubeEmbed.tsx              // Embed YT video with context
│   ├── ProductCard.tsx               // Product preview
│   ├── Header.tsx / Footer.tsx       // Site UI
│   └── CTA.tsx                       // Hero section CTA
├── lib/
│   ├── supabase.ts                   // Supabase client
│   ├── turso.ts                      // Turso client
│   ├── stripe.ts                     // Stripe client
│   └── schemas.ts                    // Zod + DB schema (already defined)
├── store/
│   └── useCart.ts                    // Zustand cart store
├── utils/
│   └── personalization.ts            // Local + remote sync utils
├── public/
│   └── sample-data.json              // Optional mock data for dev
├── middleware.ts                     // Middleware for edge personalization
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── .env.local                        // API Keys (Supabase, Stripe, Turso)
├── package.json
├── README.md                         // Setup + Dev Instructions
├── seed.ts                           // Seed script to load sample data
├── stripe-webhook.ts                 // Webhook for Stripe events (optional)
└── mock-supabase.ts                  // Mock Supabase logic for dev