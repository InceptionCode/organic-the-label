import { z } from 'zod'
import {
  SEARCH_MAX,
  STORE_SORTS,
  compactListParams,
  type ListProductsParams,
  type StoreSort,
} from './product-list-params'

export {
  SEARCH_MAX,
  STORE_SORTS,
  buildShopifyProductQuery,
  compactListParams,
  normalizeListParams,
  stableListKey,
  type ListProductsParams,
  type NormalizedListParams,
  type StoreSort,
} from './product-list-params'

export const STORE_CATEGORIES = ['kit', 'pack', 'beat', 'merch', 'bank', 'suite', 'plugin'] as const
export const STORE_TAGS = [
  'free', 'ambient', 'melodic', 'vintage', 'r&b', 'hiphop', 'trap', 'dark', 'ost', 'opium', 'rage', 'digital',
] as const

export type StoreCategory = (typeof STORE_CATEGORIES)[number]
export type StoreTag = (typeof STORE_TAGS)[number]

export const CATEGORY_OPTIONS: { value: StoreCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'kit', label: 'Kits' },
  { value: 'pack', label: 'Packs' },
  { value: 'beat', label: 'Beats' },
  { value: 'merch', label: 'Merch' },
  { value: 'bank', label: 'Sound Banks' },
  { value: 'suite', label: 'Suites' },
  { value: 'plugin', label: 'Plugins & VSTs' },
]

export const TAG_OPTIONS: { value: StoreTag; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'melodic', label: 'Melodic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'r&b', label: 'R&B' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'trap', label: 'Trap' },
  { value: 'dark', label: 'Dark' },
  { value: 'ost', label: 'OST' },
  { value: 'opium', label: 'Opium' },
  { value: 'rage', label: 'Rage' },
  { value: 'digital', label: 'Digital' },
]

export const SORT_OPTIONS: { value: StoreSort; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
]

/** Router search state for /store. Every field optional; absent means default. */
export type StoreSearch = {
  category?: StoreCategory
  /** Comma list of allowed tags, lowercased, deduped, sorted. */
  tags?: string
  exclusive?: true
  /** Omitted when 'newest'. */
  sort?: Exclude<StoreSort, 'newest'>
  search?: string
  /** Shopify cursor, kept verbatim (never lowercased). */
  after?: string
}

const lower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v)

/** Splits comma lists (and arrays from repeated keys) into allowed, sorted, unique tags. */
export function normalizeTags(...inputs: unknown[]): StoreTag[] {
  const out = new Set<StoreTag>()
  for (const input of inputs) {
    const parts = Array.isArray(input) ? input : [input]
    for (const part of parts) {
      if (typeof part !== 'string') continue
      for (const raw of part.split(',')) {
        const tag = raw.trim().toLowerCase()
        if ((STORE_TAGS as readonly string[]).includes(tag)) out.add(tag as StoreTag)
      }
    }
  }
  return [...out].sort()
}

const schema = z.object({
  category: z.preprocess(lower, z.enum(STORE_CATEGORIES)).optional().catch(undefined),
  exclusive: z.preprocess((v) => (v === true || v === 'true' ? true : undefined), z.literal(true).optional()).catch(undefined),
  sort: z
    .preprocess(lower, z.enum(STORE_SORTS))
    .transform((s) => (s === 'newest' ? undefined : s))
    .optional()
    .catch(undefined),
  search: z
    .preprocess(
      (v) => (typeof v === 'number' ? String(v) : v),
      z.string().transform((s) => s.trim().slice(0, SEARCH_MAX) || undefined),
    )
    .optional()
    .catch(undefined),
  after: z
    .preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string().min(1).max(512))
    .optional()
    .catch(undefined),
})

/** validateSearch for /store. Never throws: bad values are dropped. Merges legacy `tag=` keys. */
export function validateStoreSearch(raw: Record<string, unknown>): StoreSearch {
  const parsed = schema.parse(raw)
  const tags = normalizeTags(raw.tags, raw.tag)
  // Every known key is present (undefined when dropped): the router merges validated output over
  // the raw params, so an omitted key (default sort, legacy `tag`) would otherwise survive.
  const out = {
    category: undefined,
    tags: undefined,
    exclusive: undefined,
    sort: undefined,
    search: undefined,
    after: undefined,
    tag: undefined,
  } as StoreSearch
  if (parsed.category) out.category = parsed.category
  if (tags.length > 0) out.tags = tags.join(',')
  if (parsed.exclusive) out.exclusive = true
  if (parsed.sort) out.sort = parsed.sort
  if (parsed.search) out.search = parsed.search
  if (parsed.after) out.after = parsed.after
  return out
}

/** StoreSearch (URL) to service params. */
export function storeSearchToListParams(s: StoreSearch): ListProductsParams {
  return compactListParams({
    sort: s.sort ?? 'newest',
    category: s.category ?? null,
    tags: s.tags ? s.tags.split(',') : [],
    exclusive: s.exclusive === true,
    search: s.search ?? null,
    after: s.after ?? null,
  })
}

/** Drawer badge count: tags + non-default sort + exclusive (v1). */
export function activeFilterCount(s: StoreSearch): number {
  return (s.tags ? s.tags.split(',').length : 0) + (s.sort ? 1 : 0) + (s.exclusive ? 1 : 0)
}

/** "Clear all filters" visibility: anything differs from default, including tags (v1 ignored tags). */
export function hasActiveFilters(s: StoreSearch): boolean {
  return Boolean(s.category || s.tags || s.exclusive || s.sort || s.search)
}

export type FilterUpdate = {
  category?: StoreCategory | 'all'
  tags?: string[]
  sort?: StoreSort
  exclusive?: boolean
  search?: string
}

/**
 * Next /store search after a filter change (v1 store-filters updateFilters): defaults are
 * omitted, tags are normalized, and the cursor is always dropped (back to page 1).
 */
export function applyFilterUpdate(prev: StoreSearch, update: FilterUpdate): StoreSearch {
  const next: StoreSearch = { ...prev }
  delete next.after
  if (update.category !== undefined) {
    if (update.category === 'all') delete next.category
    else next.category = update.category
  }
  if (update.tags !== undefined) {
    const tags = normalizeTags(update.tags)
    if (tags.length > 0) next.tags = tags.join(',')
    else delete next.tags
  }
  if (update.sort !== undefined) {
    if (update.sort === 'newest') delete next.sort
    else next.sort = update.sort
  }
  if (update.exclusive !== undefined) {
    if (update.exclusive) next.exclusive = true
    else delete next.exclusive
  }
  if (update.search !== undefined) {
    const term = update.search.trim().slice(0, SEARCH_MAX)
    if (term) next.search = term
    else delete next.search
  }
  return next
}
