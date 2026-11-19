import type { Preferences } from '~/server/preferences/options'
import type { ProductSummary } from '~/server/shopify/types'

// Interest scores (phase 09.2). Pure and framework-free: no I/O, no clock. Scores only ever use
// categories and tags from our own catalog and preference lists, never raw event text.

export const PREFERENCE_WEIGHT = 5
export const EVENT_WEIGHTS = {
  preview_playlist_completed: 4,
  audio_preview_played: 3,
  product_viewed: 2,
} as const
export const HALF_LIFE_DAYS = 14

export type AffinityEventType = keyof typeof EVENT_WEIGHTS
export const AFFINITY_EVENT_TYPES = Object.keys(EVENT_WEIGHTS) as AffinityEventType[]

/** One activity_events row, as read. Properties come from the browser, so they are not trusted. */
export type AffinityEvent = { event_type: string; event_properties: unknown; created_at: string }

export type Affinity = { categories: Record<string, number>; tags: Record<string, number> }

const DAY_MS = 86_400_000

const scoreOf = (scores: Record<string, number>, key: string) => (Object.hasOwn(scores, key) ? scores[key]! : 0)

function add(scores: Record<string, number>, key: string, amount: number) {
  if (key) scores[key] = scoreOf(scores, key) + amount
}

function decayed(weight: number, createdAt: string, now: Date): number | null {
  const at = Date.parse(createdAt)
  if (Number.isNaN(at)) return null
  const ageDays = Math.max(0, now.getTime() - at) / DAY_MS
  return weight * 0.5 ** (ageDays / HALF_LIFE_DAYS)
}

const stringProp = (props: Record<string, unknown>, name: string) => (typeof props[name] === 'string' ? props[name] : null)

/**
 * Scores per category and per tag. Favorites count +5 each with no decay; events count by type with a
 * 14-day half-life. An event resolves to a product by `productId`, then `handle`; events for anything
 * else (a free loop preview, a product outside `catalog`) are ignored.
 */
export function buildAffinity(
  events: readonly AffinityEvent[],
  preferences: Pick<Preferences, 'favoriteGenres' | 'favoriteProductTypes'>,
  catalog: readonly ProductSummary[],
  now: Date,
): Affinity {
  const affinity: Affinity = { categories: {}, tags: {} }
  for (const genre of preferences.favoriteGenres) add(affinity.tags, genre, PREFERENCE_WEIGHT)
  for (const type of preferences.favoriteProductTypes) add(affinity.categories, type, PREFERENCE_WEIGHT)

  const byId = new Map(catalog.map((p) => [p.id, p]))
  const byHandle = new Map(catalog.map((p) => [p.handle, p]))

  for (const event of events) {
    if (!Object.hasOwn(EVENT_WEIGHTS, event.event_type)) continue
    const props = (event.event_properties ?? {}) as Record<string, unknown>
    const id = stringProp(props, 'productId')
    const handle = stringProp(props, 'handle')
    const product = (id ? byId.get(id) : undefined) ?? (handle ? byHandle.get(handle) : undefined)
    if (!product) continue
    const amount = decayed(EVENT_WEIGHTS[event.event_type as AffinityEventType], event.created_at, now)
    if (amount === null) continue
    add(affinity.categories, product.category, amount)
    for (const tag of product.tags) add(affinity.tags, tag, amount)
  }
  return affinity
}

export function hasSignal(affinity: Affinity): boolean {
  return Object.keys(affinity.categories).length > 0 || Object.keys(affinity.tags).length > 0
}

export function scoreProduct(affinity: Affinity, product: Pick<ProductSummary, 'category' | 'tags'>): number {
  return product.tags.reduce((sum, tag) => sum + scoreOf(affinity.tags, tag), scoreOf(affinity.categories, product.category))
}

/** Highest score first, newest first on a tie. Products that match nothing are not recommendations. */
export function rankProducts(affinity: Affinity, candidates: readonly ProductSummary[], limit: number): ProductSummary[] {
  return candidates
    .map((product) => ({ product, score: scoreProduct(affinity, product) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.product.createdAt) - Date.parse(a.product.createdAt))
    .slice(0, limit)
    .map(({ product }) => product)
}
