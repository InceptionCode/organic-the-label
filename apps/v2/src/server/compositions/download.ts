import type { SupabaseClient } from '@supabase/supabase-js'
import { SLUG_PATTERN } from '@organic/content-schema'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { ANON_COOKIE, ensureVisitor as defaultEnsureVisitor, type EnsureVisitorInput } from '~/server/identity/visitor'
import { DOWNLOAD_HEADERS, jsonError, readCookie, serializeCookie } from '~/server/downloads/http'
import { createZip } from '~/server/downloads/zip'

// GET /compositions/download/$slug (pages/compositions.md). Compositions are free: there is no
// entitlement to check. Access control is "the row exists and is active"; everything else is 404.
// The admin client is used inside this named service because the download columns (bundle_url,
// terms_file_url) are not part of the public listing.

export const MAX_ZIP_BYTES = 100 * 1024 * 1024
const NOT_FOUND = 'Loop not found.'
const TAG = '[compositions.download]'

export type CompositionDownloadRow = {
  id: string
  slug: string
  title: string
  bundle_url: string | null
  audio_file_url: string | null
  terms_file_url: string | null
  audio_file_name: string | null
}

export type CompositionDownloadDeps = {
  client?: SupabaseClient
  fetchImpl?: typeof fetch
  ensureVisitor?: (input: EnsureVisitorInput) => Promise<{ id: string } | null>
  /** False only on http://localhost (the anon_token cookie is Secure everywhere else). */
  secureCookies?: boolean
}

export function safeFileName(name: string, fallback: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() ?? ''
  const cleaned = base.replace(/[^\w.\- ]+/g, '_')
  return cleaned.length ? cleaned : fallback
}

export function extFromUrl(url: string, fallback: string): string {
  try {
    const match = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)
    return match ? match[1]!.toLowerCase() : fallback
  } catch {
    return fallback
  }
}

class TooLargeError extends Error {}

async function fetchBytes(fetchImpl: typeof fetch, url: string, label: string): Promise<Uint8Array> {
  const res = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`${label} upstream responded ${res.status}`)
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > MAX_ZIP_BYTES) throw new TooLargeError(`${label} is ${declared} bytes`)
  return new Uint8Array(await res.arrayBuffer())
}

export async function handleCompositionDownload(request: Request, slug: string, deps: CompositionDownloadDeps = {}): Promise<Response> {
  if (!SLUG_PATTERN.test(slug)) return jsonError(404, NOT_FOUND)

  const client = deps.client ?? createSupabaseAdminClient()
  const { data, error } = await client
    .from('compositions')
    .select('id, slug, title, bundle_url, audio_file_url, terms_file_url, audio_file_name')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  const row = data as CompositionDownloadRow | null
  if (error) console.error(TAG, 'lookup failed', error.message)
  if (error || !row) return jsonError(404, NOT_FOUND)
  if (!row.bundle_url && (!row.audio_file_url || !row.terms_file_url)) {
    console.error(TAG, 'no deliverable', row.id)
    return jsonError(404, NOT_FOUND)
  }

  // Lazy visitor: created on a download click, never on a page view. Bots get none. Never fatal.
  const setCookies: string[] = []
  let anonToken = readCookie(request.headers.get('cookie'), ANON_COOKIE) ?? null
  try {
    await (deps.ensureVisitor ?? defaultEnsureVisitor)({
      getCookie: (name) => readCookie(request.headers.get('cookie'), name),
      setCookie: (name, value, options) => {
        setCookies.push(serializeCookie(name, value, options))
        if (name === ANON_COOKIE) anonToken = value
      },
      userAgent: request.headers.get('user-agent'),
      secure: deps.secureCookies ?? true,
    })
  } catch (visitorError) {
    console.error(TAG, 'ensureVisitor failed', visitorError instanceof Error ? visitorError.message : visitorError)
  }

  const headers = (extra: Record<string, string> = {}) => {
    const h = new Headers({ ...DOWNLOAD_HEADERS, ...extra })
    for (const cookie of setCookies) h.append('Set-Cookie', cookie)
    return h
  }

  const logDownload = async () => {
    const { error: logError } = await client.from('composition_downloads').insert({
      composition_id: row.id,
      anon_token: anonToken,
      referrer: request.headers.get('referer'),
    })
    if (logError) console.error(TAG, 'download log failed (non-fatal)', logError.message)
  }

  if (row.bundle_url) {
    await logDownload()
    return new Response(null, { status: 302, headers: headers({ Location: row.bundle_url }) })
  }

  // Legacy rows: fetch audio and terms and zip them on the fly (v1 entry names).
  const fetchImpl = deps.fetchImpl ?? fetch
  let audio: Uint8Array
  let terms: Uint8Array
  try {
    ;[audio, terms] = await Promise.all([
      fetchBytes(fetchImpl, row.audio_file_url!, 'audio'),
      fetchBytes(fetchImpl, row.terms_file_url!, 'terms'),
    ])
  } catch (fetchError) {
    console.error(TAG, 'upstream fetch failed', fetchError instanceof Error ? fetchError.message : fetchError)
    if (fetchError instanceof TooLargeError) return jsonError(413, 'This download is too large to serve.')
    return jsonError(502, 'Could not assemble the download right now.')
  }
  if (audio.byteLength + terms.byteLength > MAX_ZIP_BYTES) return jsonError(413, 'This download is too large to serve.')

  const folder = slug.replace(/[^\w-]/g, '') || 'loop'
  const audioExt = extFromUrl(row.audio_file_url!, 'wav')
  const termsExt = extFromUrl(row.terms_file_url!, 'txt')
  const audioName = row.audio_file_name ? safeFileName(row.audio_file_name, `${slug}.${audioExt}`) : `${slug}.${audioExt}`
  const zipped = createZip([
    { name: `${folder}/${audioName}`, data: audio },
    { name: `${folder}/Terms of Use.${termsExt}`, data: terms },
  ])

  await logDownload()
  return new Response(zipped, {
    status: 200,
    headers: headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${folder}.zip"`,
      'Content-Length': String(zipped.byteLength),
    }),
  })
}
