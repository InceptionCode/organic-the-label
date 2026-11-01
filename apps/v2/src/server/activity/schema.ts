import { z } from 'zod'

// Port of v1 lib/supabase/event.schema.ts plus the three v2-only events the owner approved on
// 2026-10-29. Zod only, no server imports. This is the allow-list for client events: server-only
// events (downloads, support requests, subscriptions) are never accepted from /api/track.
// activity_events.event_type is plain text in the database, so adding a type needs no migration.
export const EVENT_TYPES = [
  'product_viewed',
  'audio_preview_played',
  'store_viewed',
  'cart_opened',
  'homepage_viewed',
  'user_signed_up',
  'user_signed_in',
  'explore_viewed',
  'checkout_clicked',
  'preview_playlist_completed',
  'access_requested',
  'search_filter_changed',
] as const

export type ActivityEventType = (typeof EVENT_TYPES)[number]

/** Serialized `eventProperties` cap per event, in UTF-8 bytes. */
export const MAX_PROPERTIES_BYTES = 2048
/** Events per /api/track request (the client flushes at this size). */
export const MAX_BATCH_EVENTS = 20

export function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value) ?? '').length
}

export const eventPropertiesSchema = z
  .record(z.string(), z.unknown())
  .default({})
  .refine((props) => jsonByteLength(props) <= MAX_PROPERTIES_BYTES, {
    message: `eventProperties must serialize to at most ${MAX_PROPERTIES_BYTES} bytes`,
  })

export const activityEventSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  eventProperties: eventPropertiesSchema,
})

export const trackBatchSchema = z.object({
  events: z.array(activityEventSchema).min(1).max(MAX_BATCH_EVENTS),
})

export type ActivityEventInput = z.output<typeof activityEventSchema>
export type TrackBatch = z.output<typeof trackBatchSchema>
