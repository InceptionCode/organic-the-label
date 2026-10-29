import { z } from 'zod'

// /search query helpers (pages/search.md). Pure and framework free so the route, the server fns,
// and the unit tests share one definition.

export const SEARCH_Q_MAX = 100

/** Result type filter (`?type=`). Absent means all; filtered client-side from the loaded results. */
export const SEARCH_TYPES = ['products', 'compositions'] as const
export type SearchType = (typeof SEARCH_TYPES)[number]

export type SiteSearch = { q?: string; type?: SearchType }

const typeSchema = z
  .preprocess((v) => (Array.isArray(v) ? v[0] : v), z.enum(SEARCH_TYPES))
  .optional()
  .catch(undefined)

const qSchema = z
  .preprocess(
    // Repeated keys arrive as arrays and numbers can arrive unquoted; keep the first plain value.
    (v) => (Array.isArray(v) ? v[0] : typeof v === 'number' ? String(v) : v),
    z.string().transform((s) => s.trim().replace(/\s+/g, ' ').slice(0, SEARCH_Q_MAX).trim() || undefined),
  )
  .optional()
  .catch(undefined)

/** validateSearch for /search. Never throws; blank or invalid `q` and invalid `type` become absent. */
export function validateSiteSearch(raw: Record<string, unknown>): SiteSearch {
  // Keys are always present (undefined when dropped) so the router does not keep a stale raw value.
  return { q: qSchema.parse(raw.q), type: typeSchema.parse(raw.type) }
}

/** Cache-key form of a query: trimmed, lowercased, whitespace collapsed. The raw q is echoed to users. */
export function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, SEARCH_Q_MAX)
}

/**
 * PostgREST `or` filter for compositions: title or description contains q, or tags contain it.
 * Characters that are wildcards in ilike (`%`, `_`, `*`) or that break PostgREST's filter grammar
 * (`,`, `(`, `)`, quotes, backslash, braces) are stripped. Returns null when nothing is left.
 */
export function compositionSearchFilter(q: string): string | null {
  const term = normalizeSearchQuery(q)
    .replace(/[%_*,()"'\\{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!term) return null
  const parts = [`title.ilike.%${term}%`, `description.ilike.%${term}%`]
  // Array containment only for a single tag-like word (tags are lowercase single words in v1).
  if (/^[\p{L}\p{N}&-]+$/u.test(term)) parts.push(`tags.cs.{${term}}`)
  return parts.join(',')
}

/** Page title for /search: `Search results for "q"`, shortened so the branded title stays under 60. */
export function searchPageTitle(q: string | undefined): string {
  if (!q) return 'Search'
  // " | Organic Sonics" (17) plus `Search results for ""` (21) leaves 21 for q to stay under 60.
  const max = 21
  const shown = q.length > max ? `${q.slice(0, max - 3).trimEnd()}...` : q
  return `Search results for "${shown}"`
}
