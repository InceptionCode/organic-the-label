import { describe, it, expect } from 'vitest'
import { buildFilterKey } from '@/lib/product/build-filter-tag'
import {
  getNormalizedSearchParams,
  normalizeTag,
  normalizeTags,
  asStringArray,
} from '@/lib/product/normalize-search-params'

// All functions in this file are pure — no mocking required.
// These tests cover the filtering/sorting pipeline that runs on every store
// page render and drives Shopify query construction.

describe('normalizeTag', () => {
  // normalizeTag is the foundation of tag deduplication. Wrong casing would
  // cause the same tag sent as 'Trap' and 'trap' to survive deduplication as two
  // separate entries, producing invalid Shopify filter queries.

  it('lowercases uppercase input', () => {
    expect(normalizeTag('TRAP')).toBe('trap')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeTag(' hiphop ')).toBe('hiphop')
  })

  it('passes through already-normalized input unchanged', () => {
    expect(normalizeTag('ambient')).toBe('ambient')
  })
})

describe('normalizeTags', () => {
  // normalizeTags takes the raw combined tag list and produces a clean,
  // canonical array used as a filter key and Shopify query parameter.

  // An empty tag array means "no tag filter active" — returning undefined
  // rather than [] distinguishes "not set" from "explicitly empty", which
  // matters for cache key generation in buildFilterKey.
  it('returns undefined for an empty array', () => {
    expect(normalizeTags([])).toBeUndefined()
  })

  // Duplicate tags would produce duplicate Shopify filter conditions.
  it('deduplicates tags', () => {
    expect(normalizeTags(['trap', 'trap', 'hiphop'])).toEqual(['hiphop', 'trap'])
  })

  // Alphabetical sort ensures the same set of tags always produces the same
  // cache key regardless of the order the user applied them.
  it('sorts tags alphabetically', () => {
    expect(normalizeTags(['trap', 'ambient'])).toEqual(['ambient', 'trap'])
  })

  // Empty string tags can sneak in from malformed URLs. They should be dropped
  // to avoid sending blank filter values to Shopify.
  it('filters out empty strings', () => {
    expect(normalizeTags(['', 'trap'])).toEqual(['trap'])
  })

  it('handles mixed-case duplicates by normalizing before deduplicating', () => {
    expect(normalizeTags(['Trap', 'trap'])).toEqual(['trap'])
  })
})

describe('asStringArray', () => {
  // asStringArray is used to coerce URL param values (which may be a string,
  // string[], or undefined depending on how Next.js parsed the URL) into a
  // consistent array before further processing.

  it('returns an empty array for undefined', () => {
    expect(asStringArray(undefined)).toEqual([])
  })

  it('wraps a single string in an array', () => {
    expect(asStringArray('trap')).toEqual(['trap'])
  })

  it('passes an existing array through unchanged', () => {
    expect(asStringArray(['trap', 'ambient'])).toEqual(['trap', 'ambient'])
  })

  it('returns an empty array for an empty string', () => {
    // An empty string is a falsy value — treated the same as undefined.
    expect(asStringArray('')).toEqual([])
  })
})

describe('getNormalizedSearchParams', () => {
  // getNormalizedSearchParams is the entry point for all filter/sort/search
  // state derived from the URL. It is called on every store page render.
  // Bugs here mean wrong queries to Shopify, wrong products shown to users.

  it('returns all undefined fields for empty URLSearchParams', () => {
    const result = getNormalizedSearchParams(new URLSearchParams(''))
    expect(result).toEqual({
      search: undefined,
      category: undefined,
      sort: undefined,
      tags: undefined,
      exclusive: undefined,
      after: undefined,
    })
  })

  it('parses and lowercases the category param', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('category=Kit'))
    expect(result.category).toBe('kit')
  })

  // Sort values are lowercased to normalize them. The store components use
  // lowercase sort keys when constructing Shopify queries.
  it('parses and lowercases the sort param', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('sort=PRICE'))
    expect(result.sort).toBe('price')
  })

  it('parses the search param', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('search=drum kit'))
    expect(result.search).toBe('drum kit')
  })

  // The primary tag format is comma-separated ?tags=trap,hiphop.
  // Multiple tags must be parsed, deduplicated, and sorted.
  it('parses comma-separated tags from the tags param', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('tags=trap,hiphop'))
    expect(result.tags).toEqual(['hiphop', 'trap'])
  })

  // Legacy format: ?tag=trap&tag=ambient (multiple query params with the same key).
  // Both formats must be supported simultaneously for backwards compatibility.
  it('merges legacy tag params with the tags param', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('tags=trap&tag=ambient'))
    expect(result.tags).toEqual(['ambient', 'trap'])
  })

  // A duplicate tag coming from both formats should not appear twice in the output.
  it('deduplicates tags across the tags and tag params', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('tags=trap&tag=trap'))
    expect(result.tags).toEqual(['trap'])
  })

  // Whitespace in URL param values is trimmed to avoid filter mismatches.
  it('trims whitespace from param values', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('category= kit '))
    expect(result.category).toBe('kit')
  })

  it('returns undefined for params present but empty', () => {
    const result = getNormalizedSearchParams(new URLSearchParams('category='))
    expect(result.category).toBeUndefined()
  })

  it('accepts a plain object as RawSearchParams', () => {
    const result = getNormalizedSearchParams({ category: 'kit', sort: 'PRICE' })
    expect(result.category).toBe('kit')
    expect(result.sort).toBe('price')
  })
})

describe('buildFilterKey', () => {
  // buildFilterKey generates the cache key used to deduplicate Shopify product
  // list fetches. A wrong key means stale products are served after filter
  // changes, or cache misses on every render.

  // A falsy params argument means "fetch everything" — the key should reflect that.
  it('returns ["all"] for null params', () => {
    expect(buildFilterKey(null as any)).toEqual(['all'])
  })

  it('returns ["all"] for undefined params', () => {
    expect(buildFilterKey(undefined as any)).toEqual(['all'])
  })

  // The key array must always include all param segments so different filter
  // combinations never collide.
  it('includes all param segments in the output', () => {
    const key = buildFilterKey({ category: 'kit', sort: 'price', tags: ['trap'], search: null, exclusive: null, after: null })
    expect(key).toContain('product_page')
    expect(key).toContain('sort=price')
    expect(key).toContain('category=kit')
    expect(key).toContain('tags=trap')
  })

  // The tags segment must be the joined string, not the raw array, so the
  // key is a stable string regardless of array identity.
  it('joins multiple tags with a comma in the key', () => {
    const key = buildFilterKey({ category: null, sort: null, tags: ['ambient', 'trap'], search: null, exclusive: null, after: null })
    expect(key).toContain('tags=ambient,trap')
  })

  // Two different filter states must produce different keys.
  it('produces different keys for different category values', () => {
    const key1 = buildFilterKey({ category: 'kit', sort: null, tags: null, search: null, exclusive: null, after: null })
    const key2 = buildFilterKey({ category: 'beat', sort: null, tags: null, search: null, exclusive: null, after: null })
    expect(key1).not.toEqual(key2)
  })
})
