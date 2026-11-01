import { env } from '~/server/env'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'
const TAG = '[social/spotify]'

export type SpotifyArtist = {
  id: string
  name: string
  imageUrl: string | null
  followers: number
  genres: string[]
  spotifyUrl: string
}

export type SpotifyTrackMeta = {
  id: string
  name: string
  artistName: string
  albumImageUrl: string | null
  spotifyUrl: string
}

export type SpotifyRelease = {
  id: string
  name: string
  imageUrl: string | null
  releaseDate: string
  releaseYear: string
  albumType: 'album' | 'single' | 'compilation'
  totalTracks: number
  spotifyUrl: string
}

type Image = { url: string; width?: number | null }
const largest = (images: Image[] | undefined) => [...(images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null

export type SpotifyClientOptions = {
  clientId: string | undefined
  clientSecret: string | undefined
  fetchImpl?: typeof fetch
  now?: () => number
  logger?: Pick<Console, 'warn' | 'error'>
}

export function createSpotifyClient({ clientId, clientSecret, fetchImpl = fetch, now = Date.now, logger = console }: SpotifyClientOptions) {
  let cached: { value: string; expiresAt: number } | null = null

  async function token(): Promise<string | null> {
    if (!clientId || !clientSecret) {
      logger.warn(`${TAG} SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set`)
      return null
    }
    if (cached && cached.expiresAt > now() + 30_000) return cached.value
    try {
      const res = await fetchImpl(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) {
        logger.error(`${TAG} token request failed with HTTP`, res.status)
        return null
      }
      const json = (await res.json()) as { access_token: string; expires_in: number }
      cached = { value: json.access_token, expiresAt: now() + json.expires_in * 1000 }
      return cached.value
    } catch (error) {
      logger.error(`${TAG} token request threw`, error instanceof Error ? error.message : error)
      return null
    }
  }

  async function get<T>(path: string): Promise<T | null> {
    const bearer = await token()
    if (!bearer) return null
    try {
      const res = await fetchImpl(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${bearer}` },
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) {
        logger.error(`${TAG} GET ${path.split('?')[0]} failed with HTTP`, res.status)
        return null
      }
      return (await res.json()) as T
    } catch (error) {
      logger.error(`${TAG} GET ${path.split('?')[0]} threw`, error instanceof Error ? error.message : error)
      return null
    }
  }

  async function getArtist(artistId: string): Promise<SpotifyArtist | null> {
    if (!artistId) return null
    const data = await get<{
      id: string
      name: string
      images?: Image[]
      followers?: { total?: number }
      genres?: string[]
      external_urls?: { spotify?: string }
    }>(`/artists/${encodeURIComponent(artistId)}`)
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      imageUrl: largest(data.images),
      followers: data.followers?.total ?? 0,
      genres: data.genres ?? [],
      spotifyUrl: data.external_urls?.spotify ?? `https://open.spotify.com/artist/${data.id}`,
    }
  }

  async function getTrack(trackId: string): Promise<SpotifyTrackMeta | null> {
    if (!trackId) return null
    const data = await get<{
      id: string
      name: string
      artists?: { name: string }[]
      external_urls?: { spotify?: string }
      album?: { images?: Image[] }
    }>(`/tracks/${encodeURIComponent(trackId)}`)
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      artistName: data.artists?.[0]?.name ?? '',
      albumImageUrl: largest(data.album?.images),
      spotifyUrl: data.external_urls?.spotify ?? `https://open.spotify.com/track/${data.id}`,
    }
  }

  /** Singles and albums, US market, deduped by name (first wins), newest first (v1). */
  async function getArtistReleases(artistId: string, market = 'US', limit = 8): Promise<SpotifyRelease[]> {
    if (!artistId) return []
    const data = await get<{
      items?: {
        id: string
        name: string
        album_type: SpotifyRelease['albumType']
        release_date?: string
        total_tracks?: number
        images?: Image[]
        external_urls?: { spotify?: string }
      }[]
    }>(`/artists/${encodeURIComponent(artistId)}/albums?include_groups=single,album&market=${market}&limit=${limit}`)
    if (!data?.items) return []

    const seen = new Set<string>()
    return data.items
      .filter((item) => {
        const key = item.name.trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: largest(item.images),
        releaseDate: item.release_date ?? '',
        releaseYear: (item.release_date ?? '').slice(0, 4),
        albumType: item.album_type,
        totalTracks: item.total_tracks ?? 0,
        spotifyUrl: item.external_urls?.spotify ?? `https://open.spotify.com/album/${item.id}`,
      }))
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  }

  return { getArtist, getTrack, getArtistReleases }
}

export type SpotifyClient = ReturnType<typeof createSpotifyClient>

export const spotify = createSpotifyClient({ clientId: env.SPOTIFY_CLIENT_ID, clientSecret: env.SPOTIFY_CLIENT_SECRET })
