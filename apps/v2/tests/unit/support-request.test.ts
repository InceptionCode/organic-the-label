import { describe, expect, mock, test } from 'bun:test'
import { CAPTCHA_FAILED_MESSAGE } from '~/server/captcha/verify'
import type { SendEmailInput } from '~/server/email/resend'
import { buildSupportConfirmationEmail, buildSupportNotificationEmail, escapeHtml } from '~/server/email/support-emails'
import { createSupportRequest, type SupportDeps } from '~/server/support/create-support-request'
import {
  CONTACT_FORM_CATEGORIES,
  CONTACT_MESSAGES,
  ContactFormSchema,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_MESSAGES,
  SupportPayloadSchema,
  WorkWithMeFormSchema,
  workWithMeSubject,
  type ParsedSupportPayload,
} from '~/server/support/schema'
import { fakeSupabase, type Call } from './fake-supabase'

const silent = { error: () => {}, warn: () => {} }

const payload = (over: Partial<ParsedSupportPayload> = {}): ParsedSupportPayload => ({
  name: 'Kay Dee',
  email: 'Kay@Example.com',
  category: 'general',
  subject: undefined,
  message: 'My download link expired yesterday.',
  marketingOptIn: false,
  captchaToken: 'tok',
  ...over,
})

function setup(respond: (call: Call) => { data: unknown; error: { message: string } | null } = () => ({ data: { id: 'req-1' }, error: null })) {
  const { client, calls } = fakeSupabase(respond)
  const sent: SendEmailInput[] = []
  const deps: SupportDeps = {
    client,
    verifyCaptcha: mock(async () => ({ ok: true }) as const),
    sendEmail: mock(async (input: SendEmailInput) => {
      sent.push(input)
      return { id: 'em' }
    }),
    upsertSubscriber: mock(async () => ({ id: 'ml-1' })),
    newsletterGroupId: 'g-news',
    emailFrom: 'Organic Sonics <support@x.test>',
    forwardTo: 'inbox@x.test',
    logger: silent,
  }
  return { deps, calls, sent }
}

describe('support schema', () => {
  test('contact categories exclude work_with_me and keep v1 labels in order', () => {
    expect(CONTACT_FORM_CATEGORIES.map((c) => SUPPORT_CATEGORY_LABELS[c])).toEqual([
      'Order issue',
      'Download issue',
      'Licensing question',
      'Collaboration',
      'General inquiry',
    ])
  })

  test('server schema: v1 messages, trims, drops a blank subject, requires a captcha token', () => {
    const ok = SupportPayloadSchema.parse({ name: ' Kay ', email: ' a@b.co ', message: '  long enough text  ', subject: ' ', captchaToken: 't' })
    expect(ok).toMatchObject({ name: 'Kay', email: 'a@b.co', category: 'general', subject: undefined, marketingOptIn: false })
    const bad = SupportPayloadSchema.safeParse({ name: '', email: 'x', message: 'short', captchaToken: '' })
    expect(bad.error?.issues.map((i) => i.message)).toEqual([
      SUPPORT_MESSAGES.name,
      SUPPORT_MESSAGES.email,
      SUPPORT_MESSAGES.message,
      SUPPORT_MESSAGES.captcha,
    ])
  })

  test('contact client messages are v1 verbatim and in order', () => {
    const r = ContactFormSchema.safeParse({ name: ' ', email: 'nope', message: 'hi' })
    expect(r.error?.issues.map((i) => i.message)).toEqual([CONTACT_MESSAGES.name, CONTACT_MESSAGES.email, CONTACT_MESSAGES.message])
    expect(CONTACT_MESSAGES).toEqual({
      name: 'Please enter your name.',
      email: 'Please enter a valid email address.',
      message: 'Message must be at least 10 characters.',
    })
  })

  test('work with me: three v1 messages, project types, subject', () => {
    const r = WorkWithMeFormSchema.safeParse({ name: '', email: 'x', projectType: 'Production', message: 'short' })
    expect(r.error?.issues.map((i) => i.message)).toEqual(['Name is required', 'Invalid email address', 'Message must be at least 10 characters'])
    expect(WorkWithMeFormSchema.safeParse({ name: 'a', email: 'a@b.co', projectType: 'Polka', message: 'long enough!' }).success).toBe(false)
    expect(workWithMeSubject('Mixing & Mastering')).toBe('Work With Me: Mixing & Mastering')
  })
})

describe('support emails', () => {
  test('confirmation goes to the sender with the reference id', () => {
    const e = buildSupportConfirmationEmail({ to: 'a@b.co', name: 'Kay', supportRequestId: 'req-1' }, 'from@x.test')
    expect(e).toMatchObject({ from: 'from@x.test', to: 'a@b.co', subject: 'We got your message' })
    expect(e.html).toContain('Reference ID: req-1')
    expect(e.text).toContain('Hey Kay,')
  })

  test('notification goes to the forward address, replies to the sender, and escapes user input', () => {
    const e = buildSupportNotificationEmail(
      { supportRequestId: 'req-1', name: '<script>x</script>', email: 'a@b.co', category: 'order_issue', subject: 'Order #12 & co', message: 'line1\n<b>hi</b>' },
      { from: 'from@x.test', forwardTo: 'inbox@x.test' },
    )
    expect(e).toMatchObject({ from: 'from@x.test', to: 'inbox@x.test', replyTo: 'a@b.co', subject: 'New Organic Sonics support request: order issue' })
    expect(e.html).not.toContain('<script>')
    expect(e.html).toContain('&lt;script&gt;x&lt;/script&gt;')
    expect(e.html).toContain('Order #12 &amp; co')
    expect(e.html).toContain('&lt;b&gt;hi&lt;/b&gt;')
    expect(e.text).toContain('Subject: Order #12 & co')
  })

  test('the subject row is omitted when there is no subject', () => {
    const e = buildSupportNotificationEmail(
      { supportRequestId: 'r', name: 'n', email: 'e@x.test', category: 'general', message: 'm' },
      { from: 'f', forwardTo: 't' },
    )
    expect(e.html).not.toContain('>Subject<')
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;')
  })
})

describe('createSupportRequest', () => {
  test('captcha failure rejects with 400 before any write or email', async () => {
    const { deps, calls, sent } = setup()
    deps.verifyCaptcha = mock(async () => ({ ok: false, reason: 'rejected' }) as const)
    const r = await createSupportRequest(payload(), { clientIp: '1.2.3.4' }, deps)
    expect(r).toEqual({ ok: false, status: 400, error: CAPTCHA_FAILED_MESSAGE })
    expect(deps.verifyCaptcha).toHaveBeenCalledWith('tok', '1.2.3.4')
    expect(calls).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  test('a missing secret (not-configured) also fails closed', async () => {
    const { deps, calls } = setup()
    deps.verifyCaptcha = mock(async () => ({ ok: false, reason: 'not-configured' }) as const)
    expect((await createSupportRequest(payload(), {}, deps)).ok).toBe(false)
    expect(calls).toHaveLength(0)
  })

  test('inserts one open row with a lowercased email and sends both emails', async () => {
    const { deps, calls, sent } = setup()
    const r = await createSupportRequest(payload({ subject: 'Order 12' }), {}, deps)
    expect(r).toEqual({ ok: true, id: 'req-1' })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      table: 'support_requests',
      op: 'insert',
      payload: { name: 'Kay Dee', email: 'kay@example.com', category: 'general', subject: 'Order 12', status: 'open' },
    })
    expect(sent.map((e) => [e.to, e.subject])).toEqual([
      ['Kay@Example.com', 'We got your message'],
      ['inbox@x.test', 'New Organic Sonics support request: general'],
    ])
    expect(deps.upsertSubscriber).not.toHaveBeenCalled()
  })

  test('work_with_me inquiries keep the v1 category and subject', async () => {
    const { deps, calls, sent } = setup()
    await createSupportRequest(payload({ category: 'work_with_me', subject: workWithMeSubject('Production') }), {}, deps)
    expect(calls[0]?.payload).toMatchObject({ category: 'work_with_me', subject: 'Work With Me: Production' })
    expect(sent[1]?.subject).toBe('New Organic Sonics support request: work with me')
  })

  test('a failed insert is the only fatal error (500)', async () => {
    const { deps, sent } = setup(() => ({ data: null, error: { message: 'boom' } }))
    expect(await createSupportRequest(payload(), {}, deps)).toEqual({ ok: false, status: 500, error: 'Failed to save request.' })
    expect(sent).toHaveLength(0)
  })

  test('email failures are logged and the request still succeeds', async () => {
    const { deps } = setup()
    const errors: unknown[] = []
    deps.logger = { warn: () => {}, error: (...args: unknown[]) => errors.push(args) }
    deps.sendEmail = mock(async () => Promise.reject(new Error('Resend 500')))
    expect(await createSupportRequest(payload(), {}, deps)).toEqual({ ok: true, id: 'req-1' })
    expect(errors).toHaveLength(2)
  })

  test('missing email env skips sending without failing', async () => {
    const { deps, sent } = setup()
    deps.emailFrom = undefined
    expect((await createSupportRequest(payload(), {}, deps)).ok).toBe(true)
    expect(sent).toHaveLength(0)
  })

  test('opt-in syncs the contact (support_form, newsletter tag), MailerLite, and logs the event', async () => {
    const { deps, calls } = setup((call) =>
      call.table === 'support_requests' ? { data: { id: 'req-1' }, error: null } : { data: { id: 'contact-1', mailerlite_subscriber_id: null }, error: null },
    )
    expect(await createSupportRequest(payload({ marketingOptIn: true }), {}, deps)).toEqual({ ok: true, id: 'req-1' })
    expect(calls[1]).toMatchObject({ table: 'email_contacts', op: 'upsert', payload: { email: 'kay@example.com', first_name: 'Kay', signup_source: 'support_form', status: 'subscribed', marketing_opt_in: true } })
    expect(calls[2]).toMatchObject({ table: 'email_contact_tags', payload: [{ contact_id: 'contact-1', tag: 'newsletter' }] })
    expect(deps.upsertSubscriber).toHaveBeenCalledWith({
      email: 'Kay@Example.com',
      groups: ['g-news'],
      resubscribe: true,
      fields: { name: 'Kay', signup_source: 'support_form', supabase_contact_id: 'contact-1' },
    })
    const event = calls.find((c) => c.table === 'email_contact_events')
    expect(event?.payload).toMatchObject({ event_type: 'support_request_created', metadata: { support_request_id: 'req-1', category: 'general' } })
  })

  test('a MailerLite failure on opt-in is logged and never fails the request', async () => {
    const { deps } = setup((call) =>
      call.table === 'support_requests' ? { data: { id: 'req-1' }, error: null } : { data: { id: 'contact-1', mailerlite_subscriber_id: null }, error: null },
    )
    deps.upsertSubscriber = mock(async () => Promise.reject(new Error('MailerLite 500')))
    expect(await createSupportRequest(payload({ marketingOptIn: true }), {}, deps)).toEqual({ ok: true, id: 'req-1' })
  })

  test('a missing newsletter group on opt-in is non-fatal', async () => {
    const { deps } = setup()
    deps.newsletterGroupId = undefined
    expect(await createSupportRequest(payload({ marketingOptIn: true }), {}, deps)).toEqual({ ok: true, id: 'req-1' })
    expect(deps.upsertSubscriber).not.toHaveBeenCalled()
  })
})
