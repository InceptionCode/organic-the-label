import { describe, expect, mock, spyOn, test } from 'bun:test'
import type { SubscribeResult } from '~/server/email/subscribe-schema'
import {
  readNewsletterState,
  syncNewsletterOptIn,
  withNewsletterState,
  type NewsletterSyncSession,
} from '~/server/preferences/newsletter-sync'
import { DEFAULT_PREFERENCES } from '~/server/preferences/options'
import { fakeSupabase, type Call } from './fake-supabase'

const verified: NewsletterSyncSession = { userId: 'u1', email: 'Kay@Example.com', emailVerified: true, displayName: 'Kay' }
const unverified: NewsletterSyncSession = { ...verified, emailVerified: false }

/** email_contacts answers with `contact` on the select; every write succeeds unless `failWrites`. */
function contacts(contact: { id: string; status: string; marketing_opt_in?: boolean } | null, failWrites = false) {
  return fakeSupabase((call: Call) => {
    if (call.op === 'select') return { data: contact, error: null }
    return { data: null, error: failWrites && call.table === 'email_contacts' ? { message: 'denied' } : null }
  })
}

const subscribedRow = { id: 'contact-1', status: 'subscribed', marketing_opt_in: true }
const unsubscribedRow = { id: 'contact-1', status: 'unsubscribed', marketing_opt_in: false }
const fakeSubscribe = (impl: () => Promise<SubscribeResult> = async () => ({ ok: true })) => mock(impl)
const fakeMailerLiteUnsubscribe = (impl: (email: string) => Promise<void> = async () => {}) => mock(impl)

function silenceErrors() {
  return spyOn(console, 'error').mockImplementation(() => {})
}

describe('readNewsletterState', () => {
  test('reads email_contacts by the verified email only, lowercased', async () => {
    const { client, calls } = contacts(subscribedRow)
    expect(await readNewsletterState(verified, client)).toEqual({ subscribed: true, contactId: 'contact-1' })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ table: 'email_contacts', op: 'select', filters: [['eq', 'email', 'kay@example.com']] })
  })

  test('an unverified or missing email reads as not subscribed without a query', async () => {
    const { client, calls } = contacts(subscribedRow)
    expect(await readNewsletterState(unverified, client)).toEqual({ subscribed: false, contactId: null })
    expect(await readNewsletterState({ email: null, emailVerified: true }, client)).toEqual({ subscribed: false, contactId: null })
    expect(calls).toHaveLength(0)
  })

  test('any status other than subscribed reads as false, even with marketing_opt_in left true', async () => {
    for (const status of ['unsubscribed', 'pending_confirmation', 'bounced', 'complained', 'deleted']) {
      const { client } = contacts({ id: 'c', status, marketing_opt_in: true })
      expect((await readNewsletterState(verified, client)).subscribed).toBe(false)
    }
  })

  test('subscribed + opted in is on; subscribed without newsletter consent (a free-resource lead) is off', async () => {
    expect((await readNewsletterState(verified, contacts({ id: 'c', status: 'subscribed', marketing_opt_in: true }).client)).subscribed).toBe(true)
    expect((await readNewsletterState(verified, contacts({ id: 'c', status: 'subscribed', marketing_opt_in: false }).client)).subscribed).toBe(false)
    expect((await readNewsletterState(verified, contacts({ id: 'c', status: 'unsubscribed', marketing_opt_in: false }).client)).subscribed).toBe(false)
  })
})

describe('withNewsletterState (the displayed checkbox)', () => {
  test('a subscribed row shows checked even when the mirror says false', async () => {
    const { client } = contacts(subscribedRow)
    const shown = await withNewsletterState({ ...DEFAULT_PREFERENCES, marketingOptIn: false }, verified, client)
    expect(shown.marketingOptIn).toBe(true)
  })

  test('an unsubscribed row shows unchecked even when the mirror says true', async () => {
    const { client } = contacts(unsubscribedRow)
    const shown = await withNewsletterState({ ...DEFAULT_PREFERENCES, marketingOptIn: true }, verified, client)
    expect(shown.marketingOptIn).toBe(false)
  })

  test('no row shows unchecked even when the mirror says true', async () => {
    const { client } = contacts(null)
    const shown = await withNewsletterState({ ...DEFAULT_PREFERENCES, marketingOptIn: true, favoriteGenres: ['trap'] }, verified, client)
    expect(shown).toEqual({ ...DEFAULT_PREFERENCES, marketingOptIn: false, favoriteGenres: ['trap'] })
  })

  test('an unverified email shows unchecked', async () => {
    const { client } = contacts(subscribedRow)
    expect((await withNewsletterState({ ...DEFAULT_PREFERENCES, marketingOptIn: true }, unverified, client)).marketingOptIn).toBe(false)
  })

  test('a read failure falls back to the mirror and logs without the email', async () => {
    const errorSpy = silenceErrors()
    try {
      const { client } = fakeSupabase(() => ({ data: null, error: { message: 'down' } }))
      expect((await withNewsletterState({ ...DEFAULT_PREFERENCES, marketingOptIn: true }, verified, client)).marketingOptIn).toBe(true)
      const logged = errorSpy.mock.calls[0]!.map(String).join(' ')
      expect(logged).toContain('[preferences.newsletter]')
      expect(logged.toLowerCase()).not.toContain('kay@example.com')
    } finally {
      errorSpy.mockRestore()
    }
  })
})

describe('syncNewsletterOptIn', () => {
  test('off to on subscribes once from the account source', async () => {
    const { client } = contacts(unsubscribedRow)
    const subscribe = fakeSubscribe()
    const result = await syncNewsletterOptIn({ wanted: true, fallback: false }, verified, { client, subscribe })
    expect(result).toEqual({ status: 'subscribed', subscribed: true })
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(subscribe.mock.calls[0]![0]).toEqual({
      email: 'Kay@Example.com',
      marketingOptIn: true,
      source: 'account',
      firstName: 'Kay',
      userId: 'u1',
    })
  })

  test('on to off unsubscribes in MailerLite, then marks the contact and logs the event', async () => {
    const { client } = contacts(subscribedRow)
    const admin = fakeSupabase()
    const unsubscribeSubscriber = fakeMailerLiteUnsubscribe()
    const subscribe = fakeSubscribe()
    const result = await syncNewsletterOptIn({ wanted: false, fallback: true }, verified, {
      client,
      subscribe,
      unsubscribeDeps: { client: admin.client, unsubscribeSubscriber },
    })
    expect(result).toEqual({ status: 'unsubscribed', subscribed: false })
    expect(subscribe).not.toHaveBeenCalled()
    expect(unsubscribeSubscriber).toHaveBeenCalledTimes(1)
    expect(unsubscribeSubscriber.mock.calls[0]![0]).toBe('Kay@Example.com')

    const [update, event] = admin.calls
    expect(update).toMatchObject({ table: 'email_contacts', op: 'update', filters: [['eq', 'id', 'contact-1']] })
    expect(update!.payload).toMatchObject({ status: 'unsubscribed', marketing_opt_in: false })
    expect(typeof (update!.payload as { unsubscribed_at: unknown }).unsubscribed_at).toBe('string')
    expect(event).toMatchObject({
      table: 'email_contact_events',
      op: 'insert',
      payload: { contact_id: 'contact-1', event_type: 'unsubscribed', provider: 'mailerlite', metadata: { source: 'account' } },
    })
  })

  test('on to off with MailerLite failing leaves the contact subscribed and reports failed', async () => {
    const errorSpy = silenceErrors()
    try {
      const { client } = contacts(subscribedRow)
      const admin = fakeSupabase()
      const unsubscribeSubscriber = fakeMailerLiteUnsubscribe(async () => {
        throw new Error('MailerLite responded with HTTP 500')
      })
      const result = await syncNewsletterOptIn({ wanted: false, fallback: true }, verified, {
        client,
        unsubscribeDeps: { client: admin.client, unsubscribeSubscriber },
      })
      expect(result).toEqual({ status: 'failed', subscribed: true })
      expect(admin.calls).toHaveLength(0)
      const logged = errorSpy.mock.calls[0]!.map(String).join(' ')
      expect(logged).toContain('[preferences.newsletter]')
      expect(logged.toLowerCase()).not.toContain('kay@example.com')
    } finally {
      errorSpy.mockRestore()
    }
  })

  test('on to off with the contact update failing after MailerLite reports failed (retry is safe)', async () => {
    const errorSpy = silenceErrors()
    try {
      const { client } = contacts(subscribedRow)
      const admin = contacts(subscribedRow, true)
      const result = await syncNewsletterOptIn({ wanted: false, fallback: true }, verified, {
        client,
        unsubscribeDeps: { client: admin.client, unsubscribeSubscriber: fakeMailerLiteUnsubscribe() },
      })
      expect(result).toEqual({ status: 'failed', subscribed: true })
      expect(admin.calls.some((c) => c.table === 'email_contact_events')).toBe(false)
    } finally {
      errorSpy.mockRestore()
    }
  })

  test('no change makes no MailerLite call, judged by email_contacts not the mirror', async () => {
    const subscribe = fakeSubscribe()
    const unsubscribe = mock(async () => {})
    const on = contacts(subscribedRow)
    expect(await syncNewsletterOptIn({ wanted: true, fallback: false }, verified, { client: on.client, subscribe, unsubscribe })).toEqual({
      status: 'unchanged',
      subscribed: true,
    })
    const off = contacts(null)
    expect(await syncNewsletterOptIn({ wanted: false, fallback: true }, verified, { client: off.client, subscribe, unsubscribe })).toEqual({
      status: 'unchanged',
      subscribed: false,
    })
    expect(subscribe).not.toHaveBeenCalled()
    expect(unsubscribe).not.toHaveBeenCalled()
  })

  test('an unverified email makes no read and no call', async () => {
    const { client, calls } = contacts(subscribedRow)
    const subscribe = fakeSubscribe()
    const unsubscribe = mock(async () => {})
    expect(await syncNewsletterOptIn({ wanted: true, fallback: false }, unverified, { client, subscribe, unsubscribe })).toEqual({
      status: 'unverified',
      subscribed: false,
    })
    expect(await syncNewsletterOptIn({ wanted: false, fallback: false }, unverified, { client, subscribe, unsubscribe })).toEqual({
      status: 'unchanged',
      subscribed: false,
    })
    expect(calls).toHaveLength(0)
    expect(subscribe).not.toHaveBeenCalled()
    expect(unsubscribe).not.toHaveBeenCalled()
  })

  test('a subscribe failure is reported as failed, logged without the email, never thrown', async () => {
    const errorSpy = silenceErrors()
    try {
      const { client } = contacts(null)
      const subscribe = fakeSubscribe(async () => {
        throw new Error('MailerLite responded with HTTP 500')
      })
      expect(await syncNewsletterOptIn({ wanted: true, fallback: false }, verified, { client, subscribe })).toEqual({
        status: 'failed',
        subscribed: false,
      })
      expect(errorSpy).toHaveBeenCalledTimes(1)
      const logged = errorSpy.mock.calls[0]!.map(String).join(' ')
      expect(logged).toContain('[preferences.newsletter]')
      expect(logged.toLowerCase()).not.toContain('kay@example.com')
    } finally {
      errorSpy.mockRestore()
    }
  })

  test('when email_contacts cannot be read nothing is called and the mirror stands', async () => {
    const errorSpy = silenceErrors()
    try {
      const { client } = fakeSupabase(() => ({ data: null, error: { message: 'down' } }))
      const subscribe = fakeSubscribe()
      const unsubscribe = mock(async () => {})
      expect(await syncNewsletterOptIn({ wanted: false, fallback: true }, verified, { client, subscribe, unsubscribe })).toEqual({
        status: 'failed',
        subscribed: true,
      })
      expect(await syncNewsletterOptIn({ wanted: true, fallback: true }, verified, { client, subscribe, unsubscribe })).toEqual({
        status: 'unchanged',
        subscribed: true,
      })
      expect(subscribe).not.toHaveBeenCalled()
      expect(unsubscribe).not.toHaveBeenCalled()
    } finally {
      errorSpy.mockRestore()
    }
  })
})
