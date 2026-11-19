import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecommendationSlot } from '~/lib/recommendation-slots'
import { getActiveEntitlements } from '~/server/account/owned-products'
import { keys, ttl } from '~/server/cache/keys'
import { getCached } from '~/server/cache/redis'
import { listProducts } from '~/server/catalog/products'
import { getPreferences } from '~/server/preferences/service'
import type { ProductSummary } from '~/server/shopify/types'
import { AFFINITY_EVENT_TYPES, buildAffinity, hasSignal, rankProducts, type Affinity, type AffinityEvent } from './affinity'

// Rule-based recommendations (phase 09.3). Nothing here leaves our own services. `client` must be the
// user-scoped client, so RLS limits every read to the caller's own rows.

const TAG = '[personalization]'

export const ACTIVITY_WINDOW_DAYS = 90
export const ACTIVITY_MAX_ROWS = 500

export type Recommendations = { products: ProductSummary[]; source: 'rules' }

const nothing = (): Recommendations => ({ products: [], source: 'rules' })

export type RecommendationDeps = {
  client: SupabaseClient
  /**
   * Links purchases made with the user's email before they reach the entitlement read, so a guest
   * order is already owned here. Absent when the email is unverified. Runs only for opted-in users.
   */
  claimEntitlements?: () => Promise<void>
  loadCatalog?: () => Promise<ProductSummary[]>
  cache?: typeof getCached
  now?: () => Date
}

const loadNewestProducts = async () => (await listProducts({ sort: 'newest' })).products

export async function readAffinityEvents(client: SupabaseClient, userId: string, now: Date): Promise<AffinityEvent[]> {
  const since = new Date(now.getTime() - ACTIVITY_WINDOW_DAYS * 86_400_000).toISOString()
  const { data, error } = await client
    .from('activity_events')
    .select('event_type, event_properties, created_at')
    .eq('user_id', userId)
    .in('event_type', AFFINITY_EVENT_TYPES)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(ACTIVITY_MAX_ROWS)
  if (error) throw new Error(`Failed to load activity: ${error.message}`)
  return (data ?? []) as AffinityEvent[]
}

/**
 * Up to `limit` products for one slot, or none. Opt-in and entitlements are read on every call, even
 * when the scores are cached, so turning it off or buying something takes effect immediately. A user
 * with no signal gets nothing (not a repeat of new arrivals) and is not cached. Never throws: a slot
 * must not break a page, and any doubt about what the user owns means showing nothing.
 */
export async function getRecommendations(
  { userId, slot, limit }: { userId: string; slot: RecommendationSlot; limit: number },
  deps: RecommendationDeps,
): Promise<Recommendations> {
  const { client, claimEntitlements, loadCatalog = loadNewestProducts, cache = getCached, now = () => new Date() } = deps
  try {
    const preferences = await getPreferences(client, userId)
    if (!preferences.personalizationOptIn) return nothing()

    const affinity = await cache<Affinity>(
      keys.personalizationAffinity(userId),
      ttl.personalizationAffinity,
      async () => {
        const at = now()
        const [events, catalog] = await Promise.all([readAffinityEvents(client, userId, at), loadCatalog()])
        return buildAffinity(events, preferences, catalog, at)
      },
      { shouldCache: hasSignal },
    )
    if (!hasSignal(affinity)) return nothing()

    await claimEntitlements?.()
    const [entitlements, catalog] = await Promise.all([getActiveEntitlements(client, userId), loadCatalog()])
    const owned = new Set(entitlements.map((row) => row.product_gid))
    const candidates = catalog.filter((p) => p.availableForSale && !owned.has(p.id))
    return { products: rankProducts(affinity, candidates, limit), source: 'rules' }
  } catch (error) {
    console.error(TAG, slot, error instanceof Error ? error.message : error)
    return nothing()
  }
}
