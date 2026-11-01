// /compositions search params (pages/compositions.md). Zod-free on purpose: validateSearch sits in
// the route definition, which ships in the entry chunk. Shared by the route, the filters, the query
// key, and the list service, so the URL, the cache key, and the Supabase query never disagree.

export const COMPOSITION_RANGES = ['7d', '30d', '90d', 'year'] as const
export const COMPOSITION_TAGS = [
  'ambient', 'melodic', 'vintage', 'r&b', 'hiphop', 'trap', 'dark', 'ost', 'opium', 'rage', 'digital',
] as const
export const COMPOSITION_SEARCH_MAX = 100

export type CompositionRange = (typeof COMPOSITION_RANGES)[number]
export type CompositionTag = (typeof COMPOSITION_TAGS)[number]

export const RANGE_OPTIONS: { value: CompositionRange | 'all'; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
]

export const SORT_OPTIONS: { value: 'newest' | 'oldest'; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

export const TAG_OPTIONS: { value: CompositionTag; label: string }[] = [
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

/** Router search state. Absent means default (all time, newest, no tags, no search). */
export type CompositionSearch = {
  search?: string
  range?: CompositionRange
  sort?: 'oldest'
  /** Comma list of allowed tags, lowercased, deduped, sorted. */
  tags?: string
}

/** Service input: the search state normalized for the query and the cache key. */
export type CompositionListParams = {
  search?: string
  range?: CompositionRange
  sort?: 'oldest'
  tags?: CompositionTag[]
}

const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v)
const str = (v: unknown): string | undefined => {
  const value = first(v)
  if (typeof value === 'number') return String(value)
  return typeof value === 'string' ? value.trim() : undefined
}

export function normalizeCompositionTags(input: unknown): CompositionTag[] {
  const parts = Array.isArray(input) ? input : [input]
  const out = new Set<CompositionTag>()
  for (const part of parts) {
    if (typeof part !== 'string') continue
    for (const raw of part.split(',')) {
      const tag = raw.trim().toLowerCase()
      if ((COMPOSITION_TAGS as readonly string[]).includes(tag)) out.add(tag as CompositionTag)
    }
  }
  return [...out].sort()
}

/** validateSearch for /compositions. Never throws: invalid values are dropped. Accepts v1 URLs. */
export function validateCompositionSearch(raw: Record<string, unknown>): CompositionSearch {
  // Every key present (undefined when dropped): the router merges validated output over raw params.
  const out: CompositionSearch = { search: undefined, range: undefined, sort: undefined, tags: undefined }
  const search = str(raw.search)?.slice(0, COMPOSITION_SEARCH_MAX).trim()
  if (search) out.search = search
  const range = str(raw.range)?.toLowerCase()
  if ((COMPOSITION_RANGES as readonly string[]).includes(range ?? '')) out.range = range as CompositionRange
  if (str(raw.sort)?.toLowerCase() === 'oldest') out.sort = 'oldest'
  const tags = normalizeCompositionTags(raw.tags)
  if (tags.length > 0) out.tags = tags.join(',')
  return out
}

/** URL state to service params. Search is lowercased (ilike is case-insensitive, keys stay stable). */
export function toCompositionListParams(s: CompositionSearch): CompositionListParams {
  const p: CompositionListParams = {}
  const search = s.search?.trim().toLowerCase()
  if (search) p.search = search.slice(0, COMPOSITION_SEARCH_MAX)
  if (s.range) p.range = s.range
  if (s.sort === 'oldest') p.sort = 'oldest'
  const tags = normalizeCompositionTags(s.tags)
  if (tags.length > 0) p.tags = tags
  return p
}

export function hasActiveCompositionFilters(s: CompositionSearch): boolean {
  return Boolean(s.search || s.range || s.sort || s.tags)
}

/** Stable cache-key signature (pages/compositions.md): `range=..|sort=..|tags=..|search=..`. */
export function compositionListSignature(p: CompositionListParams): string {
  return `range=${p.range ?? 'all'}|sort=${p.sort ?? 'newest'}|tags=${p.tags?.join(',') || '-'}|search=${p.search || '-'}`
}

/**
 * ISO cutoff for a range preset, truncated to the start of the UTC day so a cached list stays valid
 * for the whole day (v1 computed it from `now`, so the key drifted on every request).
 */
export function rangeCutoffISO(range: CompositionRange | undefined, now: Date = new Date()): string | null {
  if (!range) return null
  if (range === 'year') return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days)).toISOString()
}

/** v1 rule: strip the PostgREST `or()` metacharacters before building the ilike pattern. */
export function sanitizeCompositionSearch(term: string): string {
  return term.replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Page size, mirrored from COMPOSITION_PAGE_COUNT so the client never imports content-schema (tested equal). */
export const COMPOSITION_PAGE_SIZE = 24
