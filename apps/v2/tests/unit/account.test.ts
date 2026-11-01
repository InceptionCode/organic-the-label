import { describe, expect, test } from 'bun:test'
import { categoryLabel, formatMonthYear, formatShortDate } from '~/components/account/format'
import { getActiveEntitlements, getOwnedProducts, joinOwnedProducts, type EntitlementRow } from '~/server/account/owned-products'
import { getOwnedResources } from '~/server/account/owned-resources'
import { claimGuestEntitlements } from '~/server/identity/merge'
import { getSummary } from '~/server/account/summary'
import type { ProductSummary } from '~/server/shopify/types'
import { fakeSupabase } from './fake-supabase'

const product = (id: string, handle = id): ProductSummary => ({
  id,
  handle,
  title: `Title ${handle}`,
  createdAt: '2026-01-01T00:00:00Z',
  category: 'kit',
  tags: [],
  isExclusive: false,
  availableForSale: true,
  image: null,
  variantId: null,
  price: null,
  audioPreview: null,
})

const row = (gid: string, granted: string, source = 'order'): EntitlementRow => ({
  product_gid: gid,
  source,
  granted_at: granted,
  expires_at: null,
})

describe('getActiveEntitlements', () => {
  test('scopes to the user, hides revoked and expired rows, newest first', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: [row('gid://shopify/Product/1', '2026-10-01')], error: null }))
    const now = new Date('2026-10-27T12:00:00.000Z')
    const rows = await getActiveEntitlements(client, 'user-1', now)
    expect(rows).toHaveLength(1)
    expect(calls[0]?.table).toBe('entitlements')
    expect(calls[0]?.filters).toEqual([
      ['eq', 'user_id', 'user-1'],
      ['is', 'revoked_at', null],
      ['or', 'expires_at.is.null,expires_at.gt.2026-10-27T12:00:00.000Z', null],
      ['order', 'granted_at', { ascending: false }],
    ])
  })

  test('throws on a query error', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: { message: 'boom' } }))
    await expect(getActiveEntitlements(client, 'user-1')).rejects.toThrow('Failed to load entitlements: boom')
  })
})

describe('joinOwnedProducts', () => {
  test('keeps entitlement order, skips products Shopify no longer returns, and dedupes', () => {
    const rows = [row('gid/2', '2026-10-02'), row('gid/missing', '2026-10-01'), row('gid/1', '2026-09-01', 'promo'), row('gid/2', '2026-08-01')]
    const out = joinOwnedProducts(rows, [product('gid/1', 'one'), product('gid/2', 'two')])
    expect(out.map((o) => o.product.handle)).toEqual(['two', 'one'])
    expect(out[1]).toMatchObject({ source: 'promo', grantedAt: '2026-09-01' })
  })
})

describe('getOwnedProducts', () => {
  test('does not call the catalog when there are no entitlements', async () => {
    const { client } = fakeSupabase(() => ({ data: [], error: null }))
    let called = false
    const out = await getOwnedProducts(client, 'user-1', async () => ((called = true), []))
    expect(out).toEqual([])
    expect(called).toBe(false)
  })

  test('maps entitlement GIDs through the catalog loader', async () => {
    const { client } = fakeSupabase(() => ({ data: [row('gid/1', '2026-10-01')], error: null }))
    let asked: string[] = []
    const out = await getOwnedProducts(client, 'user-1', async (gids) => ((asked = gids), [product('gid/1')]))
    expect(asked).toEqual(['gid/1'])
    expect(out).toHaveLength(1)
  })
})

describe('getSummary', () => {
  const fallback = { email: 'claims@example.com', displayName: 'claims-name', emailConfirmed: true }

  test('reads the profile row by id', async () => {
    const { client, calls } = fakeSupabase(() => ({
      data: { email: 'a@example.com', display_name: 'beatmaker', created_at: '2026-03-01T00:00:00Z' },
      error: null,
    }))
    const summary = await getSummary(client, 'user-1', fallback)
    expect(calls[0]?.filters).toEqual([['eq', 'id', 'user-1']])
    expect(summary).toEqual({ email: 'a@example.com', displayName: 'beatmaker', memberSince: '2026-03-01T00:00:00Z', emailConfirmed: true })
  })

  test('falls back to the session claims when the profile row is missing', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: null }))
    expect(await getSummary(client, 'user-1', fallback)).toEqual({
      email: 'claims@example.com',
      displayName: 'claims-name',
      memberSince: null,
      emailConfirmed: true,
    })
  })
})

describe('account formatting', () => {
  test('dates print in UTC so SSR and hydration agree', () => {
    expect(formatMonthYear('2026-10-01T02:00:00Z')).toBe('October 2026')
    expect(formatShortDate('2026-10-27T23:30:00Z')).toBe('Oct 27, 2026')
    expect(formatShortDate('nope')).toBeNull()
    expect(formatMonthYear(null)).toBeNull()
  })

  test('category labels follow v1 STORE_CATEGORIES', () => {
    expect(categoryLabel('plugin')).toBe('VSTs & Plugins')
    expect(categoryLabel('other')).toBe('other')
    expect(categoryLabel('')).toBeNull()
  })
})

describe('claimGuestEntitlements', () => {
  test('links unclaimed, unrevoked rows for the lowercased email to the user', async () => {
    const { client, calls } = fakeSupabase()
    await claimGuestEntitlements({ userId: 'user-1', email: ' Buyer@Example.com ' }, client)
    expect(calls[0]).toEqual({
      table: 'entitlements',
      op: 'update',
      payload: { user_id: 'user-1' },
      filters: [
        ['eq', 'purchaser_email', 'buyer@example.com'],
        ['is', 'user_id', null],
        ['is', 'revoked_at', null],
      ],
    })
  })
})

describe('getOwnedResources', () => {
  test('no contact means no resources and no second query', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: null, error: null }))
    expect(await getOwnedResources('a@example.com', client)).toEqual([])
    expect(calls).toHaveLength(1)
  })

  test('newest request per active resource, filtered by the contact for that email', async () => {
    const res = (id: string, slug: string, active = true) => ({
      id,
      created_at: `2026-10-0${id}T00:00:00Z`,
      free_resources: { slug, name: slug.toUpperCase(), description: null, active },
    })
    const { client, calls } = fakeSupabase((call) =>
      call.table === 'email_contacts'
        ? { data: { id: 'contact-1' }, error: null }
        : { data: [res('3', 'kit'), res('2', 'kit'), res('1', 'old', false)], error: null },
    )
    const out = await getOwnedResources('A@Example.com', client)
    expect(calls[0]!.filters).toEqual([['eq', 'email', 'a@example.com']])
    expect(calls[1]!.filters[0]).toEqual(['eq', 'contact_id', 'contact-1'])
    expect(out).toEqual([{ slug: 'kit', name: 'KIT', description: null, requestedAt: '2026-10-03T00:00:00Z', downloadId: '3' }])
  })
})
