import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

export type MergeVisitorInput = {
  userId: string
  email: string | null
  emailVerified: boolean
  anonToken: string | null | undefined
}

/**
 * Links unclaimed purchases (apps/api stores orders by purchaser_email only) to the user. Runs at
 * sign-in and again whenever the account library loads, so an order paid while already signed in
 * shows up without signing out. A filtered update: running it again changes nothing.
 */
export async function claimGuestEntitlements(
  { userId, email }: { userId: string; email: string },
  client: SupabaseClient = createSupabaseAdminClient(),
): Promise<void> {
  const { error } = await client
    .from('entitlements')
    .update({ user_id: userId })
    .eq('purchaser_email', email.trim().toLowerCase())
    .is('user_id', null)
    .is('revoked_at', null)
  if (error) throw new Error(`Failed to claim guest entitlements: ${error.message}`)
}

// Every step is a filtered update, so running it again changes nothing.
export async function mergeVisitor(
  { userId, email, emailVerified, anonToken }: MergeVisitorInput,
  client: SupabaseClient = createSupabaseAdminClient(),
): Promise<void> {
  if (emailVerified && email) await claimGuestEntitlements({ userId, email }, client)

  if (!anonToken) return

  const { data: visitor, error: findError } = await client
    .from('anonymous_visitors')
    .select('id, claimed_by_user_id')
    .eq('anon_token', anonToken)
    .maybeSingle()
  if (findError) throw new Error(`Failed to find anonymous visitor: ${findError.message}`)
  if (!visitor) return

  const { error: eventsError } = await client
    .from('activity_events')
    .update({ user_id: userId })
    .eq('anonymous_visitor_id', visitor.id)
    .is('user_id', null)
  if (eventsError) throw new Error(`Failed to merge activity events: ${eventsError.message}`)

  if (visitor.claimed_by_user_id === userId) return

  const { error: claimError } = await client
    .from('anonymous_visitors')
    .update({ claimed_by_user_id: userId, last_seen_at: new Date().toISOString() })
    .eq('id', visitor.id)
  if (claimError) throw new Error(`Failed to mark visitor as claimed: ${claimError.message}`)
}
