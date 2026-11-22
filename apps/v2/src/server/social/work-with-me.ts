import { MusoScreenshotSchema, PlacementListSchema, SITE_CONTENT_KEYS } from '@organic/content-schema'
import { getCached as defaultGetCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { MUSO_SCREENSHOT_URL, PLACEMENTS, SPOTIFY_ARTIST_ID, YOUTUBE_HANDLE, type Placement } from '~/lib/work-with-me-content'
import { spotifyIdFromUrl } from '~/lib/work-with-me-embeds'
import { instagram as defaultInstagram } from './instagram'
import { spotify as defaultSpotify, type SpotifyArtist, type SpotifyClient, type SpotifyRelease } from './spotify'
import { youtube as defaultYouTube, type YouTubeVideo } from './youtube'


export type EnrichedPlacement = Placement & { artworkUrl: string | null }

export type WorkWithMeSpotify = {
  artist: SpotifyArtist | null
  releases: SpotifyRelease[]
  placements: EnrichedPlacement[]
  /** The admin's uploaded Muso.ai screenshot (cdn.shopify.com), else the bundled one. */
  musoScreenshotUrl: string
}

export type InstagramPost = {
  id: string
  url: string
  caption: string
  postedAt: string
  imageUrl: string | null
  isVideoPost: boolean
  /** Same-origin proxy path when streamable, else null (the dialog links out). */
  videoUrl: string | null
}

export type RecentPostsData = { youtube: YouTubeVideo[]; instagram: InstagramPost[] }

type GetCached = typeof defaultGetCached

export type WorkWithMeDeps = {
  spotify?: SpotifyClient
  youtube?: { getLatestChannelVideos: (handle: string, max?: number) => Promise<YouTubeVideo[]> }
  instagram?: { getLatestMedia: (limit?: number) => ReturnType<typeof defaultInstagram.getLatestMedia> }
  getCached?: GetCached
  readSiteContent?: ReadSiteContent
}

// ─── Admin-edited content (site_content) ──────────────────────────────────────
// The admin app writes these rows; apps/api deletes work-with-me:spotify and purges the
// `work-with-me` CDN tag when one changes. A missing or invalid row falls back to the bundled values
// in lib/work-with-me-content.ts, so the page never depends on the table.

export type SiteContentRow = { key: string; value: unknown }
export type ReadSiteContent = () => Promise<SiteContentRow[]>

export type WorkWithMeContent = { placements: Placement[]; musoScreenshotUrl: string }

/** Fallback content, also used by the server fn's error path. */
export const DEFAULT_WORK_WITH_ME_CONTENT: WorkWithMeContent = { placements: PLACEMENTS, musoScreenshotUrl: MUSO_SCREENSHOT_URL }

const readSiteContentRows: ReadSiteContent = async () => {
  const { data, error } = await createSupabaseAdminClient()
    .from('site_content')
    .select('key, value')
    .in('key', [SITE_CONTENT_KEYS.placements, SITE_CONTENT_KEYS.muso])
  if (error) throw new Error(`site_content read failed: ${error.message}`)
  return (data ?? []) as SiteContentRow[]
}

/** Each row validated on its own: one bad row never hides the other. */
export function contentFromRows(rows: SiteContentRow[]): WorkWithMeContent {
  const value = (key: string) => rows.find((row) => row.key === key)?.value
  const placements = PlacementListSchema.safeParse(value(SITE_CONTENT_KEYS.placements))
  const muso = MusoScreenshotSchema.safeParse(value(SITE_CONTENT_KEYS.muso))
  return {
    placements: placements.success ? placements.data : PLACEMENTS,
    musoScreenshotUrl: muso.success ? muso.data.url : MUSO_SCREENSHOT_URL,
  }
}

/** Reads site_content; `ok` is false when the read failed, so the result is served but not cached. */
async function loadContent(read: ReadSiteContent): Promise<{ content: WorkWithMeContent; ok: boolean }> {
  try {
    return { content: contentFromRows(await read()), ok: true }
  } catch (error) {
    console.error('[workWithMe.content]', error instanceof Error ? error.message : error)
    return { content: DEFAULT_WORK_WITH_ME_CONTENT, ok: false }
  }
}

async function loadSpotify(client: SpotifyClient, content: WorkWithMeContent): Promise<WorkWithMeSpotify> {
  const placements = Promise.all(
    content.placements.map(async (placement): Promise<EnrichedPlacement> => {
      const trackId = spotifyIdFromUrl(placement.href ?? '', 'track')
      const track = trackId ? await client.getTrack(trackId) : null
      return { ...placement, artworkUrl: track?.albumImageUrl ?? null }
    }),
  )
  const [artist, releases, enriched] = await Promise.all([
    SPOTIFY_ARTIST_ID ? client.getArtist(SPOTIFY_ARTIST_ID) : Promise.resolve(null),
    SPOTIFY_ARTIST_ID ? client.getArtistReleases(SPOTIFY_ARTIST_ID) : Promise.resolve([]),
    placements,
  ])
  return { artist, releases, placements: enriched, musoScreenshotUrl: content.musoScreenshotUrl }
}

export function getWorkWithMeSpotify(deps: WorkWithMeDeps = {}): Promise<WorkWithMeSpotify> {
  const getCached = deps.getCached ?? defaultGetCached
  const client = deps.spotify ?? defaultSpotify
  const read = deps.readSiteContent ?? readSiteContentRows
  let contentOk = true
  return getCached(
    keys.workWithMeSpotify(),
    ttl.workWithMe,
    async () => {
      const { content, ok } = await loadContent(read)
      contentOk = ok
      return loadSpotify(client, content)
    },
    { shouldCache: (value) => value.artist !== null && contentOk },
  )
}

export async function getRecentPosts(deps: WorkWithMeDeps = {}): Promise<RecentPostsData> {
  const getCached = deps.getCached ?? defaultGetCached
  const yt = deps.youtube ?? defaultYouTube
  const ig = deps.instagram ?? defaultInstagram

  const [youtube, instagram] = await Promise.all([
    YOUTUBE_HANDLE
      ? getCached(keys.workWithMeYoutube(), ttl.workWithMe, () => yt.getLatestChannelVideos(YOUTUBE_HANDLE, 6))
      : Promise.resolve([]),
    getCached(keys.workWithMeInstagram(), ttl.workWithMe, async () =>
      (await ig.getLatestMedia(6)).map<InstagramPost>((m) => ({
        id: m.id,
        url: m.permalink,
        caption: m.caption,
        postedAt: m.timestamp,
        imageUrl: m.imageUrl,
        isVideoPost: m.isVideoPost,
        videoUrl: m.videoStreamable ? `/api/instagram/video/${encodeURIComponent(m.id)}` : null,
      })),
    ),
  ])
  return { youtube, instagram }
}
