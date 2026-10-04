import { describe, it, expect, vi, beforeEach } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

const { state, mockInsert } = vi.hoisted(() => ({
  state: { row: null as Record<string, unknown> | null },
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('@/utils/supabase/base', () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === 'composition_downloads') return { insert: mockInsert }
      const chain = {
        select: () => chain,
        eq: () => chain,
        single: async () =>
          state.row ? { data: state.row, error: null } : { data: null, error: { message: 'not found' } },
      }
      return chain
    },
  }),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'anon-123' }) }),
}))

import { GET } from '@/app/api/composition/download/[slug]/route'

// ─── helpers ──────────────────────────────────────────────────────────────────

function call(slug = 'midnight-rhodes-loop') {
  const req = new Request(`http://localhost/api/composition/download/${slug}`, {
    headers: { referer: 'http://localhost/compositions' },
  })
  return GET(req, { params: Promise.resolve({ slug }) })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  state.row = null
})

// ─── tests ────────────────────────────────────────────────────────────────────

describe('GET /api/composition/download/[slug]', () => {
  it('returns 404 when the composition does not exist', async () => {
    const res = await call()
    expect(res.status).toBe(404)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('logs the download and redirects to the pre-built bundle', async () => {
    const bundleUrl = 'https://cdn.shopify.com/s/files/1/0000/0000/files/os-comp-midnight-rhodes-loop-v1.zip'
    state.row = {
      id: 'comp-1',
      slug: 'midnight-rhodes-loop',
      title: 'Midnight Rhodes Loop',
      bundle_url: bundleUrl,
      audio_file_url: null,
      terms_file_url: null,
      audio_file_name: null,
    }
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const res = await call()

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(bundleUrl)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith({
      composition_id: 'comp-1',
      anon_token: 'anon-123',
      referrer: 'http://localhost/compositions',
    })
  })

  it('returns 404 for a legacy row with no deliverable files', async () => {
    state.row = {
      id: 'comp-2',
      slug: 'broken',
      title: 'Broken',
      bundle_url: null,
      audio_file_url: null,
      terms_file_url: null,
      audio_file_name: null,
    }
    const res = await call('broken')
    expect(res.status).toBe(404)
  })

  it('zips audio + terms on the fly for legacy rows', async () => {
    state.row = {
      id: 'comp-3',
      slug: 'midnight-rhodes-loop',
      title: 'Midnight Rhodes Loop',
      bundle_url: null,
      audio_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/midnight.mp3',
      terms_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/terms.txt',
      audio_file_name: 'Midnight Rhodes Loop.mp3',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('.mp3')
          ? new Response(new Uint8Array([1, 2, 3]))
          : new Response('Terms text'),
      ),
    )

    const res = await call()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
    const entries = unzipSync(new Uint8Array(await res.arrayBuffer()))
    expect(Object.keys(entries).sort()).toEqual([
      'midnight-rhodes-loop/Midnight Rhodes Loop.mp3',
      'midnight-rhodes-loop/Terms of Use.txt',
    ])
    expect(strFromU8(entries['midnight-rhodes-loop/Terms of Use.txt'])).toBe('Terms text')
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })
})
