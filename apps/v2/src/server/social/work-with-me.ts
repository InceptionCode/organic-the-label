import { getCached as defaultGetCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { PLACEMENTS, SPOTIFY_ARTIST_ID, YOUTUBE_HANDLE, type Placement } from '~/lib/work-with-me-content'
import { spotifyIdFromUrl } from '~/lib/work-with-me-embeds'
import { instagram as defaultInstagram } from './instagram'
import { spotify as defaultSpotify, type SpotifyArtist, type SpotifyClient, type SpotifyRelease } from './spotify'
import { youtube as defaultYouTube, type YouTubeVideo } from './youtube'


export type EnrichedPlacement = Placement & { artworkUrl: string | null }

export type WorkWithMeSpotify = {
  artist: SpotifyArtist | null
  releases: SpotifyRelease[]
  placements: EnrichedPlacement[]
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
}

async function loadSpotify(client: SpotifyClient): Promise<WorkWithMeSpotify> {
  const placements = Promise.all(
    PLACEMENTS.map(async (placement): Promise<EnrichedPlacement> => {
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
  return { artist, releases, placements: enriched }
}

export function getWorkWithMeSpotify(deps: WorkWithMeDeps = {}): Promise<WorkWithMeSpotify> {
  const getCached = deps.getCached ?? defaultGetCached
  const client = deps.spotify ?? defaultSpotify
  return getCached(keys.workWithMeSpotify(), ttl.workWithMe, () => loadSpotify(client), {
    shouldCache: (value) => value.artist !== null,
  })
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
