import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import type { ActivityEventInput } from './schema'

export type RecordEventsInput = {
  userId: string | null
  anonymousVisitorId: string | null
  events: ActivityEventInput[]
}

/**
 * Inserts one batch into activity_events with the admin client (the table has no client insert
 * policy). Throws before touching the database when there is no actor, so activity_events_actor_check
 * can never fail. A signed-in batch leaves anonymous_visitor_id null: pre-login rows reach the user
 * through mergeVisitor (server/identity/merge.ts), not through this insert.
 */
export async function recordEvents({ userId, anonymousVisitorId, events }: RecordEventsInput, client?: SupabaseClient): Promise<void> {
  if (!userId && !anonymousVisitorId) throw new Error('recordEvents needs a userId or an anonymousVisitorId')
  if (events.length === 0) return

  const rows = events.map((event) => ({
    user_id: userId,
    anonymous_visitor_id: userId ? null : anonymousVisitorId,
    event_type: event.eventType,
    event_properties: event.eventProperties,
  }))
  const { error } = await (client ?? createSupabaseAdminClient()).from('activity_events').insert(rows)
  if (error) throw new Error(`Failed to record activity events: ${error.message}`)
}
