import { describe, it, expect, vi, beforeEach } from 'bun:test'

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

const { state, mockUpdate, mockLogEvent } = vi.hoisted(() => ({
  state: { row: null as Record<string, unknown> | null, updateError: null as { message: string } | null },
  mockUpdate: vi.fn(),
  mockLogEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/utils/supabase/base', () => ({
  createSupabaseAdminClient: () => ({
    from: () => {
      const select = {
        eq: () => select,
        maybeSingle: async () => ({ data: state.row, error: null }),
      }
      const update = {
        eq: () => update,
        is: async () => ({ error: state.updateError }),
      }
      return {
        select: () => select,
        update: (values: unknown) => {
          mockUpdate(values)
          return update
        },
      }
    },
  }),
}))

vi.mock('@/lib/email/sync-contact', () => ({ logContactEvent: mockLogEvent }))

import { GET } from '@/app/api/resources/download/[id]/route'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ID = '2f1c9a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b'
const DRIVE_URL = 'https://drive.google.com/uc?id=kit&export=download'

function call(id = ID) {
  return GET(new Request(`http://localhost/api/resources/download/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function makeRow(overrides: Partial<{ downloaded_at: string | null; active: boolean }> = {}) {
  return {
    id: ID,
    contact_id: 'contact-1',
    downloaded_at: overrides.downloaded_at ?? null,
    free_resources: { slug: 'starter-kit', download_url: DRIVE_URL, active: overrides.active ?? true },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  state.row = null
  state.updateError = null
})

// ─── tests ────────────────────────────────────────────────────────────────────

describe('GET /api/resources/download/[id]', () => {
  it('returns 404 for a malformed id without querying', async () => {
    const res = await call('not-a-uuid')
    expect(res.status).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 404 when the download record does not exist', async () => {
    const res = await call()
    expect(res.status).toBe(404)
  })

  it('returns 404 when the resource was deactivated', async () => {
    state.row = makeRow({ active: false })
    const res = await call()
    expect(res.status).toBe(404)
  })

  it('records the first download, logs an event, and redirects', async () => {
    state.row = makeRow()
    const res = await call()

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(DRIVE_URL)
    expect(mockUpdate).toHaveBeenCalledWith({ downloaded_at: expect.any(String) })
    expect(mockLogEvent).toHaveBeenCalledWith({
      contactId: 'contact-1',
      eventType: 'resource_downloaded',
      metadata: { resource_slug: 'starter-kit', resource_download_id: ID },
    })
  })

  it('does not overwrite downloaded_at on repeat clicks', async () => {
    state.row = makeRow({ downloaded_at: '2026-09-01T00:00:00.000Z' })
    const res = await call()

    expect(res.status).toBe(302)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockLogEvent).not.toHaveBeenCalled()
  })

  it('still redirects when recording the download fails', async () => {
    state.row = makeRow()
    state.updateError = { message: 'db down' }
    const res = await call()

    expect(res.status).toBe(302)
    expect(mockLogEvent).not.toHaveBeenCalled()
  })
})
