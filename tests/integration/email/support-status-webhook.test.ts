import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

const { sendStatusSpy, mockFrom } = vi.hoisted(() => {
  const sendStatusSpy = vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null })

  const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'contact-uuid' }, error: null })
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn((table: string) => {
    if (table === 'email_contact_events') return { insert: mockInsert }
    return { select: mockSelect }
  })

  return { sendStatusSpy, mockFrom, mockInsert, mockSingle }
})

vi.mock('@/lib/email/resend', () => ({
  sendSupportStatusEmail: sendStatusSpy,
}))

vi.mock('@/utils/supabase/base', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}))

import { POST } from '@/app/api/webhooks/support-status/route'

// ─── helpers ──────────────────────────────────────────────────────────────────

const SECRET = 'test-webhook-secret'

function makeRequest(body: object, secret: string | null = SECRET) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== null) headers['x-webhook-secret'] = secret
  return new Request('http://localhost/api/webhooks/support-status', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function makePayload(
  newStatus: string,
  oldStatus: string,
  overrides: Partial<{ name: string; email: string; resolution_note: string | null }> = {}
) {
  return {
    type: 'UPDATE',
    table: 'support_requests',
    schema: 'public',
    record: {
      id: 'req-abc-123',
      name: overrides.name ?? 'Darrell',
      email: overrides.email ?? 'user@example.com',
      status: newStatus,
      resolution_note: overrides.resolution_note ?? null,
    },
    old_record: {
      id: 'req-abc-123',
      name: overrides.name ?? 'Darrell',
      email: overrides.email ?? 'user@example.com',
      status: oldStatus,
      resolution_note: null,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SUPABASE_SUPPORT_WEBHOOK_SECRET = SECRET
  process.env.EMAIL_FROM_SUPPORT = 'support@organicsonics.com'
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('authentication', () => {
  it('returns 401 when secret header is missing', async () => {
    const res = await POST(makeRequest(makePayload('closed', 'open'), null))
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret header is wrong', async () => {
    const res = await POST(makeRequest(makePayload('closed', 'open'), 'wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('allows through when secret matches', async () => {
    const res = await POST(makeRequest(makePayload('closed', 'open')))
    expect(res.status).toBe(200)
  })

  it('allows through when no secret env var is configured (dev fallback)', async () => {
    delete process.env.SUPABASE_SUPPORT_WEBHOOK_SECRET
    const res = await POST(makeRequest(makePayload('closed', 'open'), null))
    expect(res.status).toBe(200)
  })
})

// ─── Status-change guards ─────────────────────────────────────────────────────

describe('status-change guards', () => {
  it('returns skipped when status did not change', async () => {
    const res = await POST(makeRequest(makePayload('open', 'open')))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.skipped).toBe('status_unchanged')
    expect(sendStatusSpy).not.toHaveBeenCalled()
  })

  it('returns skipped for "open" status', async () => {
    const res = await POST(makeRequest(makePayload('open', 'pending')))
    const json = await res.json()
    expect(json.skipped).toContain('not_emailable')
    expect(sendStatusSpy).not.toHaveBeenCalled()
  })

  it('returns skipped for "spam" status — never email spam senders', async () => {
    const res = await POST(makeRequest(makePayload('spam', 'open')))
    const json = await res.json()
    expect(json.skipped).toContain('not_emailable')
    expect(sendStatusSpy).not.toHaveBeenCalled()
  })
})

// ─── Emailable statuses ───────────────────────────────────────────────────────

describe('emailable statuses', () => {
  it('calls sendSupportStatusEmail when status flips to "pending"', async () => {
    const res = await POST(makeRequest(makePayload('pending', 'open')))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(sendStatusSpy).toHaveBeenCalledOnce()
    expect(sendStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', to: 'user@example.com' })
    )
  })

  it('calls sendSupportStatusEmail when status flips to "closed"', async () => {
    await POST(makeRequest(makePayload('closed', 'open')))
    expect(sendStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'closed' })
    )
  })

  it('passes resolutionNote through to the email function', async () => {
    await POST(
      makeRequest(makePayload('closed', 'open', { resolution_note: 'Order fully refunded.' }))
    )
    expect(sendStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ resolutionNote: 'Order fully refunded.' })
    )
  })

  it('falls back to "there" when name is null', async () => {
    const payload = {
      type: 'UPDATE',
      table: 'support_requests',
      schema: 'public',
      record: { id: 'req-null-name', name: null, email: 'user@example.com', status: 'closed', resolution_note: null },
      old_record: { id: 'req-null-name', name: null, email: 'user@example.com', status: 'open', resolution_note: null },
    }
    await POST(makeRequest(payload))
    expect(sendStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'there' })
    )
  })

  it('returns the emailed address and new status in the response', async () => {
    const res = await POST(makeRequest(makePayload('closed', 'pending')))
    const json = await res.json()
    expect(json.emailed).toBe('user@example.com')
    expect(json.status).toBe('closed')
  })
})

// ─── Invalid payloads ─────────────────────────────────────────────────────────

describe('invalid payloads', () => {
  it('returns 400 on malformed JSON', async () => {
    const req = new Request('http://localhost/api/webhooks/support-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': SECRET },
      body: '{not valid json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
