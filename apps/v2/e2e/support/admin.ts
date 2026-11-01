import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { E2E_EMAIL_LIKE, E2E_USER_EMAIL, supabaseConfig } from './env'

// Admin (secret key) access to the DEV Supabase project for setup, seeding, assertions and cleanup.
// Never used by the app under test. Nothing here sends an email: createUser with email_confirm and
// generateLink both skip the mailer.

let client: SupabaseClient | null = null

export function admin(): SupabaseClient {
  const { url, secretKey } = supabaseConfig()
  client ??= createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

export async function findUserByEmail(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin().auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (user) return user
    if (data.users.length < 200) return null
  }
  return null
}

/** The test user's username, as the signup form would store it (user_metadata.username). */
export const E2E_USERNAME = 'e2e_v2'

/** Idempotent: the dedicated E2E user, created confirmed (no email) when missing. No password. */
export async function ensureTestUser() {
  const existing = await findUserByEmail(E2E_USER_EMAIL)
  if (existing && existing.user_metadata?.username === E2E_USERNAME) return existing
  if (existing) {
    const { data, error } = await admin().auth.admin.updateUserById(existing.id, {
      user_metadata: { ...existing.user_metadata, username: E2E_USERNAME },
    })
    if (error || !data.user) throw new Error(`updateUserById failed: ${error?.message ?? 'no user'}`)
    return data.user
  }
  const { data, error } = await admin().auth.admin.createUser({
    email: E2E_USER_EMAIL,
    email_confirm: true,
    user_metadata: { username: E2E_USERNAME },
  })
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? 'no user'}`)
  return data.user
}

export async function testUserId(): Promise<string> {
  if (process.env.E2E_USER_ID) return process.env.E2E_USER_ID
  const user = await ensureTestUser()
  process.env.E2E_USER_ID = user.id
  return user.id
}

/** A one-time token hash for /auth/confirm. `generateLink` never sends an email. */
export async function generateTokenHash(type: 'magiclink' | 'recovery', email = E2E_USER_EMAIL): Promise<string> {
  const { data, error } = await admin().auth.admin.generateLink({ type, email })
  const hash = data?.properties?.hashed_token
  if (error || !hash) throw new Error(`generateLink(${type}) failed: ${error?.message ?? 'no token'}`)
  return hash
}

export async function contactByEmail(email: string) {
  const { data, error } = await admin()
    .from('email_contacts')
    .select('id, email, status, marketing_opt_in, unsubscribed_at')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  if (error) throw new Error(`email_contacts read failed: ${error.message}`)
  return data as { id: string; email: string; status: string; marketing_opt_in: boolean; unsubscribed_at: string | null } | null
}

export async function contactTags(contactId: string): Promise<string[]> {
  const { data } = await admin().from('email_contact_tags').select('tag').eq('contact_id', contactId)
  return (data ?? []).map((r: { tag: string }) => r.tag)
}

/** Deletes contacts (and their events; tags and resource_downloads cascade) for the given emails. */
export async function deleteContacts(emails: string[]) {
  if (emails.length === 0) return
  const lowered = emails.map((e) => e.toLowerCase())
  const { data } = await admin().from('email_contacts').select('id').in('email', lowered)
  const ids = (data ?? []).map((r: { id: string }) => r.id)
  if (ids.length) await admin().from('email_contact_events').delete().in('contact_id', ids)
  await admin().from('email_contacts').delete().in('email', lowered)
}

/** Removes the anonymous visitor a browser context created (activity_events cascade) and its loop downloads. */
export async function deleteVisitor(anonToken: string) {
  await admin().from('composition_downloads').delete().eq('anon_token', anonToken)
  await admin().from('anonymous_visitors').delete().eq('anon_token', anonToken)
}

export async function resetTestUserPreferences(userId: string) {
  await admin()
    .from('user_preferences')
    .update({ favorite_genres: [], favorite_product_types: [], marketing_opt_in: false, personalization_opt_in: false })
    .eq('user_id', userId)
}

/**
 * Global cleanup: every row the suite can create, found by the e2e+ address pattern or the test
 * user id. Safe to run repeatedly. Seeded entitlements are removed by their own tests; any left
 * behind by a crash (source 'manual', note e2e) are removed here too.
 */
export async function cleanupAll() {
  const db = admin()
  const userId = await testUserId()

  const { data: contacts } = await db.from('email_contacts').select('id').like('email', E2E_EMAIL_LIKE)
  const contactIds = (contacts ?? []).map((r: { id: string }) => r.id)
  if (contactIds.length) await db.from('email_contact_events').delete().in('contact_id', contactIds)
  await db.from('email_contacts').delete().like('email', E2E_EMAIL_LIKE)
  await db.from('support_requests').delete().like('email', E2E_EMAIL_LIKE)
  await db.from('activity_events').delete().eq('user_id', userId)
  await db.from('entitlements').delete().eq('user_id', userId).eq('source', 'manual')
  await resetTestUserPreferences(userId)
}
