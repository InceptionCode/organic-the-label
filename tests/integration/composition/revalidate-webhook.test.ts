import { describe, it, expect, vi, beforeEach } from 'vitest'

const { revalidateTagSpy } = vi.hoisted(() => ({ revalidateTagSpy: vi.fn() }))

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagSpy,
}))

import { POST } from '@/app/api/webhooks/compositions/route'

const SECRET = 'test-webhook-secret'

function makeRequest(body: unknown, secret: string | null = SECRET) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== null) headers['x-webhook-secret'] = secret
  return new Request('http://localhost/api/webhooks/compositions', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const insertPayload = {
  type: 'INSERT',
  table: 'compositions',
  schema: 'public',
  record: { slug: 'midnight-rhodes-loop' },
  old_record: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.INTERNAL_SUPABASE_WEBHOOK_SECRET = SECRET
})

describe('authentication', () => {
  it('returns 401 when the secret header is missing', async () => {
    const res = await POST(makeRequest(insertPayload, null))
    expect(res.status).toBe(401)
    expect(revalidateTagSpy).not.toHaveBeenCalled()
  })

  it('returns 401 when the secret header is wrong', async () => {
    const res = await POST(makeRequest(insertPayload, 'nope'))
    expect(res.status).toBe(401)
    expect(revalidateTagSpy).not.toHaveBeenCalled()
  })

  it('allows through when the secret matches', async () => {
    const res = await POST(makeRequest(insertPayload))
    expect(res.status).toBe(200)
  })

  it('allows through when no secret env var is configured (dev fallback)', async () => {
    delete process.env.INTERNAL_SUPABASE_WEBHOOK_SECRET
    const res = await POST(makeRequest(insertPayload, null))
    expect(res.status).toBe(200)
    expect(revalidateTagSpy).toHaveBeenCalledWith('compositions', 'max')
  })
})

describe('cache revalidation', () => {
  it('busts the "compositions" tag on a valid call', async () => {
    const res = await POST(makeRequest(insertPayload))
    const json = await res.json()

    expect(json).toEqual({ ok: true, revalidated: true })
    expect(revalidateTagSpy).toHaveBeenCalledTimes(1)
    expect(revalidateTagSpy).toHaveBeenCalledWith('compositions', 'max')
  })

  it('works for UPDATE and DELETE events too', async () => {
    await POST(makeRequest({ ...insertPayload, type: 'UPDATE' }))
    await POST(
      makeRequest({
        type: 'DELETE',
        table: 'compositions',
        schema: 'public',
        record: null,
        old_record: { slug: 'grain-choir-texture' },
      }),
    )
    expect(revalidateTagSpy).toHaveBeenCalledTimes(2)
  })

  it('returns 400 on malformed JSON and does not revalidate', async () => {
    const res = await POST(makeRequest('{not json', SECRET))
    expect(res.status).toBe(400)
    expect(revalidateTagSpy).not.toHaveBeenCalled()
  })
})
