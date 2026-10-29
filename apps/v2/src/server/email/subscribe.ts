import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '~/server/env'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { upsertSubscriber as defaultUpsert, type UpsertSubscriberInput } from './mailerlite'
import { logContactEvent, storeMailerLiteId, syncContact } from './contacts'
import { SUBSCRIBE_MESSAGES, type ParsedSubscribePayload, type SubscribeResult } from './subscribe-schema'

export type SubscribeDeps = {
  client?: SupabaseClient
  upsertSubscriber?: (input: UpsertSubscriberInput) => Promise<{ id: string }>
  newsletterGroupId?: string | undefined
}

/**
 * The newsletter subscribe service (pages/newsletter.md), defined once and used by the home email
 * section, /newsletter, and /explore. v1 semantics: consent is required, the contact is upserted
 * and tagged `newsletter`, MailerLite is synced into the newsletter group, and two contact events
 * are logged. A Supabase or MailerLite failure throws (the caller returns the generic error); the
 * upserts are idempotent, so a retry is safe.
 */
export async function subscribeToNewsletter(
  input: ParsedSubscribePayload & { userId?: string },
  deps: SubscribeDeps = {},
): Promise<SubscribeResult> {
  if (!input.marketingOptIn) return { ok: false, error: SUBSCRIBE_MESSAGES.consentRequired }

  const groupId = 'newsletterGroupId' in deps ? deps.newsletterGroupId : env.MAILERLITE_GROUP_NEWSLETTER_ID
  if (!groupId) throw new Error('MAILERLITE_GROUP_NEWSLETTER_ID is not set')
  const client = deps.client ?? createSupabaseAdminClient()
  const upsert = deps.upsertSubscriber ?? defaultUpsert
  const signupSource = input.source ?? 'footer'

  const contact = await syncContact(client, {
    email: input.email,
    firstName: input.firstName,
    source: input.source ?? 'website',
    signupSource,
    tags: ['newsletter'],
    userId: input.userId,
  })

  const subscriber = await upsert({
    email: input.email,
    groups: [groupId],
    fields: {
      name: input.firstName ?? null,
      signup_source: signupSource,
      supabase_contact_id: contact.id,
    },
  })
  if (subscriber.id) await storeMailerLiteId(client, contact.id, subscriber.id)

  await logContactEvent(client, {
    contactId: contact.id,
    eventType: 'subscribed',
    provider: 'mailerlite',
    metadata: { source: input.source ?? null, signup_source: signupSource },
  })
  await logContactEvent(client, { contactId: contact.id, eventType: 'mailerlite_synced', provider: 'mailerlite' })

  return { ok: true }
}
