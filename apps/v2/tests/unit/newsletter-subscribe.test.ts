import { describe, expect, mock, test } from 'bun:test'
import { subscribeToNewsletter } from '~/server/email/subscribe'
import {
  isHoneypotTripped,
  NEWSLETTER_PAGE_MESSAGES,
  SUBSCRIBE_MESSAGES,
  SubscribePayloadSchema,
} from '~/server/email/subscribe-schema'
import { fakeSupabase } from './fake-supabase'

describe('SubscribePayloadSchema', () => {
  test('valid payload, blank first name dropped', () => {
    const r = SubscribePayloadSchema.parse({ email: ' a@b.co ', firstName: '  ', source: 'footer', marketingOptIn: true })
    expect(r).toEqual({ email: 'a@b.co', firstName: undefined, source: 'footer', marketingOptIn: true })
  })
  test('invalid email carries the v1 client message', () => {
    const r = SubscribePayloadSchema.safeParse({ email: 'nope', marketingOptIn: true })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe(SUBSCRIBE_MESSAGES.email)
  })
  test('unknown source is rejected; explore is allowed', () => {
    expect(SubscribePayloadSchema.safeParse({ email: 'a@b.co', source: 'x', marketingOptIn: true }).success).toBe(false)
    expect(SubscribePayloadSchema.safeParse({ email: 'a@b.co', source: 'explore', marketingOptIn: true }).success).toBe(true)
  })
})

describe('subscribeToNewsletter', () => {
  const respond = () => ({ data: { id: 'contact-1', mailerlite_subscriber_id: null }, error: null })

  test('requires consent and writes nothing without it', async () => {
    const { client, calls } = fakeSupabase(respond)
    const upsertSubscriber = mock(async () => ({ id: 'ml-1' }))
    const r = await subscribeToNewsletter(
      { email: 'a@b.co', marketingOptIn: false, firstName: undefined, source: 'footer' },
      { client, upsertSubscriber, newsletterGroupId: 'g1' },
    )
    expect(r).toEqual({ ok: false, error: SUBSCRIBE_MESSAGES.consentRequired })
    expect(calls).toHaveLength(0)
    expect(upsertSubscriber).not.toHaveBeenCalled()
  })

  test('upserts the contact, tags it, syncs MailerLite, and logs two events', async () => {
    const { client, calls } = fakeSupabase(respond)
    const upsertSubscriber = mock(async () => ({ id: 'ml-1' }))
    const r = await subscribeToNewsletter(
      { email: 'A@B.co', firstName: 'Kay', source: 'footer', marketingOptIn: true, userId: 'u1' },
      { client, upsertSubscriber, newsletterGroupId: 'g1' },
    )
    expect(r).toEqual({ ok: true })
    const contact = calls[0]!
    expect(contact.table).toBe('email_contacts')
    expect(contact.op).toBe('upsert')
    expect(contact.payload).toMatchObject({
      email: 'a@b.co',
      first_name: 'Kay',
      status: 'subscribed',
      marketing_opt_in: true,
      signup_source: 'footer',
      supabase_user_id: 'u1',
    })
    expect(calls[1]).toMatchObject({ table: 'email_contact_tags', payload: [{ contact_id: 'contact-1', tag: 'newsletter' }] })
    expect(upsertSubscriber).toHaveBeenCalledWith({
      email: 'A@B.co',
      groups: ['g1'],
      fields: { name: 'Kay', signup_source: 'footer', supabase_contact_id: 'contact-1' },
    })
    expect(calls[2]).toMatchObject({ table: 'email_contacts', op: 'update', payload: { mailerlite_subscriber_id: 'ml-1' } })
    const events = calls.filter((c) => c.table === 'email_contact_events').map((c) => (c.payload as { event_type: string }).event_type)
    expect(events).toEqual(['subscribed', 'mailerlite_synced'])
  })

  test('a MailerLite failure throws (the adapter returns the generic error)', async () => {
    const { client } = fakeSupabase(respond)
    const upsertSubscriber = mock(async () => Promise.reject(new Error('HTTP 500')))
    await expect(
      subscribeToNewsletter({ email: 'a@b.co', marketingOptIn: true, firstName: undefined, source: 'footer' }, { client, upsertSubscriber, newsletterGroupId: 'g1' }),
    ).rejects.toThrow('HTTP 500')
  })

  test('a missing newsletter group id throws before any write', async () => {
    const { client, calls } = fakeSupabase(respond)
    await expect(
      subscribeToNewsletter(
        { email: 'a@b.co', marketingOptIn: true, firstName: undefined, source: 'footer' },
        { client, upsertSubscriber: async () => ({ id: 'x' }), newsletterGroupId: undefined },
      ),
    ).rejects.toThrow('MAILERLITE_GROUP_NEWSLETTER_ID')
    expect(calls).toHaveLength(0)
  })
})

describe('/newsletter page (05.11)', () => {
  const respond = () => ({ data: { id: 'contact-1', mailerlite_subscriber_id: null }, error: null })

  test('page messages are the v1 copy', () => {
    expect(NEWSLETTER_PAGE_MESSAGES).toEqual({
      email: 'Enter a valid email address.',
      consent: 'Check the consent box to continue.',
      generic: 'Something went wrong. Try again.',
    })
  })

  test('newsletter_page source flows into signup_source, the event metadata, and MailerLite', async () => {
    const { client, calls } = fakeSupabase(respond)
    const upsertSubscriber = mock(async () => ({ id: 'ml-1' }))
    const parsed = SubscribePayloadSchema.parse({ email: 'a@b.co', source: 'newsletter_page', marketingOptIn: true })
    await subscribeToNewsletter(parsed, { client, upsertSubscriber, newsletterGroupId: 'g1' })
    expect(calls[0]?.payload).toMatchObject({ signup_source: 'newsletter_page', source: 'newsletter_page' })
    expect(upsertSubscriber).toHaveBeenCalledWith(expect.objectContaining({ fields: expect.objectContaining({ signup_source: 'newsletter_page' }) }))
    const subscribed = calls.find((c) => (c.payload as { event_type?: string }).event_type === 'subscribed')
    expect(subscribed?.payload).toMatchObject({ metadata: { source: 'newsletter_page', signup_source: 'newsletter_page' } })
  })

  test('honeypot: empty passes, a filled value is detected', () => {
    expect(isHoneypotTripped({})).toBe(false)
    expect(isHoneypotTripped({ company: '  ' })).toBe(false)
    expect(isHoneypotTripped({ company: 'Acme' })).toBe(true)
    expect(SubscribePayloadSchema.safeParse({ email: 'a@b.co', marketingOptIn: true, company: 'x'.repeat(201) }).success).toBe(false)
  })
})
