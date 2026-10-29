import { describe, expect, test } from 'bun:test'
import {
  compositionSearchFilter,
  normalizeSearchQuery,
  searchPageTitle,
  validateSiteSearch,
} from '~/lib/search-query'
import { formatTitle } from '~/seo/head'
import { search } from '~/server/search/search'
import { searchCompositions } from '~/server/compositions/search-compositions'
import type { ProductSummary } from '~/server/shopify/types'
import type { CompositionListItem } from '~/server/compositions/columns'
import { fakeSupabase } from './fake-supabase'

describe('validateSiteSearch', () => {
  test('keeps a trimmed query with collapsed whitespace', () => {
    expect(validateSiteSearch({ q: '  808   drums ' })).toEqual({ q: '808 drums' })
  })
  test('blank, missing, and invalid q become absent', () => {
    expect(validateSiteSearch({})).toEqual({ q: undefined })
    expect(validateSiteSearch({ q: '' })).toEqual({ q: undefined })
    expect(validateSiteSearch({ q: '   ' })).toEqual({ q: undefined })
    expect(validateSiteSearch({ q: { a: 1 } })).toEqual({ q: undefined })
  })
  test('numbers and repeated keys', () => {
    expect(validateSiteSearch({ q: 808 })).toEqual({ q: '808' })
    expect(validateSiteSearch({ q: ['trap', 'rage'] })).toEqual({ q: 'trap' })
  })
  test('caps at 100 characters', () => {
    expect(validateSiteSearch({ q: 'a'.repeat(150) }).q).toHaveLength(100)
  })
  test('always returns the q and type keys so stale raw values are cleared', () => {
    expect(Object.keys(validateSiteSearch({ q: '' }))).toEqual(['q', 'type'])
  })
  test('type keeps products or compositions; anything else falls back to all (absent)', () => {
    expect(validateSiteSearch({ q: 'trap', type: 'products' }).type).toBe('products')
    expect(validateSiteSearch({ q: 'trap', type: ['compositions', 'products'] }).type).toBe('compositions')
    expect(validateSiteSearch({ q: 'trap', type: 'beats' }).type).toBeUndefined()
    expect(validateSiteSearch({ q: 'trap', type: 1 }).type).toBeUndefined()
  })
})

describe('normalizeSearchQuery', () => {
  test('lowercases, trims, and collapses whitespace', () => {
    expect(normalizeSearchQuery('  Dark   TRAP ')).toBe('dark trap')
  })
})

describe('compositionSearchFilter', () => {
  test('single word searches title, description, and tags', () => {
    expect(compositionSearchFilter('Trap')).toBe('title.ilike.%trap%,description.ilike.%trap%,tags.cs.{trap}')
  })
  test('phrases skip the tag containment', () => {
    expect(compositionSearchFilter('dark trap')).toBe('title.ilike.%dark trap%,description.ilike.%dark trap%')
  })
  test('strips ilike wildcards and PostgREST grammar characters', () => {
    expect(compositionSearchFilter('50%_off,(x)*')).toBe('title.ilike.%50 off x%,description.ilike.%50 off x%')
    expect(compositionSearchFilter('a"b\\c{d}')).toBe('title.ilike.%a b c d%,description.ilike.%a b c d%')
  })
  test('null when nothing searchable is left', () => {
    expect(compositionSearchFilter('%%,()')).toBeNull()
    expect(compositionSearchFilter('   ')).toBeNull()
  })
})

describe('searchPageTitle', () => {
  test('plain title without q', () => {
    expect(searchPageTitle(undefined)).toBe('Search')
  })
  test('branded title stays under 60 characters', () => {
    expect(formatTitle(searchPageTitle('808'))).toBe('Search results for "808" | Organic Sonics')
    const long = formatTitle(searchPageTitle('the longest query anyone could type here'))
    expect(long.length).toBeLessThan(60)
    expect(long).toContain('...')
  })
})

const product = { id: 'p1', handle: 'x', title: 'X' } as ProductSummary
const composition = { id: 'c1', slug: 'y', title: 'Y' } as CompositionListItem
const silent = { error: () => {} }

describe('search', () => {
  test('returns both groups', async () => {
    const r = await search('808', { products: async () => [product], compositions: async () => [composition] }, silent)
    expect(r).toEqual({ q: '808', products: [product], compositions: [composition], partial: false })
  })
  test('one failing source gives a partial result', async () => {
    const r = await search(
      '808',
      { products: async () => [product], compositions: async () => Promise.reject(new Error('db down')) },
      silent,
    )
    expect(r.partial).toBe(true)
    expect(r.products).toEqual([product])
    expect(r.compositions).toEqual([])
  })
  test('both failing throws', async () => {
    const fail = async () => Promise.reject(new Error('down'))
    await expect(search('808', { products: fail, compositions: fail }, silent)).rejects.toThrow('unavailable')
  })
})

describe('searchCompositions', () => {
  test('queries active compositions with the escaped or filter, newest first', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: [composition], error: null }))
    const rows = await searchCompositions('Trap', { limit: 12, client: () => client })
    expect(rows).toEqual([composition])
    expect(calls[0]!.table).toBe('compositions')
    expect(calls[0]!.filters).toEqual([
      ['eq', 'active', true],
      ['or', 'title.ilike.%trap%,description.ilike.%trap%,tags.cs.{trap}', null],
      ['order', 'posted_at', { ascending: false }],
      ['limit', 'limit', 12],
    ])
  })
  test('no query: no database call', async () => {
    const { client, calls } = fakeSupabase()
    expect(await searchCompositions('%%', { client: () => client })).toEqual([])
    expect(calls).toHaveLength(0)
  })
  test('a database error throws', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: { message: 'boom' } }))
    await expect(searchCompositions('trap', { client: () => client })).rejects.toThrow('boom')
  })
})
