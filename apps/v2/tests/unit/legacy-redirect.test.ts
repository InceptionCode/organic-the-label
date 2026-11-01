import { describe, expect, test } from 'bun:test'
import { legacyLocation, legacyRedirect } from '~/server/http/legacy-redirect'

const ORIGIN = 'https://example.test'

describe('legacyLocation', () => {
  test('keeps the query string exactly (auth confirm)', () => {
    const url = `${ORIGIN}/api/auth/confirm?token_hash=abc&type=email&next=/explore`
    expect(legacyLocation('/auth/confirm', url)).toBe('/auth/confirm?token_hash=abc&type=email&next=/explore')
  })

  test('no query string, no trailing ?', () => {
    expect(legacyLocation('/auth/confirm', `${ORIGIN}/api/auth/confirm`)).toBe('/auth/confirm')
  })

  test('appends the param as one encoded segment', () => {
    expect(legacyLocation('/free/download', `${ORIGIN}/api/resources/download/abc-123?t=1`, 'abc-123')).toBe('/free/download/abc-123?t=1')
    expect(legacyLocation('/compositions/download', `${ORIGIN}/x`, 'a b/c?d#e')).toBe('/compositions/download/a%20b%2Fc%3Fd%23e')
  })

  test('cannot be turned into a protocol-relative or cross-origin Location', () => {
    for (const param of ['/evil.example', '//evil.example', '\\\\evil.example', 'https://evil.example', '@evil.example']) {
      const location = legacyLocation('/free/download', `${ORIGIN}/x`, param)!
      expect(location.startsWith('/free/download/')).toBe(true)
      expect(new URL(location, ORIGIN).origin).toBe(ORIGIN)
      expect(new URL(location, ORIGIN).pathname.split('/').length).toBe(4)
    }
  })

  test('a query string cannot change the origin either', () => {
    const location = legacyLocation('/auth/confirm', `${ORIGIN}/api/auth/confirm?next=//evil.example`)!
    expect(location).toBe('/auth/confirm?next=//evil.example')
    expect(new URL(location, ORIGIN).origin).toBe(ORIGIN)
  })

  test('empty and dot segments are refused', () => {
    for (const param of ['', '.', '..', '%2e', '%2E%2e']) expect(legacyLocation('/free/download', `${ORIGIN}/x`, param)).toBeNull()
  })

  test('rejects a target that is not a same-origin path', () => {
    for (const target of ['auth/confirm', '//evil.example', 'https://evil.example', '/a\\b']) {
      expect(() => legacyLocation(target, `${ORIGIN}/x`)).toThrow()
    }
  })
})

describe('legacyRedirect', () => {
  test('308, relative Location, no-store', () => {
    const res = legacyRedirect('/compositions/download', new Request(`${ORIGIN}/api/composition/download/lofi-1?x=1&x=2`), 'lofi-1')
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('/compositions/download/lofi-1?x=1&x=2')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  test('404 for a param that cannot be redirected', () => {
    const res = legacyRedirect('/free/download', new Request(`${ORIGIN}/x`), '..')
    expect(res.status).toBe(404)
    expect(res.headers.get('location')).toBeNull()
  })
})
