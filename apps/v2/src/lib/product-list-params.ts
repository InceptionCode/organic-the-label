export const STORE_SORTS = ['newest', 'price-low', 'price-high', 'name-asc', 'name-desc'] as const
export type StoreSort = (typeof STORE_SORTS)[number]
export const SEARCH_MAX = 100

export type ListProductsParams = {
  sort?: StoreSort
  category?: string | null
  tags?: string[]
  exclusive?: boolean
  search?: string | null
  after?: string | null
}

export type NormalizedListParams = {
  sort: StoreSort
  category: string | null
  tags: string[]
  exclusive: boolean
  search: string | null
  after: string | null
}

export function normalizeListParams(params: ListProductsParams = {}): NormalizedListParams {
  const category = params.category?.trim().toLowerCase()
  return {
    sort: params.sort ?? 'newest',
    category: category && category !== 'all' ? category : null,
    tags: [...new Set((params.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))].sort(),
    exclusive: params.exclusive === true,
    search: params.search?.trim().slice(0, SEARCH_MAX) || null,
    after: params.after || null,
  }
}

export function compactListParams(params: ListProductsParams = {}): ListProductsParams {
  const p = normalizeListParams(params)
  const out: ListProductsParams = { sort: p.sort }
  if (p.category) out.category = p.category
  if (p.tags.length > 0) out.tags = p.tags
  if (p.exclusive) out.exclusive = true
  if (p.search) out.search = p.search
  if (p.after) out.after = p.after
  return out
}

/** Cache signature: sorted `key=value` pairs, e.g. `category=kit|sort=newest|tags=melodic,trap`. */
export function stableListKey(params: ListProductsParams = {}): string {
  const p = normalizeListParams(params)
  const pairs: [string, string][] = [['sort', p.sort]]
  if (p.category) pairs.push(['category', p.category])
  if (p.tags.length > 0) pairs.push(['tags', p.tags.join(',')])
  if (p.exclusive) pairs.push(['exclusive', 'true'])
  if (p.search) pairs.push(['search', p.search.toLowerCase()])
  if (p.after) pairs.push(['after', p.after])
  return pairs
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|')
}

export function buildShopifyProductQuery(params: ListProductsParams = {}): string | null {
  const p = normalizeListParams(params)
  const quote = (s: string) => `"${s.replace(/["\\]/g, '\\$&')}"`
  const parts: string[] = []
  if (p.category) parts.push(`product_type:${quote(p.category)}`)
  if (p.tags.length > 0) parts.push(`(${p.tags.map((t) => `tag:${quote(t)}`).join(' OR ')})`)
  if (p.exclusive) parts.push('tag:exclusive')
  if (p.search) {
    const words = p.search.replace(/[^\p{L}\p{N}\s&'-]/gu, ' ').split(/\s+/).filter(Boolean)
    for (const w of words) parts.push(`title:${w.replace(/'/g, '')}*`)
  }
  return parts.length > 0 ? parts.join(' AND ') : null
}
