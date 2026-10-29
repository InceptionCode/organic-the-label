import { describe, expect, test } from 'bun:test'
import { createCaptchaVerifier } from '~/server/captcha/verify'

const respond = (status: number, json: unknown) =>
  (async () => new Response(JSON.stringify(json), { status })) as unknown as typeof fetch

describe('createCaptchaVerifier', () => {
  test('missing token and missing secret fail without a network call', async () => {
    let called = false
    const spy = (async () => {
      called = true
      return new Response('{}')
    }) as unknown as typeof fetch
    expect(await createCaptchaVerifier('s', spy)('')).toEqual({ ok: false, reason: 'missing-token' })
    expect(await createCaptchaVerifier(undefined, spy)('t')).toEqual({ ok: false, reason: 'not-configured' })
    expect(called).toBe(false)
  })

  test('success, rejection and outage', async () => {
    expect(await createCaptchaVerifier('s', respond(200, { success: true }))('t')).toEqual({ ok: true })
    expect(await createCaptchaVerifier('s', respond(200, { success: false, 'error-codes': ['invalid-input-response'] }))('t')).toEqual({
      ok: false,
      reason: 'rejected',
    })
    expect(await createCaptchaVerifier('s', respond(503, {}))('t')).toEqual({ ok: false, reason: 'unavailable' })
  })

  test('posts the secret, token and remote ip as a form body', async () => {
    let sent: URLSearchParams | null = null
    const capture = (async (_url: string, init: RequestInit) => {
      sent = init.body as URLSearchParams
      return new Response(JSON.stringify({ success: true }))
    }) as unknown as typeof fetch
    await createCaptchaVerifier('secret', capture)('token', '203.0.113.9')
    expect(sent!.get('secret')).toBe('secret')
    expect(sent!.get('response')).toBe('token')
    expect(sent!.get('remoteip')).toBe('203.0.113.9')
  })
})
