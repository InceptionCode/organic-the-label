import { describe, expect, mock, test } from 'bun:test'
import { CAPTCHA_FAILED_MESSAGE } from '~/server/captcha/verify'
import { buildFreeResourceEmail } from '~/server/email/free-resource-email'
import { handleFreeDownload, resolveFreeDownload } from '~/server/free-resources/download'
import { getFeaturedFreeResource, getFreeResourceBySlug } from '~/server/free-resources/get'
import { requestFreeResource, type FreeRequestDeps } from '~/server/free-resources/request'
import { readNewsletterState } from '~/server/preferences/newsletter-sync'
import { FREE_REQUEST_MESSAGES, FreeResourceRequestSchema, type FreeResourceRequest } from '~/server/free-resources/request-schema'
import { cutAtWord, FREE_DEFAULT_TITLE, FREE_DESCRIPTION, freeIndexTitle, freeSlugDescription } from '~/lib/free-seo'
import { fakeSupabase, type Call } from './fake-supabase'

describe('FreeResourceRequestSchema', () => {
  test('valid payload, blank first name dropped', () => {
    const r = FreeResourceRequestSchema.parse({ email: ' a@b.co ', firstName: ' ', resourceSlug: 'starter-kit', marketingOptIn: false, captchaToken: 't' })
    expect(r).toEqual({ email: 'a@b.co', firstName: undefined, resourceSlug: 'starter-kit', marketingOptIn: false, captchaToken: 't' })
  })
  test('invalid email carries the v1 client message', () => {
    const r = FreeResourceRequestSchema.safeParse({ email: 'nope', resourceSlug: 'starter-kit', marketingOptIn: false, captchaToken: 't' })
    expect(r.error?.issues[0]?.message).toBe(FREE_REQUEST_MESSAGES.email)
  })
  test('slug must match SLUG_PATTERN', () => {
    expect(FreeResourceRequestSchema.safeParse({ email: 'a@b.co', resourceSlug: '../x', marketingOptIn: false, captchaToken: 't' }).success).toBe(false)
  })
})

const input = (over: Partial<FreeResourceRequest> = {}): FreeResourceRequest => ({
  email: 'lead@example.test',
  firstName: 'Jay',
  resourceSlug: 'starter-kit',
  marketingOptIn: true,
  captchaToken: 'token',
  ...over,
})

const config = { siteUrl: 'https://organicsonics.com', from: 'downloads@x.test', replyTo: 'support@x.test', leadsGroupId: 'leads', starterKitGroupId: 'starter', newsletterGroupId: 'news' }

const STARTER_KIT = { id: 'r1', name: 'Starter Kit', download_url: 'https://files.example/kit.zip', mailerlite_group_id: null }

/** `existing` is the email_contacts row the no-consent path reads first (null: a new email). */
function requestDb(resource: unknown = STARTER_KIT, existing: unknown = null) {
  return fakeSupabase((call: Call) => {
    if (call.table === 'free_resources') return { data: resource, error: null }
    if (call.table === 'email_contacts' && call.op === 'select') return { data: existing, error: null }
    if (call.table === 'email_contacts' && call.op === 'insert') {
      return { data: { id: 'contact-1', mailerlite_subscriber_id: null, status: 'subscribed', marketing_opt_in: false }, error: null }
    }
    if (call.table === 'email_contacts' && call.op === 'upsert') {
      return { data: { id: 'contact-1', mailerlite_subscriber_id: null, status: 'subscribed', marketing_opt_in: true }, error: null }
    }
    if (call.table === 'resource_downloads' && call.op === 'insert') return { data: { id: 'dl-1' }, error: null }
    return { data: null, error: null }
  })
}

function deps(over: Partial<FreeRequestDeps> = {}, db = requestDb()) {
  const d = {
    client: db.client,
    verifyCaptcha: mock(async () => ({ ok: true }) as const),
    ensureVisitor: mock(async () => ({ id: 'v1' })),
    upsertSubscriber: mock(async () => ({ id: 'ml-1' })),
    sendEmail: mock(async () => ({ id: 'email-1' })),
    config,
    ...over,
  }
  return { d, calls: db.calls }
}

describe('requestFreeResource', () => {
  test('a missing captcha token writes nothing', async () => {
    const { d, calls } = deps()
    const r = await requestFreeResource(input({ captchaToken: '' }), d)
    expect(r).toEqual({ status: 400, result: { ok: false, error: FREE_REQUEST_MESSAGES.captchaMissing } })
    expect(calls).toHaveLength(0)
    expect(d.verifyCaptcha).not.toHaveBeenCalled()
    expect(d.ensureVisitor).not.toHaveBeenCalled()
  })

  test('a rejected captcha writes nothing, creates no visitor, sends nothing', async () => {
    const { d, calls } = deps({ verifyCaptcha: mock(async () => ({ ok: false, reason: 'rejected' }) as const) })
    const r = await requestFreeResource(input(), { ...d, remoteIp: '1.2.3.4' })
    expect(r).toEqual({ status: 403, result: { ok: false, error: CAPTCHA_FAILED_MESSAGE } })
    expect(calls).toHaveLength(0)
    expect(d.ensureVisitor).not.toHaveBeenCalled()
    expect(d.upsertSubscriber).not.toHaveBeenCalled()
    expect(d.sendEmail).not.toHaveBeenCalled()
  })

  test('captcha is verified with the remote IP', async () => {
    const { d } = deps()
    await requestFreeResource(input(), { ...d, remoteIp: '1.2.3.4' })
    expect(d.verifyCaptcha).toHaveBeenCalledWith('token', '1.2.3.4')
  })

  test('an unknown or inactive resource is a 404 with no contact written', async () => {
    const { d, calls } = deps({}, requestDb(null))
    const r = await requestFreeResource(input(), d)
    expect(r).toEqual({ status: 404, result: { ok: false, error: 'Resource not found.' } })
    expect(calls.map((c) => c.table)).toEqual(['free_resources'])
    expect(calls[0]!.filters).toContainEqual(['eq', 'active', true])
  })

  test('the full flow: contact, tags, groups, download row, tracked link, events', async () => {
    const { d, calls } = deps()
    const r = await requestFreeResource(input(), d)
    expect(r).toEqual({ status: 200, result: { ok: true } })
    expect(d.ensureVisitor).toHaveBeenCalledTimes(1)

    const contact = calls.find((c) => c.table === 'email_contacts' && c.op === 'upsert')!
    expect(contact.payload).toMatchObject({ email: 'lead@example.test', first_name: 'Jay', source: 'website', signup_source: 'free_resource', status: 'subscribed', marketing_opt_in: true })
    const tags = calls.find((c) => c.table === 'email_contact_tags')!.payload as { tag: string }[]
    expect(tags.map((t) => t.tag)).toEqual(['free_resource', 'downloaded_starter_kit', 'newsletter'])

    expect(d.upsertSubscriber).toHaveBeenCalledWith({
      email: 'lead@example.test',
      groups: ['leads', 'starter', 'news'],
      resubscribe: true,
      fields: { name: 'Jay', signup_source: 'free_resource', supabase_contact_id: 'contact-1', last_resource_downloaded: 'starter-kit' },
    })
    expect(calls.find((c) => c.table === 'resource_downloads' && c.op === 'insert')!.payload).toEqual({ contact_id: 'contact-1', resource_id: 'r1' })

    const sent = (d.sendEmail.mock.calls[0] as unknown as [{ to: string; from: string; html: string; replyTo: string }])[0]
    expect(sent).toMatchObject({ to: 'lead@example.test', from: 'downloads@x.test', replyTo: 'support@x.test' })
    expect(sent.html).toContain('https://organicsonics.com/free/download/dl-1')
    expect(sent.html).not.toContain('files.example')

    const stamp = calls.find((c) => c.table === 'resource_downloads' && c.op === 'update')!
    expect(stamp.payload).toHaveProperty('email_sent_at')
    expect(calls.find((c) => c.table === 'email_contacts' && c.op === 'update' && (c.payload as Record<string, unknown>).last_resource_downloaded)).toBeTruthy()
    const events = calls.filter((c) => c.table === 'email_contact_events').map((c) => (c.payload as { event_type: string }).event_type)
    expect(events).toEqual(['resource_requested', 'resource_email_sent'])
  })

  test('the resource group wins over the starter kit fallback; no newsletter without opt-in', async () => {
    const { d } = deps({}, requestDb({ id: 'r2', name: 'Kit 2', download_url: 'https://f/x', mailerlite_group_id: 'own-group' }))
    await requestFreeResource(input({ marketingOptIn: false, resourceSlug: 'kit-2' }), d)
    expect((d.upsertSubscriber.mock.calls[0] as unknown as [{ groups: string[] }])[0].groups).toEqual(['leads', 'own-group'])
  })

  test('without consent, a new email is a lead: not opted in, checkbox off, leads + resource groups only', async () => {
    const db = requestDb()
    const { d, calls } = deps({}, db)
    expect((await requestFreeResource(input({ marketingOptIn: false }), d)).result).toEqual({ ok: true })

    expect(calls.some((c) => c.table === 'email_contacts' && c.op === 'upsert')).toBe(false)
    const inserted = calls.find((c) => c.table === 'email_contacts' && c.op === 'insert')!
    expect(inserted.payload).toMatchObject({ email: 'lead@example.test', first_name: 'Jay', status: 'subscribed', marketing_opt_in: false, signup_source: 'free_resource' })
    const tags = calls.find((c) => c.table === 'email_contact_tags')!.payload as { tag: string }[]
    expect(tags.map((t) => t.tag)).toEqual(['free_resource', 'downloaded_starter_kit'])

    const sub = (d.upsertSubscriber.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(sub.groups).toEqual(['leads', 'starter'])
    expect(sub).not.toHaveProperty('resubscribe')

    // The account checkbox reads the row as written: subscribed (MailerLite lead) but not opted in.
    const row = { id: 'contact-1', status: (inserted.payload as { status: string }).status, marketing_opt_in: (inserted.payload as { marketing_opt_in: boolean }).marketing_opt_in }
    const state = await readNewsletterState({ email: 'lead@example.test', emailVerified: true }, fakeSupabase(() => ({ data: row, error: null })).client)
    expect(state.subscribed).toBe(false)
  })

  test('without consent, an existing opted-in contact is not downgraded', async () => {
    const existing = { id: 'contact-9', mailerlite_subscriber_id: 'ml-9', status: 'subscribed', marketing_opt_in: true }
    const { d, calls } = deps({}, requestDb(STARTER_KIT, existing))
    await requestFreeResource(input({ marketingOptIn: false }), d)

    expect(calls.some((c) => c.table === 'email_contacts' && (c.op === 'upsert' || c.op === 'insert'))).toBe(false)
    const neutral = calls.find((c) => c.table === 'email_contacts' && c.op === 'update' && 'signup_source' in (c.payload as object))!
    expect(neutral.filters).toEqual([['eq', 'id', 'contact-9']])
    for (const key of ['status', 'marketing_opt_in', 'unsubscribed_at']) expect(neutral.payload).not.toHaveProperty(key)
    for (const c of calls.filter((c) => c.table === 'email_contacts' && c.op === 'update')) {
      for (const key of ['status', 'marketing_opt_in', 'unsubscribed_at']) expect(c.payload).not.toHaveProperty(key)
    }
    expect((d.upsertSubscriber.mock.calls[0] as unknown as [{ groups: string[] }])[0].groups).toEqual(['leads', 'starter'])
    expect(calls.find((c) => c.table === 'resource_downloads' && c.op === 'insert')!.payload).toEqual({ contact_id: 'contact-9', resource_id: 'r1' })
  })

  test('without consent, an unsubscribed contact stays unsubscribed, is not sent to MailerLite, and still gets the resource', async () => {
    for (const status of ['unsubscribed', 'bounced', 'complained']) {
      const existing = { id: 'contact-u', mailerlite_subscriber_id: 'ml-u', status, marketing_opt_in: false }
      const { d, calls } = deps({}, requestDb(STARTER_KIT, existing))
      expect((await requestFreeResource(input({ marketingOptIn: false }), d)).result).toEqual({ ok: true })

      expect(calls.some((c) => c.table === 'email_contacts' && (c.op === 'upsert' || c.op === 'insert'))).toBe(false)
      for (const c of calls.filter((c) => c.table === 'email_contacts' && c.op === 'update')) {
        for (const key of ['status', 'marketing_opt_in', 'unsubscribed_at']) expect(c.payload).not.toHaveProperty(key)
      }
      expect(d.upsertSubscriber).not.toHaveBeenCalled()
      expect(calls.find((c) => c.table === 'resource_downloads' && c.op === 'insert')!.payload).toEqual({ contact_id: 'contact-u', resource_id: 'r1' })
      expect(d.sendEmail).toHaveBeenCalledTimes(1)
      expect(calls.some((c) => c.table === 'resource_downloads' && c.op === 'update')).toBe(true)
    }
  })

  test('with consent, an unsubscribed contact is resubscribed, opted in, and sent to the newsletter group', async () => {
    const existing = { id: 'contact-1', mailerlite_subscriber_id: 'ml-1', status: 'unsubscribed', marketing_opt_in: false }
    const { d, calls } = deps({}, requestDb(STARTER_KIT, existing))
    await requestFreeResource(input({ marketingOptIn: true }), d)

    const upsert = calls.find((c) => c.table === 'email_contacts' && c.op === 'upsert')!
    expect(upsert.payload).toMatchObject({ status: 'subscribed', marketing_opt_in: true, unsubscribed_at: null })
    expect(d.upsertSubscriber).toHaveBeenCalledTimes(1)
    const sub = (d.upsertSubscriber.mock.calls[0] as unknown as [{ groups: string[]; resubscribe?: boolean }])[0]
    expect(sub.groups).toEqual(['leads', 'starter', 'news'])
    expect(sub.resubscribe).toBe(true)
  })

  test('a MailerLite failure is logged and the email still goes out', async () => {
    const { d, calls } = deps({ upsertSubscriber: mock(async () => Promise.reject(new Error('ML 500'))) })
    const r = await requestFreeResource(input(), d)
    expect(r.result).toEqual({ ok: true })
    expect(d.sendEmail).toHaveBeenCalledTimes(1)
    expect(calls.some((c) => c.table === 'resource_downloads' && c.op === 'update')).toBe(true)
  })

  test('a failed email leaves email_sent_at empty and skips resource_email_sent', async () => {
    const { d, calls } = deps({ sendEmail: mock(async () => Promise.reject(new Error('Resend 500'))) })
    const r = await requestFreeResource(input(), d)
    expect(r.result).toEqual({ ok: true })
    expect(calls.some((c) => c.table === 'resource_downloads' && c.op === 'update')).toBe(false)
    const events = calls.filter((c) => c.table === 'email_contact_events').map((c) => (c.payload as { event_type: string }).event_type)
    expect(events).toEqual(['resource_requested'])
  })

  test('signed-in requesters are linked and get no visitor', async () => {
    const { d, calls } = deps()
    await requestFreeResource(input(), { ...d, userId: 'user-1' })
    expect(d.ensureVisitor).not.toHaveBeenCalled()
    expect(calls.find((c) => c.table === 'email_contacts')!.payload).toMatchObject({ supabase_user_id: 'user-1' })
  })
})

describe('free resource reads', () => {
  test('public columns only; bad includes become []', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: { slug: 'kit', name: 'Kit', description: null, includes: 'bad' }, error: null }))
    const r = await getFreeResourceBySlug('kit', { client: () => client })
    expect(r).toEqual({ slug: 'kit', name: 'Kit', description: null, includes: [] })
    expect(calls[0]!.filters).toContainEqual(['eq', 'active', true])
  })
  test('featured falls back to the starter kit, then null', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: null, error: null }))
    expect(await getFeaturedFreeResource({ client: () => client })).toBeNull()
    expect(calls[0]!.filters).toContainEqual(['eq', 'featured', true])
    expect(calls[1]!.filters).toContainEqual(['eq', 'slug', 'starter-kit'])
  })
})

describe('GET /free/download/$id', () => {
  const id = '0dd779f4-c55c-4916-bb88-6c41bf1cddf1'
  const row = (over: Record<string, unknown> = {}) => ({
    id,
    contact_id: 'contact-1',
    downloaded_at: null,
    free_resources: { slug: 'starter-kit', download_url: 'https://files.example/kit.zip', active: true },
    ...over,
  })
  const db = (data: unknown, stamped: unknown = [{ id }]) =>
    fakeSupabase((call: Call) => (call.op === 'update' ? { data: stamped, error: null } : call.table === 'resource_downloads' ? { data, error: null } : { data: null, error: null }))

  test('a malformed id is a 404 with no database call', async () => {
    const { client, calls } = db(row())
    const res = await handleFreeDownload('not-a-uuid', client)
    expect(res.status).toBe(404)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(calls).toHaveLength(0)
  })

  test('an unknown id or an inactive resource is a 404', async () => {
    expect((await resolveFreeDownload(id, db(null).client)).found).toBe(false)
    expect((await resolveFreeDownload(id, db(row({ free_resources: { slug: 's', download_url: 'u', active: false } })).client)).found).toBe(false)
  })

  test('first hit stamps downloaded_at conditionally, logs once, and 302s', async () => {
    const { client, calls } = db(row())
    const res = await handleFreeDownload(id, client)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://files.example/kit.zip')
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
    const update = calls.find((c) => c.op === 'update')!
    expect(update.filters).toContainEqual(['is', 'downloaded_at', null])
    const events = calls.filter((c) => c.table === 'email_contact_events')
    expect(events).toHaveLength(1)
    expect(events[0]!.payload).toMatchObject({ event_type: 'resource_downloaded', contact_id: 'contact-1' })
  })

  test('a racing second hit (no row stamped) does not log again', async () => {
    const { client, calls } = db(row(), [])
    await resolveFreeDownload(id, client)
    expect(calls.some((c) => c.table === 'email_contact_events')).toBe(false)
  })

  test('repeat hits redirect without updating or logging', async () => {
    const { client, calls } = db(row({ downloaded_at: '2026-10-01T00:00:00Z' }))
    const res = await handleFreeDownload(id, client)
    expect(res.status).toBe(302)
    expect(calls.map((c) => c.op)).toEqual(['select'])
  })
})

describe('free resource email and SEO', () => {
  test('the email escapes user input and links the tracked URL', () => {
    const email = buildFreeResourceEmail({ firstName: '<b>Jay</b>', resourceName: 'Kit', downloadUrl: 'https://organicsonics.com/free/download/1' })
    expect(email.subject).toBe('Your Kit is inside')
    expect(email.html).toContain('&lt;b&gt;Jay&lt;/b&gt;')
    expect(email.html).not.toContain('<b>Jay</b>')
    expect(email.text).toContain('https://organicsonics.com/free/download/1')
  })
  test('titles stay under 60 characters with the brand suffix', () => {
    expect(freeIndexTitle(null)).toBe(FREE_DEFAULT_TITLE)
    expect(freeIndexTitle('Organic Sonics Starter Kit')).toBe('Free Download: Organic Sonics Starter Kit')
    expect(`${freeIndexTitle('An Extremely Long Resource Name That Keeps Going On')} | Organic Sonics`.length).toBeLessThan(60)
  })
  test('descriptions', () => {
    expect(FREE_DESCRIPTION.length).toBeGreaterThanOrEqual(120)
    expect(FREE_DESCRIPTION.length).toBeLessThanOrEqual(160)
    expect(freeSlugDescription(null)).toBe(FREE_DESCRIPTION)
    expect(freeSlugDescription('A curated collection of drums, one-shots, and samples to get you started.')).toBe(
      'A curated collection of drums, one-shots, and samples to get you started. Free download from Organic Sonics, delivered to your inbox.',
    )
    expect(freeSlugDescription('word '.repeat(60)).length).toBeLessThanOrEqual(155)
    expect(cutAtWord('one two three', 8)).toBe('one two')
  })
})
