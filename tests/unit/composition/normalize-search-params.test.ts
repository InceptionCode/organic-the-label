import { describe, it, expect } from 'vitest'
import {
  getNormalizedCompositionSearchParams,
  rangeToCutoffISO,
} from '@/lib/composition/normalize-search-params'

// Pure functions — no mocking. This is the entry point for all filter/sort
// state derived from the /compositions URL; it runs on every page render and
// drives the Supabase query + the unstable_cache key.

describe('getNormalizedCompositionSearchParams', () => {
  it('applies defaults for an empty param set', () => {
    expect(getNormalizedCompositionSearchParams({})).toEqual({
      search: undefined,
      tags: undefined,
      range: 'all',
      sort: 'newest',
    })
  })

  it('lowercases the search term', () => {
    expect(getNormalizedCompositionSearchParams({ search: 'Gunna Type' }).search).toBe('gunna type')
  })

  it('trims blank params back to undefined', () => {
    const result = getNormalizedCompositionSearchParams({ search: '  ', range: ' ', tags: '' })
    expect(result.search).toBeUndefined()
    expect(result.tags).toBeUndefined()
    expect(result.range).toBe('all')
  })

  it('parses comma-separated tags, lowercased, deduped and sorted', () => {
    expect(
      getNormalizedCompositionSearchParams({ tags: 'Vintage, melodic , vintage' }).tags,
    ).toEqual(['melodic', 'vintage'])
  })

  it('accepts every valid range value', () => {
    for (const range of ['7d', '30d', '90d', 'year', 'all'] as const) {
      expect(getNormalizedCompositionSearchParams({ range }).range).toBe(range)
    }
  })

  it('falls back to "all" for an unknown range', () => {
    expect(getNormalizedCompositionSearchParams({ range: 'decade' }).range).toBe('all')
  })

  it('accepts "newest" and "oldest" sort, falling back to "newest"', () => {
    expect(getNormalizedCompositionSearchParams({ sort: 'oldest' }).sort).toBe('oldest')
    expect(getNormalizedCompositionSearchParams({ sort: 'sideways' }).sort).toBe('newest')
  })

  it('takes the first value when a param arrives as an array', () => {
    expect(getNormalizedCompositionSearchParams({ range: ['30d', '7d'] }).range).toBe('30d')
  })
})

describe('rangeToCutoffISO', () => {
  const now = new Date('2026-09-06T12:00:00.000Z')

  it('returns null for "all" (no lower bound)', () => {
    expect(rangeToCutoffISO('all', now)).toBeNull()
  })

  it('subtracts the right number of days for day-based ranges', () => {
    expect(rangeToCutoffISO('7d', now)).toBe('2026-08-30T12:00:00.000Z')
    expect(rangeToCutoffISO('30d', now)).toBe('2026-08-07T12:00:00.000Z')
    expect(rangeToCutoffISO('90d', now)).toBe('2026-06-08T12:00:00.000Z')
  })

  it('"year" pins to Jan 1 of the current UTC year', () => {
    expect(rangeToCutoffISO('year', now)).toBe('2026-01-01T00:00:00.000Z')
  })

  it('is deterministic for the same instant (safe as a cache-key input)', () => {
    expect(rangeToCutoffISO('30d', now)).toBe(rangeToCutoffISO('30d', now))
  })
})
