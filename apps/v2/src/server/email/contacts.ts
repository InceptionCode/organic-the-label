import type { SupabaseClient } from '@supabase/supabase-js'

// Port of v1 lib/email/sync-contact.ts (Supabase half). Shared by the newsletter and support
// services. The admin client is passed in so unit tests never touch env or the network.

export type SyncContactInput = {
  email: string
  /**
   * Fresh, explicit newsletter consent from this request. True subscribes (and may reactivate an
   * unsubscribed contact); false never claims or changes consent (see syncContact).
   */
  marketingConsent: boolean
  firstName?: string
  source?: string
  signupSource?: string
  tags?: string[]
  userId?: string
}

export type ContactRecord = {
  id: string
  mailerlite_subscriber_id: string | null
  status: string
  marketing_opt_in: boolean
}

const CONTACT_COLUMNS = 'id, mailerlite_subscriber_id, status, marketing_opt_in'

/** Statuses that mean "stop emailing me". Without fresh consent these are never re-added anywhere. */
export const SUPPRESSED_CONTACT_STATUSES: readonly string[] = ['unsubscribed', 'bounced', 'complained', 'deleted']

export const isSuppressedContact = (contact: Pick<ContactRecord, 'status'>) => SUPPRESSED_CONTACT_STATUSES.includes(contact.status)

/**
 * Creates or updates the email_contacts row, then adds tags.
 *
 * With consent: one upsert sets status 'subscribed', marketing_opt_in true and clears
 * unsubscribed_at (fresh consent may reactivate).
 *
 * Without consent (decided 2026-10-29): a read, then an insert or a neutral update. An upsert would
 * overwrite the consent columns on an existing row, and PostgREST cannot say "only when missing" per
 * column. A new contact is inserted as status 'subscribed' (it is a MailerLite subscriber in the
 * leads group, so delivery state is accurate) with marketing_opt_in false (no newsletter consent).
 * An existing contact keeps its status, marketing_opt_in and unsubscribed_at untouched: an opted-in
 * contact is never downgraded and an unsubscribed, bounced or complained one is never reactivated.
 */
export async function syncContact(client: SupabaseClient, input: SyncContactInput): Promise<ContactRecord> {
  const email = input.email.toLowerCase()
  const contact = input.marketingConsent ? await upsertConsentedContact(client, email, input) : await ensureContactWithoutConsent(client, email, input)

  if (input.tags?.length) {
    const { error: tagError } = await client
      .from('email_contact_tags')
      .upsert(
        input.tags.map((tag) => ({ contact_id: contact.id, tag })),
        { onConflict: 'contact_id,tag', ignoreDuplicates: true },
      )
    if (tagError) console.warn('[contacts] tag upsert failed:', tagError.message)
  }
  return contact
}

async function upsertConsentedContact(client: SupabaseClient, email: string, input: SyncContactInput): Promise<ContactRecord> {
  const row: Record<string, unknown> = {
    email,
    first_name: input.firstName ?? null,
    status: 'subscribed',
    marketing_opt_in: true,
    unsubscribed_at: null,
    source: input.source ?? 'website',
    signup_source: input.signupSource ?? null,
    updated_at: new Date().toISOString(),
  }
  if (input.userId) row.supabase_user_id = input.userId

  const { data, error } = await client
    .from('email_contacts')
    .upsert(row, { onConflict: 'email', ignoreDuplicates: false })
    .select(CONTACT_COLUMNS)
    .single()
  if (error || !data) throw new Error(`email_contacts upsert failed: ${error?.message ?? 'no row'}`)
  return data as ContactRecord
}

async function readContact(client: SupabaseClient, email: string): Promise<ContactRecord | null> {
  const { data, error } = await client.from('email_contacts').select(CONTACT_COLUMNS).eq('email', email).maybeSingle()
  if (error) throw new Error(`email_contacts read failed: ${error.message}`)
  return (data as ContactRecord | null) ?? null
}

async function ensureContactWithoutConsent(client: SupabaseClient, email: string, input: SyncContactInput): Promise<ContactRecord> {
  const now = new Date().toISOString()
  // Neutral fields only: never status, marketing_opt_in or unsubscribed_at. A missing first name does not clear a stored one.
  const neutral: Record<string, unknown> = {
    source: input.source ?? 'website',
    signup_source: input.signupSource ?? null,
    updated_at: now,
  }
  if (input.firstName) neutral.first_name = input.firstName
  if (input.userId) neutral.supabase_user_id = input.userId

  let existing = await readContact(client, email)
  if (!existing) {
    const { data, error } = await client
      .from('email_contacts')
      .insert({ email, ...neutral, status: 'subscribed', marketing_opt_in: false })
      .select(CONTACT_COLUMNS)
      .single()
    if (data && !error) return data as ContactRecord
    // A concurrent request may have created the row between the read and the insert (unique email).
    existing = (error as { code?: string } | null)?.code === '23505' ? await readContact(client, email) : null
    if (!existing) throw new Error(`email_contacts insert failed: ${error?.message ?? 'no row'}`)
  }

  const { error } = await client.from('email_contacts').update(neutral).eq('id', existing.id)
  if (error) throw new Error(`email_contacts update failed: ${error.message}`)
  return existing
}

export async function storeMailerLiteId(client: SupabaseClient, contactId: string, subscriberId: string) {
  const { error } = await client
    .from('email_contacts')
    .update({ mailerlite_subscriber_id: subscriberId })
    .eq('id', contactId)
  if (error) console.warn('[contacts] storing the MailerLite id failed:', error.message)
}

export type ContactStatus = { id: string; status: string; marketing_opt_in: boolean }

/** The contact row for an email (stored lowercased, citext), or null. Callers pass a verified email only. */
export async function findContactByEmail(client: SupabaseClient, email: string): Promise<ContactStatus | null> {
  const { data, error } = await client
    .from('email_contacts')
    .select('id, status, marketing_opt_in')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) throw new Error(`email_contacts read failed: ${error.message}`)
  return (data as ContactStatus | null) ?? null
}

/** Same columns the MailerLite unsubscribe webhook writes (apps/api routes/mailerlite.ts). Throws on error. */
export async function markContactUnsubscribed(client: SupabaseClient, contactId: string) {
  const now = new Date().toISOString()
  const { error } = await client
    .from('email_contacts')
    .update({ status: 'unsubscribed', marketing_opt_in: false, unsubscribed_at: now, updated_at: now })
    .eq('id', contactId)
  if (error) throw new Error(`email_contacts unsubscribe failed: ${error.message}`)
}

export async function logContactEvent(
  client: SupabaseClient,
  input: { contactId: string; eventType: string; provider?: string; metadata?: Record<string, unknown> },
) {
  const { error } = await client.from('email_contact_events').insert({
    contact_id: input.contactId,
    event_type: input.eventType,
    provider: input.provider ?? null,
    provider_event_id: null,
    metadata: input.metadata ?? {},
  })
  if (error) console.warn('[contacts] event log failed:', error.message)
}
