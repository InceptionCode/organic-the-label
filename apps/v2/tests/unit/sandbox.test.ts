import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { createCaptchaVerifier } from '~/server/captcha/verify'
import { createMailerLiteClient } from '~/server/email/mailerlite'
import { createResendClient } from '~/server/email/resend'
import {
  HCAPTCHA_TEST_TOKEN,
  SANDBOX_LOG_LIMIT,
  assertSandboxAllowed,
  handleSandboxRequest,
  isProductionRuntime,
  isSandboxed,
  readSandboxLog,
  recordSandboxCall,
  resetSandboxLog,
} from '~/server/sandbox'

const realFetch = globalThis.fetch
const on = () => true
const off = () => false

beforeEach(() => resetSandboxLog())
afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.E2E_SANDBOX
})

function failFetch() {
  const fn = mock(async () => new Response('should not be called', { status: 500 }))
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

describe('sandbox guard', () => {
  test('production runtimes are detected from NODE_ENV or VERCEL_ENV', () => {
    expect(isProductionRuntime({ NODE_ENV: 'production' })).toBe(true)
    expect(isProductionRuntime({ NODE_ENV: 'development', VERCEL_ENV: 'production' })).toBe(true)
    expect(isProductionRuntime({ NODE_ENV: 'development', VERCEL_ENV: 'preview' })).toBe(false)
    expect(isProductionRuntime({ NODE_ENV: 'test' })).toBe(false)
  })

  test('E2E_SANDBOX=true in production fails fast', () => {
    expect(() => assertSandboxAllowed({ E2E_SANDBOX: 'true', NODE_ENV: 'production' })).toThrow('not allowed in production')
    expect(() => assertSandboxAllowed({ E2E_SANDBOX: 'true', NODE_ENV: 'development', VERCEL_ENV: 'production' })).toThrow()
    expect(() => assertSandboxAllowed({ E2E_SANDBOX: 'true', NODE_ENV: 'development' })).not.toThrow()
    expect(() => assertSandboxAllowed({ NODE_ENV: 'production' })).not.toThrow()
  })

  test('isSandboxed needs the exact flag and a non-production runtime', () => {
    expect(isSandboxed({ E2E_SANDBOX: 'true', NODE_ENV: 'development' })).toBe(true)
    expect(isSandboxed({ E2E_SANDBOX: 'true', NODE_ENV: 'production' })).toBe(false)
    expect(isSandboxed({ E2E_SANDBOX: 'true', VERCEL_ENV: 'production' })).toBe(false)
    expect(isSandboxed({ E2E_SANDBOX: '1', NODE_ENV: 'development' })).toBe(false)
    expect(isSandboxed({ NODE_ENV: 'development' })).toBe(false)
  })

  test('env.ts refuses to load with the flag on in production', async () => {
    const saved = { flag: process.env.E2E_SANDBOX, node: process.env.NODE_ENV }
    process.env.E2E_SANDBOX = 'true'
    process.env.NODE_ENV = 'production'
    try {
      // A fresh module instance so parse() runs again under these values.
      await expect(import(`~/server/env?boot=${Date.now()}`)).rejects.toThrow('not allowed in production')
    } finally {
      process.env.NODE_ENV = saved.node
      if (saved.flag === undefined) delete process.env.E2E_SANDBOX
      else process.env.E2E_SANDBOX = saved.flag
    }
  })
})

describe('sandbox log route', () => {
  test('404s unless sandboxed', async () => {
    const res = handleSandboxRequest({ NODE_ENV: 'development' })
    expect(res.status).toBe(404)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(handleSandboxRequest({ E2E_SANDBOX: 'true', NODE_ENV: 'production' }).status).toBe(404)
  })

  test('returns recorded calls when sandboxed', async () => {
    recordSandboxCall('resend', 'send', { to: 'a@x.test' })
    const res = handleSandboxRequest({ E2E_SANDBOX: 'true', NODE_ENV: 'development' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { calls: { seq: number; service: string; payload: { to: string } }[] }
    expect(body.calls).toHaveLength(1)
    expect(body.calls[0]).toMatchObject({ seq: 1, service: 'resend', payload: { to: 'a@x.test' } })
  })

  test('the log is capped', () => {
    for (let i = 0; i < SANDBOX_LOG_LIMIT + 5; i++) recordSandboxCall('mailerlite', 'upsert', { i })
    const log = readSandboxLog()
    expect(log).toHaveLength(SANDBOX_LOG_LIMIT)
    expect(log[0]!.payload).toEqual({ i: 5 })
  })
})

describe('sandboxed clients', () => {
  test('resend records instead of sending, even without an API key', async () => {
    const fetchFn = failFetch()
    const { sendEmail } = createResendClient(undefined, { sandboxed: on })
    const result = await sendEmail({ from: 'f@x.test', to: 't@x.test', subject: 'S', html: '<p>h</p>', text: 'h' })
    expect(result.id).toStartWith('sandbox_')
    expect(fetchFn).not.toHaveBeenCalled()
    expect(readSandboxLog()[0]).toMatchObject({ service: 'resend', action: 'send', payload: { to: 't@x.test', subject: 'S' } })
  })

  test('mailerlite records upserts and unsubscribes', async () => {
    const fetchFn = failFetch()
    const client = createMailerLiteClient('ml_key', { sandboxed: on })
    await client.upsertSubscriber({ email: 'a@x.test', groups: ['g'], resubscribe: true })
    await client.unsubscribeSubscriber('a@x.test')
    expect(fetchFn).not.toHaveBeenCalled()
    const [upsert, unsubscribe] = readSandboxLog()
    expect(upsert).toMatchObject({ service: 'mailerlite', action: 'upsert', payload: { email: 'a@x.test', groups: ['g'], resubscribe: true } })
    expect(unsubscribe).toMatchObject({ service: 'mailerlite', action: 'unsubscribe', payload: { email: 'a@x.test', status: 'unsubscribed' } })
  })

  test('not sandboxed: the real HTTP path runs and nothing is recorded', async () => {
    const fetchFn = mock(async () => Response.json({ id: 'em_1' }))
    globalThis.fetch = fetchFn as unknown as typeof fetch
    const { sendEmail } = createResendClient('re_key', { sandboxed: off })
    expect(await sendEmail({ from: 'f', to: 't', subject: 's', html: 'h', text: 't' })).toEqual({ id: 'em_1' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(readSandboxLog()).toHaveLength(0)
  })

  test('the default clients follow the env flag (off in unit tests)', async () => {
    const fetchFn = failFetch()
    const { sendEmail } = createResendClient(undefined)
    await expect(sendEmail({ from: 'f', to: 't', subject: 's', html: 'h', text: 't' })).rejects.toThrow('RESEND_API_KEY')
    expect(fetchFn).not.toHaveBeenCalled()
  })
})

describe('sandboxed captcha', () => {
  test('accepts only the documented test token without a network call', async () => {
    const fetchFn = mock(async () => Response.json({ success: false }))
    const verify = createCaptchaVerifier('secret', fetchFn as unknown as typeof fetch, { sandboxed: on })
    expect(await verify(HCAPTCHA_TEST_TOKEN)).toEqual({ ok: true })
    expect(fetchFn).not.toHaveBeenCalled()
    // Any other token still goes to siteverify (and is rejected here).
    expect(await verify('some-other-token')).toEqual({ ok: false, reason: 'rejected' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  test('not sandboxed: the test token is verified like any other', async () => {
    const fetchFn = mock(async () => Response.json({ success: false }))
    const verify = createCaptchaVerifier('secret', fetchFn as unknown as typeof fetch, { sandboxed: off })
    expect(await verify(HCAPTCHA_TEST_TOKEN)).toEqual({ ok: false, reason: 'rejected' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  test('the default verifier is not sandboxed in unit tests', async () => {
    process.env.E2E_SANDBOX = 'true'
    process.env.VERCEL_ENV = 'production'
    try {
      const fetchFn = mock(async () => Response.json({ success: false }))
      const verify = createCaptchaVerifier('secret', fetchFn as unknown as typeof fetch)
      expect(await verify(HCAPTCHA_TEST_TOKEN)).toEqual({ ok: false, reason: 'rejected' })
    } finally {
      delete process.env.VERCEL_ENV
    }
  })
})
