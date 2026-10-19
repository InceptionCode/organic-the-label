import { z } from 'zod'

// Server-only environment. Never import from client code (src/server is server-only).
// Validates on import so a misconfigured deploy fails at boot with every bad variable named.

const optional = z.string().min(1).optional()

const schema = z.object({
  // Supabase
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith('sb_publishable_'),
  SUPABASE_SECRET_KEY: z.string().startsWith('sb_secret_'),

  // Site origin, no trailing slash (used for auth email redirects)
  SITE_URL: z.url().refine((v) => !v.endsWith('/'), 'must not end with a slash'),

  // Shopify Storefront
  SHOPIFY_DEV_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_STOREFRONT_API_VERSION: z.string().regex(/^\d{4}-\d{2}$/, 'expected YYYY-MM'),

  // Optional at boot; services check these when first used
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  HCAPTCHA_SECRET_KEY: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM_SUPPORT: optional,
  EMAIL_FROM_DOWNLOADS: optional,
  SUPPORT_FORWARD_EMAIL: optional,
  MAILERLITE_API_KEY: optional,
  MAILERLITE_GROUP_NEWSLETTER_ID: optional,
  MAILERLITE_GROUP_FREE_RESOURCE_LEADS_ID: optional,
  MAILERLITE_GROUP_DOWNLOADED_STARTER_KIT_ID: optional,
  SPOTIFY_CLIENT_ID: optional,
  SPOTIFY_CLIENT_SECRET: optional,
  YOUTUBE_API_KEY: optional,
})

export type ServerEnv = z.infer<typeof schema>

function parse(): ServerEnv {
  // Treat empty strings as unset so optional vars left blank in .env files pass.
  const source = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ''),
  )
  const result = schema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join('.')} (${issue.message})`)
    throw new Error(`Invalid server environment: ${problems.join('; ')}`)
  }
  return Object.freeze(result.data)
}

export const env = parse()
