import { env } from '~/server/env'

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const TAG = '[social/youtube]'

export type YouTubeVideo = {
  id: string
  title: string
  thumbnailUrl: string | null
  publishedAt: string
  url: string
}

export type YouTubeClientOptions = {
  apiKey: string | undefined
  fetchImpl?: typeof fetch
  logger?: Pick<Console, 'warn' | 'error'>
}

export function createYouTubeClient({ apiKey, fetchImpl = fetch, logger = console }: YouTubeClientOptions) {
  async function get<T>(path: string, params: Record<string, string>): Promise<T | null> {
    const query = new URLSearchParams({ ...params, key: apiKey ?? '' })
    try {
      const res = await fetchImpl(`${API_BASE}${path}?${query}`, { signal: AbortSignal.timeout(8_000) })
      if (!res.ok) {
        // Never log the query string: it carries the key.
        logger.error(`${TAG} GET ${path} failed with HTTP`, res.status)
        return null
      }
      return (await res.json()) as T
    } catch (error) {
      logger.error(`${TAG} GET ${path} threw`, error instanceof Error ? error.message : error)
      return null
    }
  }

  async function getLatestChannelVideos(handle: string, max = 6): Promise<YouTubeVideo[]> {
    if (!apiKey) {
      logger.warn(`${TAG} YOUTUBE_API_KEY not set`)
      return []
    }
    if (!handle) return []

    const channel = await get<{ items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] }>('/channels', {
      part: 'contentDetails',
      forHandle: handle,
    })
    const uploads = channel?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploads) {
      logger.warn(`${TAG} no uploads playlist for @${handle}`)
      return []
    }

    const playlist = await get<{
      items?: {
        snippet?: {
          title: string
          publishedAt: string
          resourceId?: { videoId?: string }
          thumbnails?: Record<string, { url: string; width?: number }>
        }
      }[]
    }>('/playlistItems', { part: 'snippet', playlistId: uploads, maxResults: String(max) })
    if (!playlist?.items) return []

    return playlist.items.flatMap((item) => {
      const snippet = item.snippet
      const id = snippet?.resourceId?.videoId
      if (!snippet || !id) return []
      // 'high' (hqdefault, 480px) always exists. The widest listed size (maxres or a 'qhd' variant)
      // can 404 for some videos, so it is never picked.
      const t = snippet.thumbnails ?? {}
      const best = (t.high ?? t.medium ?? t.standard ?? t.default)?.url ?? null
      return [{ id, title: snippet.title, thumbnailUrl: best, publishedAt: snippet.publishedAt, url: `https://www.youtube.com/watch?v=${id}` }]
    })
  }

  return { getLatestChannelVideos }
}

export const youtube = createYouTubeClient({ apiKey: env.YOUTUBE_API_KEY })
