import type { SupabaseClient } from '@supabase/supabase-js'

// Port of v1 lib/email/sync-contact.ts (Supabase half). Shared by the newsletter and support
// services. The admin client is passed in so unit tests never touch env or the network.

export type SyncContactInput = {
  email: string
  firstName?: string
  source?: string
  signupSource?: string
  tags?: string[]
  userId?: string
}

export type ContactRecord = { id: string; mailerlite_subscriber_id: string | null }

export async function syncContact(client: SupabaseClient, input: SyncContactInput): Promise<ContactRecord> {
  const row: Record<string, unknown> = {
    email: input.email.toLowerCase(),
    first_name: input.firstName ?? null,
    status: 'subscribed',
    marketing_opt_in: true,
    source: input.source ?? 'website',
    signup_source: input.signupSource ?? null,
    updated_at: new Date().toISOString(),
  }
  if (input.userId) row.supabase_user_id = input.userId

  const { data, error } = await client
    .from('email_contacts')
    .upsert(row, { onConflict: 'email', ignoreDuplicates: false })
    .select('id, mailerlite_subscriber_id')
    .single()
  if (error || !data) throw new Error(`email_contacts upsert failed: ${error?.message ?? 'no row'}`)
  const contact = data as ContactRecord

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

export async function storeMailerLiteId(client: SupabaseClient, contactId: string, subscriberId: string) {
  const { error } = await client
    .from('email_contacts')
    .update({ mailerlite_subscriber_id: subscriberId })
    .eq('id', contactId)
  if (error) console.warn('[contacts] storing the MailerLite id failed:', error.message)
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
