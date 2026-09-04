import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Resend mock ─────────────────────────────────────────────────────────────
// `resend.ts` calls `new Resend(...)` at module init time.  vi.mock factories
// are hoisted above const declarations, so we use vi.hoisted() to ensure
// sendSpy exists by the time the factory runs.

const { sendSpy } = vi.hoisted(() => ({
  sendSpy: vi.fn().mockResolvedValue({ data: { id: 'email-id-123' }, error: null }),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendSpy },
  })),
}))

import {
  sendFreeResourceEmail,
  sendSupportConfirmationEmail,
  sendSupportStatusEmail,
  sendSupportNotificationEmail,
} from '@/lib/email/resend'

beforeEach(() => {
  process.env.EMAIL_FROM_DOWNLOADS = 'Organic Sonics Downloads <downloads@organicsonics.com>'
  process.env.EMAIL_FROM_SUPPORT = 'Organic Sonics Support <support@organicsonics.com>'
  process.env.SUPPORT_FORWARD_EMAIL = 'admin@example.com'
  sendSpy.mockClear()
})

// ─── sendFreeResourceEmail ────────────────────────────────────────────────────

describe('sendFreeResourceEmail', () => {
  it('calls resend.emails.send with correct to, subject, and from', async () => {
    await sendFreeResourceEmail({
      to: 'user@example.com',
      resourceName: 'Starter Kit',
      downloadUrl: 'https://example.com/download',
    })

    expect(sendSpy).toHaveBeenCalledOnce()
    const args = sendSpy.mock.calls[0][0]
    expect(args.to).toBe('user@example.com')
    expect(args.subject).toContain('Starter Kit')
    expect(args.from).toBe(process.env.EMAIL_FROM_DOWNLOADS)
  })

  it('personalises the email body when firstName is provided', async () => {
    await sendFreeResourceEmail({
      to: 'user@example.com',
      firstName: 'Jay',
      resourceName: 'Starter Kit',
      downloadUrl: 'https://example.com/download',
    })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('Jay')
  })

  it('omits name in greeting when firstName is absent', async () => {
    await sendFreeResourceEmail({
      to: 'user@example.com',
      resourceName: 'Starter Kit',
      downloadUrl: 'https://example.com/download',
    })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain("What's good")
    expect(args.html).not.toContain(', Jay')
  })

  it('embeds the download URL in the email body', async () => {
    const url = 'https://drive.google.com/file/test'
    await sendFreeResourceEmail({
      to: 'user@example.com',
      resourceName: 'Starter Kit',
      downloadUrl: url,
    })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain(url)
  })
})

// ─── sendSupportConfirmationEmail ─────────────────────────────────────────────

describe('sendSupportConfirmationEmail', () => {
  it('sends to the user email with correct subject', async () => {
    await sendSupportConfirmationEmail({
      to: 'user@example.com',
      name: 'Darrell',
      supportRequestId: 'req-abc-123',
    })

    expect(sendSpy).toHaveBeenCalledOnce()
    const args = sendSpy.mock.calls[0][0]
    expect(args.to).toBe('user@example.com')
    expect(args.subject).toBe('We got your message')
    expect(args.from).toBe(process.env.EMAIL_FROM_SUPPORT)
  })

  it('includes the user name and reference ID in the body', async () => {
    await sendSupportConfirmationEmail({
      to: 'user@example.com',
      name: 'Darrell',
      supportRequestId: 'req-abc-123',
    })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('Darrell')
    expect(args.html).toContain('req-abc-123')
  })
})

// ─── sendSupportNotificationEmail ────────────────────────────────────────────

describe('sendSupportNotificationEmail', () => {
  const base = {
    supportRequestId: 'req-xyz-456',
    name: 'Darrell Washington',
    email: 'darrell@example.com',
    category: 'download_issue',
    message: 'My download link is not working.',
  }

  it('sends to SUPPORT_FORWARD_EMAIL', async () => {
    await sendSupportNotificationEmail(base)

    expect(sendSpy).toHaveBeenCalledOnce()
    const args = sendSpy.mock.calls[0][0]
    expect(args.to).toBe('admin@example.com')
  })

  it('includes category in the subject with underscores replaced by spaces', async () => {
    await sendSupportNotificationEmail(base)

    const args = sendSpy.mock.calls[0][0]
    expect(args.subject).toContain('download issue')
  })

  it('includes name, email, and message in the body', async () => {
    await sendSupportNotificationEmail(base)

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('Darrell Washington')
    expect(args.html).toContain('darrell@example.com')
    expect(args.html).toContain('My download link is not working.')
  })

  it('renders the subject row when subject is provided', async () => {
    await sendSupportNotificationEmail({ ...base, subject: 'Order #1234' })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('Order #1234')
  })

  it('omits the subject row when subject is absent', async () => {
    await sendSupportNotificationEmail(base)

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).not.toContain('Order #')
  })
})

// ─── sendSupportStatusEmail ───────────────────────────────────────────────────

describe('sendSupportStatusEmail', () => {
  const base = {
    to: 'user@example.com',
    name: 'Darrell',
    supportRequestId: 'req-status-001',
  }

  it('sends "pending" email with correct subject', async () => {
    await sendSupportStatusEmail({ ...base, status: 'pending' })

    const args = sendSpy.mock.calls[0][0]
    expect(args.to).toBe('user@example.com')
    expect(args.subject).toBe('We need a bit more information')
    expect(args.from).toBe(process.env.EMAIL_FROM_SUPPORT)
  })

  it('sends "closed" email with correct subject', async () => {
    await sendSupportStatusEmail({ ...base, status: 'closed' })

    const args = sendSpy.mock.calls[0][0]
    expect(args.subject).toBe('Your request has been resolved')
  })

  it('includes resolutionNote in the body when provided', async () => {
    await sendSupportStatusEmail({
      ...base,
      status: 'closed',
      resolutionNote: 'We refunded your order.',
    })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('We refunded your order.')
  })

  it('falls back to default copy when resolutionNote is absent', async () => {
    await sendSupportStatusEmail({ ...base, status: 'closed' })

    const args = sendSpy.mock.calls[0][0]
    // No note → show the fallback copy, not empty
    expect(args.html).toContain('further questions')
  })

  it('falls back to default copy when resolutionNote is null', async () => {
    await sendSupportStatusEmail({ ...base, status: 'pending', resolutionNote: null })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('reply to this email')
  })

  it('includes the reference ID in the body', async () => {
    await sendSupportStatusEmail({ ...base, status: 'closed' })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('req-status-001')
  })

  it('personalises the email with the user name', async () => {
    await sendSupportStatusEmail({ ...base, status: 'pending' })

    const args = sendSpy.mock.calls[0][0]
    expect(args.html).toContain('Darrell')
  })
})
