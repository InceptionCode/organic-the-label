import { describe, expect, mock, test } from 'bun:test'
import {
  MAX_CLOCK_SKEW_SECONDS,
  PURGE_SIGNATURE_HEADER,
  PURGE_TIMESTAMP_HEADER,
  handlePurgeRequest,
  isAllowedTag,
  signPurge,
  tagsToInvalidate,
  verifyPurgeSignature,
  type PurgeDeps,
} from '~/server/cache/purge'

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef'
const NOW = 1_800_000_000

function signedRequest(body: unknown, opts: { secret?: string; timestamp?: number; signature?: string } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  const timestamp = String(opts.timestamp ?? NOW)
  const signature = opts.signature ?? signPurge(opts.secret ?? SECRET, timestamp, raw)
  return new Request('https://example.test/api/cache/purge', {
    method: 'POST',
    headers: { 'content-type': 'application/json', [PURGE_SIGNATURE_HEADER]: signature, [PURGE_TIMESTAMP_HEADER]: timestamp },
    body: raw,
  })
}

function deps(overrides: Partial<PurgeDeps> = {}) {
  const invalidate = mock(async (_tags: string[]) => {})
  return { invalidate, deps: { secret: SECRET, available: () => true, invalidate, now: () => NOW, ...overrides } }
}

describe('isAllowedTag', () => {
  test('accepts the families v2 tags responses with', () => {
    for (const tag of ['products', 'compositions', 'free-resources', 'product:wave-pack', 'product:808s']) expect(isAllowedTag(tag)).toBe(true)
  })
  test('rejects anything else', () => {
    for (const tag of ['', '*', 'Products', 'product:', 'product:Wave', 'product:a,b', 'product:a b', 'compositions:list', `product:${'a'.repeat(201)}`]) {
      expect(isAllowedTag(tag)).toBe(false)
    }
  })
})

describe('verifyPurgeSignature', () => {
  const raw = '{"tags":["products"]}'
  const base = { secret: SECRET, rawBody: raw, timestamp: String(NOW), nowSeconds: NOW }
  test('ok for a valid signature', () => {
    expect(verifyPurgeSignature({ ...base, signature: signPurge(SECRET, String(NOW), raw) })).toBe('ok')
  })
  test('invalid for a signature made with another secret or body', () => {
    expect(verifyPurgeSignature({ ...base, signature: signPurge('other-secret', String(NOW), raw) })).toBe('invalid')
    expect(verifyPurgeSignature({ ...base, signature: signPurge(SECRET, String(NOW), '{"tags":["compositions"]}') })).toBe('invalid')
    expect(verifyPurgeSignature({ ...base, signature: 'not-hex' })).toBe('invalid')
  })
  test('the timestamp is part of the signed material', () => {
    const later = String(NOW + 10)
    expect(verifyPurgeSignature({ ...base, timestamp: later, signature: signPurge(SECRET, String(NOW), raw) })).toBe('invalid')
  })
  test('stale outside the 5 minute window, either direction', () => {
    for (const ts of [NOW - MAX_CLOCK_SKEW_SECONDS - 1, NOW + MAX_CLOCK_SKEW_SECONDS + 1]) {
      const timestamp = String(ts)
      expect(verifyPurgeSignature({ ...base, timestamp, signature: signPurge(SECRET, timestamp, raw) })).toBe('stale')
    }
  })
  test('missing without both headers', () => {
    expect(verifyPurgeSignature({ ...base, signature: null })).toBe('missing')
    expect(verifyPurgeSignature({ ...base, timestamp: null, signature: 'a'.repeat(64) })).toBe('missing')
  })
})

describe('tagsToInvalidate', () => {
  test('dedupes in order', () => {
    expect(tagsToInvalidate(['product:a', 'products', 'product:a'])).toEqual(['product:a', 'products'])
  })
})

describe('handlePurgeRequest', () => {
  test('invalidates the requested tags and answers no-store, noindex', async () => {
    const { invalidate, deps: d } = deps()
    const res = await handlePurgeRequest(signedRequest({ tags: ['product:wave-pack', 'products', 'products'] }), d)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, invalidated: ['product:wave-pack', 'products'] })
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate.mock.calls[0]?.[0]).toEqual(['product:wave-pack', 'products'])
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
  })

  test('503 when the secret is unset, before reading anything', async () => {
    const { invalidate, deps: d } = deps({ secret: undefined })
    const res = await handlePurgeRequest(signedRequest({ tags: ['products'] }), d)
    expect(res.status).toBe(503)
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('401 for a wrong signature, a stale timestamp or no signature; never echoes the secret', async () => {
    const { invalidate, deps: d } = deps()
    const cases = [
      signedRequest({ tags: ['products'] }, { secret: 'wrong-secret' }),
      signedRequest({ tags: ['products'] }, { timestamp: NOW - MAX_CLOCK_SKEW_SECONDS - 60 }),
      new Request('https://example.test/api/cache/purge', { method: 'POST', body: '{"tags":["products"]}' }),
    ]
    for (const req of cases) {
      const res = await handlePurgeRequest(req, d)
      expect(res.status).toBe(401)
      expect(await res.text()).not.toContain(SECRET)
    }
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('400 for bad tags or bad JSON, even when signed', async () => {
    const { invalidate, deps: d } = deps()
    const bodies = [
      { tags: [] },
      { tags: ['*'] },
      { tags: ['products', 'product:Bad Handle'] },
      { tags: Array.from({ length: 65 }, () => 'products') },
      { nope: true },
      'not json',
    ]
    for (const body of bodies) expect((await handlePurgeRequest(signedRequest(body), d)).status).toBe(400)
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('413 for an oversized body', async () => {
    const { deps: d } = deps()
    expect((await handlePurgeRequest(signedRequest(`{"tags":["${'a'.repeat(20_000)}"]}`), d)).status).toBe(413)
  })

  test('503 off Vercel instead of a silent no-op', async () => {
    const { invalidate, deps: d } = deps({ available: () => false })
    const res = await handlePurgeRequest(signedRequest({ tags: ['compositions'] }), d)
    expect(res.status).toBe(503)
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('502 when invalidation throws', async () => {
    const { deps: d } = deps({ invalidate: async () => Promise.reject(new Error('429')) })
    expect((await handlePurgeRequest(signedRequest({ tags: ['free-resources'] }), d)).status).toBe(502)
  })
})
