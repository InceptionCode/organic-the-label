import { describe, expect, test } from 'bun:test'
import { formatMoney, formatPrice } from '~/lib/format'

describe('price formatting', () => {
  test('formatMoney is pinned to en-US so SSR and the client agree', () => {
    expect(formatMoney('50.0', 'USD')).toBe('$50.00')
    expect(formatMoney('0.0', 'USD')).toBe('$0.00')
    expect(formatMoney('1234.5', 'USD')).toBe('$1,234.50')
    expect(formatMoney('9.99', 'EUR')).toBe('€9.99')
  })

  test('formatMoney falls back for bad input', () => {
    expect(formatMoney('abc', 'USD')).toBe('abc USD')
    expect(formatMoney('', 'USD')).toBe(' USD')
    expect(formatMoney('5', 'NOPE')).toBe('5 NOPE')
  })

  test('formatPrice (v1 product-helpers parity)', () => {
    expect(formatPrice(9.5)).toBe('$9.50')
    expect(formatPrice(60)).toBe('$60.00')
  })
})
