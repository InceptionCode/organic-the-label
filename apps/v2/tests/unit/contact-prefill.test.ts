import { describe, expect, test } from 'bun:test'
import {
  CONTACT_MESSAGE_MAX,
  CONTACT_SUBJECT_MAX,
  accessRequestHref,
  accessRequestSearch,
  prefillMessage,
  validateContactSearch,
} from '~/lib/contact-prefill'
import { freeResourceDownloadHref, resolveOwnedAccess } from '~/lib/use-owned'
import { joinOwnedProducts, orderIdFromGid } from '~/server/account/owned-products'
import type { ProductSummary } from '~/server/shopify/types'

describe('validateContactSearch', () => {
  test('keeps valid params, trimmed', () => {
    expect(
      validateContactSearch({ category: 'download_issue', subject: '  Access request: Wave Pack ', message: 'Hi there, need a link', order: '1234567' }),
    ).toEqual({ category: 'download_issue', subject: 'Access request: Wave Pack', message: 'Hi there, need a link', order: '1234567' })
  })

  test('plain /contact has every key absent', () => {
    expect(validateContactSearch({})).toEqual({ category: undefined, subject: undefined, message: undefined, order: undefined })
  })

  test('drops unknown or form-excluded categories, oversized text, and bad order refs', () => {
    expect(
      validateContactSearch({
        category: 'work_with_me',
        subject: 'x'.repeat(CONTACT_SUBJECT_MAX + 1),
        message: 'y'.repeat(CONTACT_MESSAGE_MAX + 1),
        order: '12<script>',
      }),
    ).toEqual({ category: undefined, subject: undefined, message: undefined, order: undefined })
    expect(validateContactSearch({ category: 'nope', subject: '   ', order: { a: 1 } })).toMatchObject({ category: undefined, subject: undefined, order: undefined })
  })

  test('takes the first of repeated keys and stringifies numeric orders', () => {
    expect(validateContactSearch({ category: ['order_issue', 'general'], order: 98765 })).toMatchObject({ category: 'order_issue', order: '98765' })
  })

  test('accepts a JSON-quoted order from a hand-built link', () => {
    expect(validateContactSearch({ order: '"5678901234"' }).order).toBe('5678901234')
  })
})

describe('prefillMessage', () => {
  test('appends the order reference on its own line', () => {
    expect(prefillMessage({ message: 'Need a link.', order: '42' })).toBe('Need a link.\n\nOrder ID: 42')
    expect(prefillMessage({ order: '42' })).toBe('Order ID: 42')
    expect(prefillMessage({ message: 'Need a link.' })).toBe('Need a link.')
    expect(prefillMessage({})).toBe('')
  })
})

describe('access request', () => {
  test('with an order id: download category, subject, message, separate order param', () => {
    expect(accessRequestSearch('Wave Pack', '555')).toEqual({
      category: 'download_issue',
      subject: 'Access request: Wave Pack',
      message: 'Hi, I purchased Wave Pack and need access to the files. Could you send me a download link?',
      order: '555',
    })
  })

  test('without an order id: leaves an order number line to fill in', () => {
    const search = accessRequestSearch('Raw Pack', null)
    expect(search.order).toBeUndefined()
    expect(search.message).toEndWith('Order number: ')
  })

  test('href round-trips through validateContactSearch', () => {
    const href = accessRequestHref('Organic Sonics - Raw Pack & More', '777')
    expect(href.startsWith('/contact?')).toBe(true)
    const parsed = validateContactSearch(Object.fromEntries(new URL(href, 'https://x.test').searchParams))
    expect(parsed).toEqual(accessRequestSearch('Organic Sonics - Raw Pack & More', '777'))
  })
})

describe('resolveOwnedAccess', () => {
  const owned = { product: { title: 'Wave Pack' }, orderId: '555' }

  test('falls back to a prefilled contact request when there is no direct source', () => {
    const access = resolveOwnedAccess(owned)
    expect(access.kind).toBe('contact')
    expect(access.label).toBe('Request access')
    expect(access.href).toBe(accessRequestHref('Wave Pack', '555'))
    if (access.kind === 'contact') expect(access.search).toEqual(accessRequestSearch('Wave Pack', '555'))
  })

  test('uses a direct https URL when the data carries one; ignores non-https', () => {
    expect(resolveOwnedAccess({ ...owned, accessUrl: 'https://cdn.example.com/f.zip' })).toEqual({
      kind: 'direct',
      href: 'https://cdn.example.com/f.zip',
      label: 'Access',
    })
    expect(resolveOwnedAccess({ ...owned, accessUrl: 'javascript:alert(1)' }).kind).toBe('contact')
  })

  test('free resources keep their direct download route', () => {
    expect(freeResourceDownloadHref('abc')).toBe('/free/download/abc')
  })
})

describe('order id from entitlements', () => {
  test('orderIdFromGid', () => {
    expect(orderIdFromGid('gid://shopify/Order/123456')).toBe('123456')
    expect(orderIdFromGid(null)).toBeNull()
    expect(orderIdFromGid('gid://shopify/Product/1')).toBeNull()
  })

  test('joinOwnedProducts carries the order id', () => {
    const product = { id: 'gid/1', handle: 'one', title: 'One', category: 'kit', image: null } as unknown as ProductSummary
    const out = joinOwnedProducts(
      [{ product_gid: 'gid/1', source: 'order', granted_at: '2026-10-01', expires_at: null, shopify_order_gid: 'gid://shopify/Order/99' }],
      [product],
    )
    expect(out[0]?.orderId).toBe('99')
  })
})
