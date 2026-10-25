// Fake, syntactically valid env so modules that import src/server/env.ts load under bun test.
// Real values are never used: every test mocks fetch or injects its own client.
const fake: Record<string, string> = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  SITE_URL: 'https://example.test',
  SHOPIFY_DEV_STORE_DOMAIN: 'test-store.myshopify.com',
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'shpat_test',
  SHOPIFY_STOREFRONT_API_VERSION: '2026-01',
}
for (const [key, value] of Object.entries(fake)) process.env[key] = value
for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RESEND_API_KEY', 'MAILERLITE_API_KEY']) {
  delete process.env[key]
}
