import type { SupabaseClient } from '@supabase/supabase-js'
import { findContactByEmail } from '~/server/email/contacts'
import {
  subscribeToNewsletter as defaultSubscribe,
  unsubscribeFromNewsletter as defaultUnsubscribe,
  type SubscribeDeps,
  type UnsubscribeDeps,
} from '~/server/email/subscribe'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import type { Preferences } from './options'

// The account "Email me about new drops and offers" box is a two-way newsletter toggle (owner
// decision 2026-10-29): checked means subscribed, unchecked means no newsletter emails. The real
// state is email_contacts (status 'subscribed' AND marketing_opt_in, the newsletter consent; a
// free-resource lead without consent is subscribed but not opted in) for the caller's verified
// email, which also moves when someone unsubscribes from an email link (MailerLite webhook) or
// joins from /newsletter.
// user_preferences.marketing_opt_in is only a mirror of the outcome, never read for display
// (except as a fallback when email_contacts cannot be read). Logs never include the email.

export type NewsletterSyncStatus = 'subscribed' | 'unsubscribed' | 'failed' | 'unverified' | 'unchanged'

export type NewsletterSyncSession = {
  userId: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
}

export type NewsletterState = { subscribed: boolean; contactId: string | null }

export type NewsletterSyncDeps = {
  /** Admin client for the email_contacts read. email_contacts has no user RLS policy. */
  client?: SupabaseClient
  subscribe?: typeof defaultSubscribe
  subscribeDeps?: SubscribeDeps
  unsubscribe?: typeof defaultUnsubscribe
  unsubscribeDeps?: UnsubscribeDeps
}

export type NewsletterSyncResult = { status: NewsletterSyncStatus; subscribed: boolean }

const LOG = '[preferences.newsletter]'
const reason = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * Whether the caller gets the newsletter: their email_contacts row, looked up by the VERIFIED email
 * only, has status 'subscribed' AND marketing_opt_in true (newsletter consent). No row, an unverified
 * email, any other status, or a subscribed contact without consent (a free-resource lead) reads as false.
 * Throws when email_contacts cannot be read.
 */
export async function readNewsletterState(
  session: Pick<NewsletterSyncSession, 'email' | 'emailVerified'>,
  client: SupabaseClient = createSupabaseAdminClient(),
): Promise<NewsletterState> {
  if (!session.email || !session.emailVerified) return { subscribed: false, contactId: null }
  const contact = await findContactByEmail(client, session.email)
  return { subscribed: contact?.status === 'subscribed' && contact.marketing_opt_in === true, contactId: contact?.id ?? null }
}

/** Stored preferences with marketingOptIn replaced by the real newsletter state, for the account form. */
export async function withNewsletterState(
  stored: Preferences,
  session: Pick<NewsletterSyncSession, 'email' | 'emailVerified'>,
  client?: SupabaseClient,
): Promise<Preferences> {
  try {
    const state = await readNewsletterState(session, client)
    return { ...stored, marketingOptIn: state.subscribed }
  } catch (error) {
    // A newsletter read failure should not take the whole account page down; the mirror is the best guess.
    console.error(LOG, 'read failed:', reason(error))
    return session.email && session.emailVerified ? stored : { ...stored, marketingOptIn: false }
  }
}

/**
 * Applies the submitted checkbox against the REAL previous state. Off to on subscribes (source
 * 'account'); on to off unsubscribes in MailerLite first, then marks the contact; no change makes no
 * call. Never throws: the result carries the status and the real state after the attempt, which the
 * caller stores as the user_preferences mirror and shows in the form. `fallback` (the stored mirror)
 * stands in for the real state only when email_contacts cannot be read, and then nothing is called.
 */
export async function syncNewsletterOptIn(
  request: { wanted: boolean; fallback: boolean },
  session: NewsletterSyncSession,
  deps: NewsletterSyncDeps = {},
): Promise<NewsletterSyncResult> {
  const { wanted } = request
  if (!session.email || !session.emailVerified) {
    return { status: wanted ? 'unverified' : 'unchanged', subscribed: false }
  }

  let previous: NewsletterState
  try {
    previous = await readNewsletterState(session, deps.client)
  } catch (error) {
    console.error(LOG, 'read failed:', reason(error))
    return { status: wanted === request.fallback ? 'unchanged' : 'failed', subscribed: request.fallback }
  }
  if (previous.subscribed === wanted) return { status: 'unchanged', subscribed: previous.subscribed }

  if (wanted) {
    const subscribe = deps.subscribe ?? defaultSubscribe
    try {
      const result = await subscribe(
        {
          email: session.email,
          marketingOptIn: true,
          source: 'account',
          firstName: session.displayName?.trim().slice(0, 80) || undefined,
          userId: session.userId,
        },
        deps.subscribeDeps,
      )
      if (!result.ok) throw new Error(result.error)
      return { status: 'subscribed', subscribed: true }
    } catch (error) {
      console.error(LOG, 'subscribe failed:', reason(error))
      return { status: 'failed', subscribed: false }
    }
  }

  // previous.subscribed is true here, which only a contact row can give; the guard is for the types.
  const contactId = previous.contactId
  if (!contactId) return { status: 'unchanged', subscribed: false }
  const unsubscribe = deps.unsubscribe ?? defaultUnsubscribe
  try {
    await unsubscribe({ email: session.email, contactId, source: 'account' }, deps.unsubscribeDeps)
    return { status: 'unsubscribed', subscribed: false }
  } catch (error) {
    // MailerLite failed (contact untouched) or the contact update failed after it: either way the
    // person is told it did not go through and the box stays checked. A retry is safe.
    console.error(LOG, 'unsubscribe failed:', reason(error))
    return { status: 'failed', subscribed: true }
  }
}
