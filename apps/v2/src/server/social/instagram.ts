import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '~/server/env'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

const API_BASE = 'https://graph.instagram.com'
const TAG = '[social/instagram]'
const MEDIA_FIELDS =
  'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}'
/** A few extra so dropping media without a usable thumbnail still fills `limit` (v1). */
const FETCH_WINDOW = 12
const WARN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export type IgMedia = {
  id: string
  permalink: string
  caption: string
  timestamp: string
  imageUrl: string | null
  /** A video or Reel, or a carousel whose lead slide is a video. */
  isVideoPost: boolean
  /** A media_url exists to stream on page (Instagram omits it for some Reels). */
  videoStreamable: boolean
}

type RawChild = { id?: string; media_type: 'IMAGE' | 'VIDEO'; media_url?: string; thumbnail_url?: string }
type RawMedia = {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
  children?: { data?: RawChild[] }
}

function posterFor(m: RawMedia): string | null {
  if (m.media_type === 'VIDEO') return m.thumbnail_url ?? null
  if (m.media_type === 'IMAGE') return m.media_url ?? m.thumbnail_url ?? null
  const first = m.children?.data?.[0]
  if (!first) return null
  return first.media_type === 'VIDEO' ? (first.thumbnail_url ?? null) : (first.media_url ?? first.thumbnail_url ?? null)
}

const leadVideoUrl = (m: Pick<RawMedia, 'media_type' | 'media_url' | 'children'>): string | null => {
  if (m.media_type === 'VIDEO') return m.media_url ?? null
  if (m.media_type === 'CAROUSEL_ALBUM') {
    const first = m.children?.data?.[0]
    return first?.media_type === 'VIDEO' ? (first.media_url ?? null) : null
  }
  return null
}

const isVideoPost = (m: RawMedia) =>
  m.media_type === 'VIDEO' || (m.media_type === 'CAROUSEL_ALBUM' && m.children?.data?.[0]?.media_type === 'VIDEO')

export type InstagramClientOptions = {
  /** Reads the oauth_tokens row; injected in tests. */
  readTokenRow?: () => Promise<{ access_token: string; expires_at: string | null } | null>
  envToken?: string | undefined
  userId?: string | undefined
  fetchImpl?: typeof fetch
  now?: () => number
  logger?: Pick<Console, 'warn' | 'error'>
}

async function readTokenRowFrom(client: SupabaseClient, logger: Pick<Console, 'warn'>) {
  try {
    const { data, error } = await client
      .from('oauth_tokens')
      .select('access_token, expires_at')
      .eq('provider', 'instagram')
      .maybeSingle()
    if (error) {
      logger.warn(`${TAG} oauth_tokens read failed, using the env fallback:`, error.message)
      return null
    }
    return data as { access_token: string; expires_at: string | null } | null
  } catch (error) {
    logger.warn(`${TAG} oauth_tokens read threw, using the env fallback:`, error instanceof Error ? error.message : error)
    return null
  }
}

export function createInstagramClient({
  readTokenRow,
  envToken,
  userId,
  fetchImpl = fetch,
  now = Date.now,
  logger = console,
}: InstagramClientOptions = {}) {
  const readRow = readTokenRow ?? (() => readTokenRowFrom(createSupabaseAdminClient(), logger))

  async function getToken(): Promise<string | null> {
    const row = await readRow()
    if (row?.access_token) {
      if (row.expires_at && Date.parse(row.expires_at) - now() < WARN_WINDOW_MS) {
        logger.warn(`${TAG} token expires soon`, row.expires_at)
      }
      return row.access_token
    }
    if (!envToken) logger.warn(`${TAG} no oauth_tokens row and no INSTAGRAM_ACCESS_TOKEN`)
    return envToken ?? null
  }

  async function graph<T>(path: string, params: Record<string, string>, token: string): Promise<T | null> {
    const query = new URLSearchParams({ ...params, access_token: token })
    try {
      const res = await fetchImpl(`${API_BASE}${path}?${query}`, { signal: AbortSignal.timeout(8_000) })
      const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
      if (!res.ok || json.error) {
        const message = json.error?.message ?? `HTTP ${res.status}`
        logger.error(`${TAG} ${path.split('/')[2] ?? 'request'} failed:`, message)
        return null
      }
      return json
    } catch (error) {
      logger.error(`${TAG} request threw`, error instanceof Error ? error.message : error)
      return null
    }
  }

  async function getLatestMedia(limit = 6): Promise<IgMedia[]> {
    const token = await getToken()
    if (!token) return []
    const json = await graph<{ data?: RawMedia[] }>(
      `/${userId || 'me'}/media`,
      { fields: MEDIA_FIELDS, limit: String(FETCH_WINDOW) },
      token,
    )
    return (json?.data ?? [])
      .map<IgMedia>((m) => ({
        id: m.id,
        permalink: m.permalink,
        caption: m.caption ?? '',
        timestamp: m.timestamp,
        imageUrl: posterFor(m),
        isVideoPost: isVideoPost(m),
        videoStreamable: Boolean(leadVideoUrl(m)),
      }))
      .filter((m) => m.permalink && m.imageUrl)
      .slice(0, limit)
  }

  /** A fresh signed media_url for the video proxy (the stored one expires within hours). */
  async function getVideoUrl(mediaId: string): Promise<string | null> {
    const token = await getToken()
    if (!token) return null
    const json = await graph<RawMedia>(`/${mediaId}`, { fields: 'media_type,media_url,children{media_type,media_url}' }, token)
    return json ? leadVideoUrl(json) : null
  }

  return { getToken, getLatestMedia, getVideoUrl }
}

export const instagram = createInstagramClient({ envToken: env.INSTAGRAM_ACCESS_TOKEN, userId: env.INSTAGRAM_USER_ID })

/** v1 ID_PATTERN for the video proxy. */
export const INSTAGRAM_MEDIA_ID = /^\d+(_\d+)?$/
