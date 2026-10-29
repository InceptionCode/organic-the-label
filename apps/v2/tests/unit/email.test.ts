import { afterEach, describe, expect, mock, test } from 'bun:test'
import { createMailerLiteClient, upsertSubscriber } from '~/server/email/mailerlite'
import { createResendClient, sendEmail } from '~/server/email/resend'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

function mockFetch(response: Response) {
  const fn = mock(async (_url: string | URL | Request, _init?: RequestInit) => response)
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

describe('resend', () => {
  test('posts the email with bearer auth', async () => {
    const fn = mockFetch(Response.json({ id: 'em_1' }))
    const { sendEmail } = createResendClient('re_key')
    const result = await sendEmail({ from: 'a@x.test', to: 'b@x.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi', replyTo: 'c@x.test' })

    expect(result).toEqual({ id: 'em_1' })
    const [url, init] = fn.mock.calls[0]!
    expect(url).toBe('https://api.resend.com/emails')
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer re_key')
    expect(JSON.parse(init?.body as string)).toEqual({
      from: 'a@x.test',
      to: 'b@x.test',
      subject: 'Hi',
      html: '<p>Hi</p>',
      text: 'Hi',
      reply_to: 'c@x.test',
    })
  })

  test('throws on a non-2xx response', async () => {
    mockFetch(new Response('bad', { status: 422 }))
    const { sendEmail } = createResendClient('re_key')
    await expect(sendEmail({ from: 'a', to: 'b', subject: 's', html: 'h', text: 't' })).rejects.toThrow('422')
  })

  test('throws naming RESEND_API_KEY when unset', async () => {
    const fn = mockFetch(Response.json({}))
    await expect(sendEmail({ from: 'a', to: 'b', subject: 's', html: 'h', text: 't' })).rejects.toThrow('RESEND_API_KEY')
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('mailerlite', () => {
  test('upserts a subscriber with bearer auth', async () => {
    const fn = mockFetch(Response.json({ data: { id: 'sub_1' } }))
    const { upsertSubscriber } = createMailerLiteClient('ml_key')
    const result = await upsertSubscriber({ email: 'a@x.test', groups: ['g1'], fields: { name: 'A' } })

    expect(result).toEqual({ id: 'sub_1' })
    const [url, init] = fn.mock.calls[0]!
    expect(url).toBe('https://connect.mailerlite.com/api/subscribers')
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer ml_key')
    expect(JSON.parse(init?.body as string)).toEqual({ email: 'a@x.test', groups: ['g1'], fields: { name: 'A' } })
  })

  test('sends resubscribe only when asked, so a returning subscriber is reactivated', async () => {
    const fn = mockFetch(Response.json({ data: { id: 'sub_1' } }))
    const { upsertSubscriber } = createMailerLiteClient('ml_key')
    await upsertSubscriber({ email: 'a@x.test', groups: ['g1'], resubscribe: true })
    expect(JSON.parse(fn.mock.calls[0]![1]?.body as string)).toEqual({ email: 'a@x.test', groups: ['g1'], resubscribe: true })
  })

  test('unsubscribes through the same upsert with status unsubscribed', async () => {
    const fn = mockFetch(Response.json({ data: { id: 'sub_1' } }))
    const { unsubscribeSubscriber } = createMailerLiteClient('ml_key')
    await unsubscribeSubscriber('a@x.test')
    const [url, init] = fn.mock.calls[0]!
    expect(url).toBe('https://connect.mailerlite.com/api/subscribers')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ email: 'a@x.test', status: 'unsubscribed' })
  })

  test('an unsubscribe error throws', async () => {
    mockFetch(new Response('bad', { status: 422 }))
    const { unsubscribeSubscriber } = createMailerLiteClient('ml_key')
    await expect(unsubscribeSubscriber('a@x.test')).rejects.toThrow('422')
  })

  test('throws naming MAILERLITE_API_KEY when unset', async () => {
    const fn = mockFetch(Response.json({}))
    await expect(upsertSubscriber({ email: 'a@x.test', groups: [] })).rejects.toThrow('MAILERLITE_API_KEY')
    expect(fn).not.toHaveBeenCalled()
  })
})
