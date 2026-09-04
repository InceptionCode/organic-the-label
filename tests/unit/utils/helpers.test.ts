import { describe, it, expect } from 'vitest'
import { truncateWords } from '@/utils/helpers/truncate'
import { parseMultiValueParam, serializeMultiValueParam } from '@/utils/helpers/filter-query'
import { formatCategory, formatPrice, formatMoney } from '@/utils/helpers/product-helpers'
import { queryRecoveryToken } from '@/utils/helpers/token'
import { checkMembershipCtaVisibility } from '@/lib/membership-cta/visibility'

// All functions in this file are pure — no mocking required.

// ---------------------------------------------------------------------------
// truncateWords
// ---------------------------------------------------------------------------

describe('truncateWords', () => {
  // Invalid input should never throw — the function must degrade gracefully
  // because it runs on Shopify product descriptions that may be null/undefined
  // from a missing metafield.
  it('returns empty string for null input', () => {
    expect(truncateWords(null as unknown as string)).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(truncateWords(undefined as unknown as string)).toBe('')
  })

  it('returns empty string for a numeric input', () => {
    expect(truncateWords(42 as unknown as string)).toBe('')
  })

  // When the text is shorter than the limit, returning it unchanged preserves
  // every word the user authored — no silent data loss.
  it('returns text unchanged when word count is below maxWords', () => {
    expect(truncateWords('short text here', 10)).toBe('short text here')
  })

  // Exactly at the limit means no truncation is needed.
  it('returns text unchanged when word count exactly equals maxWords', () => {
    const text = 'one two three four five'
    expect(truncateWords(text, 5)).toBe(text)
  })

  // The default limit is 10 words.
  it('truncates to 10 words by default and appends "..."', () => {
    const text = 'one two three four five six seven eight nine ten eleven'
    const result = truncateWords(text)
    expect(result).toBe('one two three four five six seven eight nine ten...')
  })

  // A custom suffix should replace the default "..." when provided.
  it('uses a custom suffix when provided', () => {
    const text = 'alpha beta gamma delta epsilon zeta'
    expect(truncateWords(text, 3, ' [more]')).toBe('alpha beta gamma [more]')
  })

  // Multiple spaces between words must be collapsed — otherwise a string with
  // extra spaces could produce fewer visible words than expected.
  it('handles multiple consecutive spaces between words', () => {
    const text = 'word1   word2   word3   word4   word5   word6'
    expect(truncateWords(text, 3)).toBe('word1 word2 word3...')
  })
})

// ---------------------------------------------------------------------------
// parseMultiValueParam / serializeMultiValueParam
// ---------------------------------------------------------------------------

describe('parseMultiValueParam', () => {
  // Null param means the URL had no value for this key — must return [].
  it('returns [] for null input', () => {
    expect(parseMultiValueParam(null)).toEqual([])
  })

  it('returns [] for an empty string', () => {
    expect(parseMultiValueParam('')).toEqual([])
  })

  // A single value is the common case — one tag in the URL.
  it('returns a single-element array for a single value', () => {
    expect(parseMultiValueParam('trap')).toEqual(['trap'])
  })

  // The primary multi-value format: comma-separated values in one param.
  it('splits comma-separated values into an array', () => {
    expect(parseMultiValueParam('trap,hiphop,ambient')).toEqual(['trap', 'hiphop', 'ambient'])
  })

  // URL params sometimes arrive with surrounding whitespace from manual edits
  // or programmatic concatenation. Each value must be trimmed.
  it('trims whitespace around each value', () => {
    expect(parseMultiValueParam(' trap , hiphop ')).toEqual(['trap', 'hiphop'])
  })

  // Empty segments from double commas or trailing commas must be dropped.
  it('filters out empty segments from double commas', () => {
    expect(parseMultiValueParam('trap,,ambient')).toEqual(['trap', 'ambient'])
  })
})

describe('serializeMultiValueParam', () => {
  // Empty array means "no filter" — must return null so the URL param is deleted
  // rather than left as an empty string (?tags=).
  it('returns null for an empty array', () => {
    expect(serializeMultiValueParam([])).toBeNull()
  })

  it('returns null for null/undefined input', () => {
    expect(serializeMultiValueParam(null as unknown as string[])).toBeNull()
  })

  // Single value — no commas, just the value.
  it('returns the value string for a single-element array', () => {
    expect(serializeMultiValueParam(['trap'])).toBe('trap')
  })

  // Multiple values should be joined with commas (matching the parse format).
  it('joins multiple values with commas', () => {
    expect(serializeMultiValueParam(['trap', 'hiphop', 'ambient'])).toBe('trap,hiphop,ambient')
  })
})

// ---------------------------------------------------------------------------
// formatPrice / formatMoney / formatCategory
// ---------------------------------------------------------------------------

describe('formatPrice', () => {
  // The primary use case — a standard product price.
  it('formats a decimal price with dollar sign and two decimal places', () => {
    expect(formatPrice(29.99)).toBe('$29.99')
  })

  // Free products must show $0.00, not $0 or an empty string.
  it('formats zero as "$0.00"', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  // Whole numbers must be padded to two decimal places for visual consistency.
  it('pads whole numbers to two decimal places', () => {
    expect(formatPrice(50)).toBe('$50.00')
  })

  // Shopify prices can have three decimal digits — toFixed(2) rounds to nearest cent.
  it('rounds to two decimal places', () => {
    expect(formatPrice(9.999)).toBe('$10.00')
  })
})

describe('formatMoney', () => {
  // The standard case from cart totals and PriceDisplay.
  it('formats a valid USD amount as a currency string', () => {
    const result = formatMoney('29.99', 'USD')
    // Intl.NumberFormat locale varies by environment but the number must appear
    expect(result).toContain('29.99')
  })

  // NaN amounts must fall back gracefully — otherwise the cart shows "NaN USD".
  it('falls back to "<amount> <currencyCode>" for a non-numeric amount', () => {
    expect(formatMoney('not-a-number', 'USD')).toBe('not-a-number USD')
  })

  // Empty string: Number('') === 0, so Intl.NumberFormat formats it as $0.00.
  // This is the actual JS behaviour — not NaN — so the function returns $0.00.
  it('formats an empty amount string as $0.00 (Number("") === 0)', () => {
    const result = formatMoney('', 'USD')
    expect(result).toContain('0')
  })
})

describe('formatCategory', () => {
  // ProductSchema enforces category as one of 8 enum literals ('kit', 'beat', etc.).
  // formatCategory is called with those clean strings; it capitalises the first letter.
  it('capitalises the first letter of a lowercase category', () => {
    expect(formatCategory(['kit'])).toEqual(['Kit'])
  })

  it('handles multiple categories in the array', () => {
    const result = formatCategory(['kit', 'beat', 'pack'])
    expect(result).toEqual(['Kit', 'Beat', 'Pack'])
  })

  it('returns an empty array for empty input', () => {
    expect(formatCategory([])).toEqual([])
  })

  // Already-capitalised strings should pass through unchanged for the first letter.
  it('handles an already-capitalised category', () => {
    expect(formatCategory(['Kit'])).toEqual(['Kit'])
  })
})

// ---------------------------------------------------------------------------
// queryRecoveryToken
// ---------------------------------------------------------------------------

describe('queryRecoveryToken', () => {
  // Missing key — no recovery param in the URL.
  it('returns undefined when the recovery key is absent', () => {
    expect(queryRecoveryToken({})).toBeUndefined()
  })

  // Direct string value from URLSearchParams.
  it('returns the string value when the param is a plain string', () => {
    expect(queryRecoveryToken({ recovery_token: 'abc123' })).toBe('abc123')
  })

  // Array format from Next.js when the same param appears multiple times.
  it('returns the first element when the param is an array', () => {
    expect(queryRecoveryToken({ recovery_token: ['first', 'second'] })).toBe('first')
  })

  // An empty array should not return a value — empty first element means no token.
  it('returns undefined when the param is an empty array', () => {
    expect(queryRecoveryToken({ recovery_token: [] })).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// checkMembershipCtaVisibility
// ---------------------------------------------------------------------------

describe('checkMembershipCtaVisibility', () => {
  // If the cookie is absent the CTA has not been dismissed — show it.
  it('returns true when the dismissed cookie is absent', () => {
    const cookieStore = { get: () => undefined }
    expect(checkMembershipCtaVisibility(cookieStore)).toBe(true)
  })

  // If the cookie is present the user dismissed the CTA — hide it.
  it('returns false when the dismissed cookie has a value', () => {
    const cookieStore = { get: () => ({ value: '1' }) }
    expect(checkMembershipCtaVisibility(cookieStore)).toBe(false)
  })

  // The cookie value content does not matter — any presence means dismissed.
  it('returns false for any non-empty cookie value', () => {
    const cookieStore = { get: () => ({ value: 'true' }) }
    expect(checkMembershipCtaVisibility(cookieStore)).toBe(false)
  })
})
