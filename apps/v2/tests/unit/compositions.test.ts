import { describe, expect, mock, test } from 'bun:test'
import { inflateRawSync } from 'node:zlib'
import { COMPOSITION_PAGE_COUNT } from '@organic/content-schema'
import {
  COMPOSITION_PAGE_SIZE,
  compositionListSignature,
  hasActiveCompositionFilters,
  rangeCutoffISO,
  sanitizeCompositionSearch,
  toCompositionListParams,
  validateCompositionSearch,
} from '~/lib/composition-search'
import { instagramEmbedSrc, safeExternalHref, youtubeIdFromUrl } from '~/lib/embed-url'
import { handleCompositionDownload, MAX_ZIP_BYTES, safeFileName } from '~/server/compositions/download'
import { listCompositions } from '~/server/compositions/list'
import { crc32, createZip } from '~/server/downloads/zip'
import { fakeSupabase, type Call } from './fake-supabase'

describe('composition search params', () => {
  test('v1 URLs load and normalize', () => {
    expect(validateCompositionSearch({ range: '30d', sort: 'oldest', tags: 'trap,Dark,trap', search: ' keys ' })).toEqual({
      search: 'keys',
      range: '30d',
      sort: 'oldest',
      tags: 'dark,trap',
    })
  })
  test('invalid values are dropped, defaults stay absent', () => {
    expect(validateCompositionSearch({ range: 'all', sort: 'newest', tags: 'free,nope', search: '   ' })).toEqual({
      search: undefined,
      range: undefined,
      sort: undefined,
      tags: undefined,
    })
    expect(validateCompositionSearch({ search: 808 }).search).toBe('808')
    expect(validateCompositionSearch({ search: 'x'.repeat(300) }).search).toHaveLength(100)
  })
  test('list params lowercase the search and split tags', () => {
    expect(toCompositionListParams({ search: 'Late KEYS', tags: 'trap,dark' })).toEqual({ search: 'late keys', tags: ['dark', 'trap'] })
    expect(toCompositionListParams({})).toEqual({})
    expect(hasActiveCompositionFilters({})).toBe(false)
    expect(hasActiveCompositionFilters({ sort: 'oldest' })).toBe(true)
  })
  test('cache signature', () => {
    expect(compositionListSignature({})).toBe('range=all|sort=newest|tags=-|search=-')
    expect(compositionListSignature({ range: '7d', sort: 'oldest', tags: ['dark', 'trap'], search: 'keys' })).toBe(
      'range=7d|sort=oldest|tags=dark,trap|search=keys',
    )
  })
  test('range cutoffs are stable for the whole UTC day', () => {
    const morning = new Date('2026-10-27T01:00:00Z')
    const night = new Date('2026-10-27T23:59:00Z')
    expect(rangeCutoffISO('7d', morning)).toBe(rangeCutoffISO('7d', night))
    expect(rangeCutoffISO('7d', morning)).toBe('2026-10-20T00:00:00.000Z')
    expect(rangeCutoffISO('year', morning)).toBe('2026-01-01T00:00:00.000Z')
    expect(rangeCutoffISO(undefined, morning)).toBeNull()
  })
  test('search sanitizing strips PostgREST metacharacters', () => {
    expect(sanitizeCompositionSearch('a%b,(c)')).toBe('a b c')
  })
  test('client page size mirrors content-schema', () => {
    expect(COMPOSITION_PAGE_SIZE).toBe(COMPOSITION_PAGE_COUNT)
  })
})

describe('embed urls', () => {
  test('youtube ids', () => {
    expect(youtubeIdFromUrl('https://youtube.com/shorts/abcdefghijk?feature=share')).toBe('abcdefghijk')
    expect(youtubeIdFromUrl('https://youtu.be/abcdefghijk')).toBe('abcdefghijk')
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=abcdefghijk')).toBe('abcdefghijk')
    expect(youtubeIdFromUrl('javascript:alert(1)')).toBeNull()
  })
  test('instagram embeds only for https instagram permalinks', () => {
    expect(instagramEmbedSrc('https://www.instagram.com/reel/AbC_1/?igsh=x')).toBe('https://www.instagram.com/reel/AbC_1/embed/')
    expect(instagramEmbedSrc('http://www.instagram.com/p/AbC/')).toBeNull()
    expect(instagramEmbedSrc('https://evil.com/p/AbC/')).toBeNull()
    expect(safeExternalHref('javascript:alert(1)')).toBeUndefined()
  })
})

describe('listCompositions', () => {
  test('applies range, search, tags and sort on active rows', async () => {
    const { client, calls } = fakeSupabase(() => ({ data: [{ id: '1' }], error: null }))
    const rows = await listCompositions(
      { range: '7d', search: 'keys', tags: ['dark'], sort: 'oldest' },
      { client: () => client, now: () => new Date('2026-10-27T12:00:00Z') },
    )
    expect(rows).toEqual([{ id: '1' }] as never)
    const filters = calls[0]!.filters
    expect(filters).toContainEqual(['eq', 'active', true])
    expect(filters).toContainEqual(['gte', 'posted_at', '2026-10-20T00:00:00.000Z'])
    expect(filters).toContainEqual(['or', 'title.ilike.%keys%,description.ilike.%keys%', null])
    expect(filters).toContainEqual(['overlaps', 'tags', ['dark']])
    expect(filters).toContainEqual(['order', 'posted_at', { ascending: true }])
    expect(filters).toContainEqual(['limit', 'limit', 24])
  })
  test('throws on a Supabase error (never cached)', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: { message: 'boom' } }))
    expect(listCompositions({}, { client: () => client })).rejects.toThrow('boom')
  })
})

describe('createZip', () => {
  test('crc32 check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })
  test('entries round-trip (deflated and stored)', () => {
    const text = new TextEncoder().encode('terms '.repeat(200))
    const random = crypto.getRandomValues(new Uint8Array(512))
    const zip = createZip([
      { name: 'loop/Terms of Use.txt', data: text },
      { name: 'loop/a.mp3', data: random },
    ])
    const view = new DataView(zip.buffer)
    const entries: { name: string; data: Uint8Array }[] = []
    let at = 0
    while (view.getUint32(at, true) === 0x04034b50) {
      const method = view.getUint16(at + 8, true)
      const size = view.getUint32(at + 18, true)
      const nameLen = view.getUint16(at + 26, true)
      const name = new TextDecoder().decode(zip.subarray(at + 30, at + 30 + nameLen))
      const body = zip.subarray(at + 30 + nameLen, at + 30 + nameLen + size)
      entries.push({ name, data: method === 8 ? new Uint8Array(inflateRawSync(body)) : body })
      at += 30 + nameLen + size
    }
    expect(entries.map((e) => e.name)).toEqual(['loop/Terms of Use.txt', 'loop/a.mp3'])
    expect(entries[0]!.data).toEqual(text)
    expect(entries[1]!.data).toEqual(random)
    expect(view.getUint32(zip.byteLength - 22, true)).toBe(0x06054b50)
  })
})

describe('GET /compositions/download/$slug', () => {
  const bundleRow = { id: 'c1', slug: 'late-night', title: 'Late Night', bundle_url: 'https://cdn.example/late-night.zip', audio_file_url: null, terms_file_url: null, audio_file_name: null }
  const legacyRow = { ...bundleRow, bundle_url: null, audio_file_url: 'https://cdn.example/a/Late%20Night.mp3', terms_file_url: 'https://cdn.example/terms.pdf', audio_file_name: 'Late Night 90bpm.mp3' }

  const request = (headers: Record<string, string> = {}) =>
    new Request('http://localhost:3001/compositions/download/late-night', { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://organicsonics.com/compositions', ...headers } })

  function db(row: unknown) {
    return fakeSupabase((call: Call) => (call.table === 'compositions' ? { data: row, error: null } : { data: null, error: null }))
  }
  const visitor = () =>
    mock(async (input: { getCookie: (n: string) => string | undefined; setCookie: (n: string, v: string, o: never) => void }) => {
      if (!input.getCookie('anon_token')) input.setCookie('anon_token', 'new-token', { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 10 } as never)
      return { id: 'v1' }
    })

  test('malformed slug is a 404 with no database call', async () => {
    const { client, calls } = db(bundleRow)
    const res = await handleCompositionDownload(request(), 'Bad_Slug', { client })
    expect(res.status).toBe(404)
    expect(calls).toHaveLength(0)
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
  })

  test('unknown or inactive slug is a 404 and creates no visitor', async () => {
    const { client, calls } = db(null)
    const ensureVisitor = visitor()
    const res = await handleCompositionDownload(request(), 'late-night', { client, ensureVisitor })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ ok: false, error: 'Loop not found.' })
    expect(calls[0]!.filters).toContainEqual(['eq', 'active', true])
    expect(ensureVisitor).not.toHaveBeenCalled()
  })

  test('a row without a deliverable is a 404', async () => {
    const { client } = db({ ...legacyRow, terms_file_url: null })
    expect((await handleCompositionDownload(request(), 'late-night', { client, ensureVisitor: visitor() })).status).toBe(404)
  })

  test('bundle rows 302, set the visitor cookie, and log the new anon_token', async () => {
    const { client, calls } = db(bundleRow)
    const res = await handleCompositionDownload(request(), 'late-night', { client, ensureVisitor: visitor() })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(bundleRow.bundle_url)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
    expect(res.headers.get('set-cookie')).toContain('anon_token=new-token')
    const log = calls.find((c) => c.table === 'composition_downloads')!
    expect(log.payload).toEqual({ composition_id: 'c1', anon_token: 'new-token', referrer: 'https://organicsonics.com/compositions' })
  })

  test('an existing visitor keeps its token and gets no new cookie', async () => {
    const { client, calls } = db(bundleRow)
    const res = await handleCompositionDownload(request({ cookie: 'a=1; anon_token=old-token' }), 'late-night', { client, ensureVisitor: visitor() })
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(calls.find((c) => c.table === 'composition_downloads')!.payload).toMatchObject({ anon_token: 'old-token' })
  })

  test('a failing visitor upsert never blocks the download', async () => {
    const { client } = db(bundleRow)
    const res = await handleCompositionDownload(request(), 'late-night', { client, ensureVisitor: async () => Promise.reject(new Error('db down')) })
    expect(res.status).toBe(302)
  })

  test('legacy rows return a zip with the v1 entry names', async () => {
    const { client, calls } = db(legacyRow)
    const fetchImpl = mock(async (url: string | URL | Request) =>
      new Response(String(url).endsWith('.pdf') ? 'terms' : 'audio-bytes', { status: 200 }),
    ) as unknown as typeof fetch
    const res = await handleCompositionDownload(request(), 'late-night', { client, fetchImpl, ensureVisitor: visitor() })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="late-night.zip"')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    const bytes = new Uint8Array(await res.arrayBuffer())
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('late-night/Late Night 90bpm.mp3')
    expect(text).toContain('late-night/Terms of Use.pdf')
    expect(calls.some((c) => c.table === 'composition_downloads')).toBe(true)
  })

  test('upstream failure is a 502 and is not logged', async () => {
    const { client, calls } = db(legacyRow)
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch
    const res = await handleCompositionDownload(request(), 'late-night', { client, fetchImpl, ensureVisitor: visitor() })
    expect(res.status).toBe(502)
    expect(calls.some((c) => c.table === 'composition_downloads')).toBe(false)
  })

  test('an oversized upstream file is a 413', async () => {
    const { client } = db(legacyRow)
    const fetchImpl = (async () =>
      new Response('x', { status: 200, headers: { 'content-length': String(MAX_ZIP_BYTES + 1) } })) as unknown as typeof fetch
    expect((await handleCompositionDownload(request(), 'late-night', { client, fetchImpl, ensureVisitor: visitor() })).status).toBe(413)
  })

  test('safeFileName strips paths and odd characters', () => {
    expect(safeFileName('../../etc/pa$$wd.mp3', 'x.mp3')).toBe('pa_wd.mp3')
    expect(safeFileName('   ', 'x.mp3')).toBe('x.mp3')
  })
})
