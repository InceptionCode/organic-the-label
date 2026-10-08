import { getCookie } from '@tanstack/react-start/server'
import { createSupabaseAdminClient } from './admin'

const ANON_COOKIE_NAME = 'anon_token'

// Ported from lib/supabase/migrate-anon-user.ts
// Replaces next/headers cookies() with TanStack Start's getCookie().
// Called after a successful OTP confirmation to link anon activity to the new user.
export async function mergeAnonymousVisitorIntoUser(params: {
  userId: string
  email?: string | null
  emailVerified?: boolean
}) {
  const supabase = createSupabaseAdminClient()

  if (params.emailVerified && params.email) {
    const { error } = await supabase
      .from('entitlements')
      .update({ user_id: params.userId })
      .eq('purchaser_email', params.email)
      .is('user_id', null)
      .is('revoked_at', null)

    if (error) throw new Error(`Failed to claim guest entitlements: ${error.message}`)
  }

  const anonToken = getCookie(ANON_COOKIE_NAME)
  if (!anonToken) return

  const { data: visitor, error: visitorError } = await supabase
    .from('anonymous_visitors')
    .select('id, claimed_by_user_id')
    .eq('anon_token', anonToken)
    .maybeSingle()

  if (visitorError) throw new Error(`Failed to find anonymous visitor: ${visitorError.message}`)
  if (!visitor) return

  const { error: activityError } = await supabase
    .from('activity_events')
    .update({ user_id: params.userId })
    .eq('anonymous_visitor_id', visitor.id)
    .is('user_id', null)

  if (activityError) throw new Error(`Failed to merge activity events: ${activityError.message}`)

  const { error: updateError } = await supabase
    .from('anonymous_visitors')
    .update({ claimed_by_user_id: params.userId, last_seen_at: new Date().toISOString() })
    .eq('id', visitor.id)

  if (updateError) throw new Error(`Failed to mark visitor as claimed: ${updateError.message}`)
}
