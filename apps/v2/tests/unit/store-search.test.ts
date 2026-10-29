import { describe, expect, test } from 'bun:test'
import {
  activeFilterCount,
  applyFilterUpdate,
  buildShopifyProductQuery,
  compactListParams,
  hasActiveFilters,
  normalizeTags,
  stableListKey,
  storeSearchToListParams,
  validateStoreSearch,
} from '~/lib/store-search'
import { parseSearch, stringifySearch } from '~/lib/search-params'

const parse = (qs: string) => validateStoreSearch(parseSearch(qs))
const defined = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

describe('store search params (validateSearch)', () => {
  test('v1 URL contract parses to flat values', () => {
    expect(defined(parse('?tags=trap,melodic'))).toEqual({ tags: 'melodic,trap' })
    expect(defined(parse('?exclusive=true'))).toEqual({ exclusive: true })
    expect(defined(parse('?category=kit'))).toEqual({ category: 'kit' })
    expect(defined(parse('?sort=price-low'))).toEqual({ sort: 'price-low' })
  })

  test('legacy forms: encoded r&b and repeated tag= keys are merged, deduped and sorted', () => {
    expect(defined(parse('?tags=melodic,r%26b'))).toEqual({ tags: 'melodic,r&b' })
    expect(defined(parse('?tag=trap&tag=dark'))).toEqual({ tags: 'dark,trap' })
    expect(defined(parse('?tags=Trap&tag=trap&tag=DARK'))).toEqual({ tags: 'dark,trap' })
  })

  test('bad values are dropped, never thrown', () => {
    expect(defined(parse('?category=nope&sort=cheapest&exclusive=yes&tags=bogus,&search='))).toEqual({})
    expect(defined(parse('?category=%20KIT%20'))).toEqual({ category: 'kit' })
  })

  test('default sort and legacy tag keys are present as undefined so the router drops them', () => {
    const s = parse('?sort=newest&tag=trap') as Record<string, unknown>
    expect('sort' in s && s.sort === undefined).toBe(true)
    expect('tag' in s && s.tag === undefined).toBe(true)
    expect(stringifySearch(s)).toBe('?tags=trap')
  })

  test('cursor is kept verbatim (never lowercased); search is trimmed and capped', () => {
    expect(parse('?after=eyJMYXN0X2lkIjoxMjN9').after).toBe('eyJMYXN0X2lkIjoxMjN9')
    expect(parse('?search=%20%20Wave%20Pack%20').search).toBe('Wave Pack')
    expect(parse(`?search=${'a'.repeat(150)}`).search).toHaveLength(100)
    expect(parse('?search=808').search).toBe('808')
  })

  test('serializer writes flat strings, never JSON', () => {
    const qs = stringifySearch({ category: 'kit', tags: 'melodic,trap', exclusive: true, sort: undefined })
    expect(qs).toBe('?category=kit&tags=melodic%2Ctrap&exclusive=true')
    expect(qs).not.toContain('%22')
    expect(stringifySearch({ tags: ['a', 'b'] })).toBe('?tags=a%2Cb')
    expect(defined(parse(qs))).toEqual({ category: 'kit', tags: 'melodic,trap', exclusive: true })
  })
})

describe('filter updates', () => {
  test('every change drops the cursor and omits defaults', () => {
    const prev = { category: 'kit' as const, after: 'CURSOR', sort: 'price-low' as const }
    expect(defined(applyFilterUpdate(prev, { sort: 'newest' }))).toEqual({ category: 'kit' })
    expect(defined(applyFilterUpdate(prev, { category: 'all' }))).toEqual({ sort: 'price-low' })
    expect(defined(applyFilterUpdate({}, { tags: ['trap', 'r&b', 'nope'] }))).toEqual({ tags: 'r&b,trap' })
    expect(defined(applyFilterUpdate({ tags: 'trap' }, { tags: [] }))).toEqual({})
    expect(defined(applyFilterUpdate({}, { exclusive: true, search: '  wave ' }))).toEqual({ exclusive: true, search: 'wave' })
  })

  test('active count (drawer badge) and "Clear all filters" visibility include tags', () => {
    expect(activeFilterCount({ tags: 'dark,trap', sort: 'name-asc', exclusive: true })).toBe(4)
    expect(activeFilterCount({ category: 'kit' })).toBe(0)
    expect(hasActiveFilters({ tags: 'trap' })).toBe(true)
    expect(hasActiveFilters({})).toBe(false)
  })

  test('normalizeTags', () => {
    expect(normalizeTags('Trap, melodic,,x', ['dark'])).toEqual(['dark', 'melodic', 'trap'])
  })
})

describe('list params, cache key and Shopify query', () => {
  test('store defaults and the home page share one query key', () => {
    expect(compactListParams({})).toEqual(compactListParams({ sort: 'newest' }))
    expect(storeSearchToListParams({})).toEqual({ sort: 'newest' })
  })

  test('stable cache signature: sorted pairs, defaults omitted', () => {
    expect(stableListKey({ tags: ['trap', 'melodic'], category: 'Kit' })).toBe('category=kit|sort=newest|tags=melodic,trap')
    expect(stableListKey({})).toBe('sort=newest')
    expect(stableListKey({ after: 'AbC' })).toBe('after=AbC|sort=newest')
  })

  test('tags are quoted (r&b works), category and exclusive, search on titles', () => {
    expect(buildShopifyProductQuery({ tags: ['r&b', 'trap'] })).toBe('(tag:"r&b" OR tag:"trap")')
    expect(buildShopifyProductQuery({ category: 'kit', exclusive: true })).toBe('product_type:"kit" AND tag:exclusive')
    expect(buildShopifyProductQuery({ search: 'wave "pack"' })).toBe('title:wave* AND title:pack*')
    expect(buildShopifyProductQuery({})).toBeNull()
  })
})
