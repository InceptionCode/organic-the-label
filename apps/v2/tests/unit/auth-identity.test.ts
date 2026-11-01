import { describe, expect, test } from 'bun:test'
import { mapClaims, mapUser } from '~/lib/map-user'
import { safeNext } from '~/lib/safe-next'
import { isBot } from '~/server/identity/bots'
import { bootstrapUser } from '~/server/identity/bootstrap'
import { mergeVisitor } from '~/server/identity/merge'
import { ANON_COOKIE, ensureVisitor } from '~/server/identity/visitor'
import { fakeSupabase } from './fake-supabase'

describe('safeNext', () => {
  test('keeps same-origin paths', () => {
    expect(safeNext('/explore')).toBe('/explore')
    expect(safeNext('/login/reset-password')).toBe('/login/reset-password')
    expect(safeNext('/products/x?tab=1#a')).toBe('/products/x?tab=1#a')
  })
  test('falls back to /explore for anything else', () => {
    for (const bad of [undefined, null, '', 'explore', '//evil.com', '/\\evil.com', 'https://evil.com', '/\t/evil.com', 'javascript:alert(1)']) {
      expect(safeNext(bad)).toBe('/explore')
    }
  })
})

describe('isBot', () => {
  test('flags crawlers, previewers, headless, and empty user agents', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'facebookexternalhit/1.1',
      'Mozilla/5.0 HeadlessChrome/120.0',
      'Slackbot-LinkExpanding 1.0',
      'curl/8.4.0',
      '',
      undefined,
    ]) {
      expect(isBot(ua)).toBe(true)
    }
  })
  test('lets real browsers through', () => {
    expect(isBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36')).toBe(false)
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')).toBe(false)
  })
})

describe('session mapping', () => {
  const meta = { email_verified: true, username: 'neo' }
  test('maps claims', () => {
    expect(mapClaims({ sub: 'u1', email: 'a@x.test', user_metadata: meta })).toEqual({
      id: 'u1',
      email: 'a@x.test',
      emailVerified: true,
      displayName: 'neo',
    })
    expect(mapClaims({ sub: 'u1', user_metadata: { display_name: 'Neo' } })).toEqual({
      id: 'u1',
      email: null,
      emailVerified: false,
      displayName: 'Neo',
    })
  })
  test('treats anonymous and missing sessions as signed out', () => {
    expect(mapClaims(null)).toBeNull()
    expect(mapClaims({ sub: 'u1', is_anonymous: true })).toBeNull()
    expect(mapUser(undefined)).toBeNull()
    expect(mapUser({ id: 'u1', is_anonymous: true })).toBeNull()
  })
  test('maps users the same way as claims', () => {
    expect(mapUser({ id: 'u1', email: 'a@x.test', email_confirmed_at: '2026-01-01', user_metadata: { username: 'neo' } })).toEqual({
      id: 'u1',
      email: 'a@x.test',
      emailVerified: true,
      displayName: 'neo',
    })
  })
})

describe('mergeVisitor', () => {
  const input = { userId: 'user-1', email: 'a@x.test', emailVerified: true, anonToken: 'tok' }

  test('claims entitlements, moves events, and claims the visitor', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.table === 'anonymous_visitors' && call.op === 'select'
        ? { data: { id: 'v1', claimed_by_user_id: null }, error: null }
        : { data: null, error: null },
    )
    await mergeVisitor(input, client)
    expect(calls.map((c) => `${c.op}:${c.table}`)).toEqual([
      'update:entitlements',
      'select:anonymous_visitors',
      'update:activity_events',
      'update:anonymous_visitors',
    ])
    expect(calls[0]!.filters).toEqual([
      ['eq', 'purchaser_email', 'a@x.test'],
      ['is', 'user_id', null],
      ['is', 'revoked_at', null],
    ])
    expect(calls[2]!.filters).toEqual([
      ['eq', 'anonymous_visitor_id', 'v1'],
      ['is', 'user_id', null],
    ])
    expect(calls[3]!.payload).toMatchObject({ claimed_by_user_id: 'user-1' })
  })

  test('is a no-op write for a visitor already claimed by the user', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.table === 'anonymous_visitors' ? { data: { id: 'v1', claimed_by_user_id: 'user-1' }, error: null } : { data: null, error: null },
    )
    await mergeVisitor(input, client)
    expect(calls.some((c) => c.op === 'update' && c.table === 'anonymous_visitors')).toBe(false)
  })

  test('skips entitlements for unverified email and stops without a visitor', async () => {
    const { client, calls } = fakeSupabase()
    await mergeVisitor({ ...input, emailVerified: false }, client)
    expect(calls.map((c) => `${c.op}:${c.table}`)).toEqual(['select:anonymous_visitors'])
  })

  test('does nothing for visitors without an anon token', async () => {
    const { client, calls } = fakeSupabase()
    await mergeVisitor({ ...input, emailVerified: false, anonToken: undefined }, client)
    expect(calls).toEqual([])
  })

  test('throws when a step fails', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: { message: 'boom' } }))
    await expect(mergeVisitor(input, client)).rejects.toThrow('boom')
  })
})

describe('bootstrapUser', () => {
  test('upserts profile and preferences before merging', async () => {
    const { client, calls } = fakeSupabase()
    await bootstrapUser({ userId: 'u1', email: 'a@x.test', emailVerified: false, displayName: null, anonToken: null }, client)
    expect(calls.map((c) => `${c.op}:${c.table}`)).toEqual(['upsert:profiles', 'upsert:user_preferences'])
    expect(calls[0]!.payload).toEqual({ id: 'u1', email: 'a@x.test' })
  })
})

describe('ensureVisitor', () => {
  const browser = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36'

  test('returns null for bots without touching the database', async () => {
    const { client, calls } = fakeSupabase()
    const set: string[] = []
    const result = await ensureVisitor({ getCookie: () => undefined, setCookie: (n) => set.push(n), userAgent: 'Googlebot' }, client)
    expect(result).toBeNull()
    expect(calls).toEqual([])
    expect(set).toEqual([])
  })

  test('creates a token and sets the cookie once', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: { id: 'v1' }, error: null }))
    const jar = new Map<string, string>()
    const options: unknown[] = []
    const deps = {
      getCookie: (n: string) => jar.get(n),
      setCookie: (n: string, v: string, o: unknown) => (jar.set(n, v), options.push(o)),
      userAgent: browser,
    }
    expect(await ensureVisitor(deps, client)).toEqual({ id: 'v1' })
    const token = jar.get(ANON_COOKIE)
    expect(token).toMatch(/^[0-9a-f-]{36}$/)
    expect(options[0]).toEqual({ httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 31536000 })

    expect(await ensureVisitor(deps, client)).toEqual({ id: 'v1' })
    expect(options).toHaveLength(1)
    expect(calls.map((c) => (c.payload as { anon_token: string }).anon_token)).toEqual([token!, token!])
  })
})
