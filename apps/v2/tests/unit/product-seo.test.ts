import { describe, expect, test } from 'bun:test'
import { PRODUCT_TITLE_MAX, productSeoDescription, productSeoTitle } from '~/lib/product-seo'
import { formatTitle } from '~/seo/head'

describe('product SEO rules', () => {
  test('long titles are cut at a word boundary so the full title stays under 60', () => {
    const name = 'Organic Sonics Ultimate Late Night Trap Drum Kit Volume Two Deluxe'
    const t = productSeoTitle(name)
    expect(t.length).toBeLessThanOrEqual(PRODUCT_TITLE_MAX)
    expect(name.startsWith(t)).toBe(true)
    expect(formatTitle(t).length).toBeLessThan(60)
    expect(productSeoTitle('Wave Pack')).toBe('Wave Pack')
  })

  test('long descriptions are cut to 155 at a word with "..."', () => {
    const d = productSeoDescription({ title: 'X', category: 'kit', description: 'word '.repeat(60) })
    expect(d.length).toBeLessThanOrEqual(155)
    expect(d.endsWith('...')).toBe(true)
  })

  test('short descriptions get the instant download suffix; empty ones the fallback', () => {
    expect(productSeoDescription({ title: 'Raw Pack', category: 'kit', description: 'Over 20+ trap and\n melodic sonics.' })).toBe(
      'Over 20+ trap and melodic sonics. Instant download from Organic Sonics.',
    )
    expect(productSeoDescription({ title: 'Raw Pack', category: 'kit', description: '  ' })).toBe(
      'Raw Pack: a kit from Organic Sonics. Preview it, then download instantly after checkout.',
    )
  })
})
