import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  upsertMailerLiteSubscriber,
  assignSubscriberToGroup,
  removeSubscriberFromGroup,
} from '@/lib/email/mailerlite'

// ─── fetch mock helpers ───────────────────────────────────────────────────────

function mockFetchOk(body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response)
}

function mockFetchError(status: number, message: string) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(message),
  } as unknown as Response)
}

beforeEach(() => {
  vi.restoreAllMocks()
  process.env.MAILERLITE_API_KEY = 'test-ml-api-key'
})

// ─── upsertMailerLiteSubscriber ───────────────────────────────────────────────

describe('upsertMailerLiteSubscriber', () => {
  it('calls the MailerLite subscribers endpoint with email', async () => {
    mockFetchOk({ data: { id: 'ml-123' } })

    const result = await upsertMailerLiteSubscriber({ email: 'user@example.com' })

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/subscribers')
    expect(JSON.parse(opts.body)).toMatchObject({ email: 'user@example.com' })
    expect(result).toEqual({ id: 'ml-123' })
  })

  it('includes name in fields when firstName is provided', async () => {
    mockFetchOk({ data: { id: 'ml-456' } })

    await upsertMailerLiteSubscriber({ email: 'user@example.com', firstName: 'Jay' })

    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(opts.body)).toMatchObject({ fields: { name: 'Jay' } })
  })

  it('includes groupIds as "groups" in the request body', async () => {
    mockFetchOk({ data: { id: 'ml-789' } })

    await upsertMailerLiteSubscriber({
      email: 'user@example.com',
      groupIds: ['group-1', 'group-2'],
    })

    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(opts.body)).toMatchObject({ groups: ['group-1', 'group-2'] })
  })

  it('returns null when API returns no data.data', async () => {
    mockFetchOk({ data: null })
    const result = await upsertMailerLiteSubscriber({ email: 'user@example.com' })
    expect(result).toBeNull()
  })

  it('throws on a non-OK API response', async () => {
    mockFetchError(422, 'Unprocessable entity')
    await expect(upsertMailerLiteSubscriber({ email: 'bad' })).rejects.toThrow(
      'MailerLite API error: 422'
    )
  })

  it('sends the Authorization header with Bearer token', async () => {
    mockFetchOk({ data: { id: 'ml-123' } })
    await upsertMailerLiteSubscriber({ email: 'user@example.com' })

    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(opts.headers?.Authorization).toBe('Bearer test-ml-api-key')
  })
})

// ─── assignSubscriberToGroup ──────────────────────────────────────────────────

describe('assignSubscriberToGroup', () => {
  it('POSTs to the correct group subscribers URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as unknown as Response)

    await assignSubscriberToGroup('sub-abc', 'grp-xyz')

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/groups/grp-xyz/subscribers/sub-abc')
    expect(opts.method).toBe('POST')
  })

  it('handles 204 No Content without throwing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as unknown as Response)

    await expect(assignSubscriberToGroup('sub-abc', 'grp-xyz')).resolves.not.toThrow()
  })
})

// ─── removeSubscriberFromGroup ────────────────────────────────────────────────

describe('removeSubscriberFromGroup', () => {
  it('DELETEs from the correct group subscribers URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as unknown as Response)

    await removeSubscriberFromGroup('sub-abc', 'grp-xyz')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/groups/grp-xyz/subscribers/sub-abc')
    expect(opts.method).toBe('DELETE')
  })
})
