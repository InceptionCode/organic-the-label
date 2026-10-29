import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Test-side environment. Values are read from apps/v2/.env.development (the DEV Supabase project)
// and never printed. The suite refuses to run when that Supabase URL equals the production one in
// the repo root .env.production, so a misconfigured file can never point the cleanup at production.

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (!match) continue
    out[match[1]!] = match[2]!.replace(/^["']|["']$/g, '')
  }
  return out
}

const fileEnv = { ...parseEnvFile(resolve(APP_DIR, '.env.development')), ...parseEnvFile(resolve(APP_DIR, '.env.development.local')) }
const value = (name: string) => process.env[name] || fileEnv[name] || ''

/** A non-secret config value the app under test also reads (MailerLite group ids, email senders). */
export const appConfig = (name: 'MAILERLITE_GROUP_NEWSLETTER_ID' | 'MAILERLITE_GROUP_FREE_RESOURCE_LEADS_ID' | 'MAILERLITE_GROUP_DOWNLOADED_STARTER_KIT_ID' | 'SUPPORT_FORWARD_EMAIL' | 'EMAIL_FROM_SUPPORT' | 'EMAIL_FROM_DOWNLOADS') =>
  value(name)

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || 'e2e+v2@organicsonics.com'
/** Every address the suite creates matches this LIKE pattern, so teardown can find them all. */
export const E2E_EMAIL_LIKE = 'e2e+%@organicsonics.com'

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3101'
/** True when Playwright runs against its own sandboxed dev server (no E2E_BASE_URL). */
export const IS_LOCAL_SANDBOX = !process.env.E2E_BASE_URL

/** A unique sandbox address for one test, e.g. e2e+free-lq3k9x@organicsonics.com. */
export function sandboxEmail(label: string): string {
  return `e2e+${label}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@organicsonics.com`
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

export function supabaseConfig() {
  const url = value('VITE_SUPABASE_URL')
  const secretKey = value('SUPABASE_SECRET_KEY')
  if (!url || !secretKey) throw new Error('E2E needs VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in apps/v2/.env.development')

  const production = parseEnvFile(resolve(APP_DIR, '..', '..', '.env.production'))
  const prodUrl = production.NEXT_PUBLIC_SUPABASE_URL || production.SUPABASE_URL || production.VITE_SUPABASE_URL || ''
  if (prodUrl && hostOf(prodUrl) === hostOf(url)) {
    throw new Error('Refusing to run: the E2E Supabase project matches the production project. Use the dev project only.')
  }
  return { url, secretKey }
}

/** Shopify product GID for a handle, read from the dev Storefront API with the app's own token. */
export async function productGid(handle: string): Promise<string> {
  const domain = value('SHOPIFY_DEV_STORE_DOMAIN').replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const version = value('SHOPIFY_STOREFRONT_API_VERSION')
  const token = value('SHOPIFY_STOREFRONT_ACCESS_TOKEN')
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Shopify-Storefront-Private-Token': token },
    body: JSON.stringify({ query: 'query($h: String!) { product(handle: $h) { id } }', variables: { h: handle } }),
  })
  const json = (await res.json()) as { data?: { product?: { id: string } | null } }
  const id = json.data?.product?.id
  if (!id) throw new Error(`No Shopify product for handle ${handle}`)
  return id
}
