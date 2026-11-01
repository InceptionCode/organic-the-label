import { describe, expect, mock, test } from 'bun:test'
import { createCache, type CacheStore } from '~/server/cache/redis'
import { PERSON_SAME_AS, PLACEMENTS, YOUTUBE_HANDLE } from '~/lib/work-with-me-content'
import { instagramEmbedSrc, spotifyEmbedSrc, spotifyIdFromUrl, youtubeHandleFromUrl } from '~/lib/work-with-me-embeds'
import { createInstagramClient, INSTAGRAM_MEDIA_ID } from '~/server/social/instagram'
import { createSpotifyClient, type SpotifyClient } from '~/server/social/spotify'
import { getRecentPosts, getWorkWithMeSpotify } from '~/server/social/work-with-me'
import { createYouTubeClient } from '~/server/social/youtube'

const silent = { warn: () => {}, error: () => {} }

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>
function fakeFetch(route: Route) {
  const fn = mock(async (input: string | URL | Request, init?: RequestInit) => route(String(input), init))
  return { fn, fetchImpl: fn as unknown as typeof fetch }
}

function memoryCache() {
  const store = new Map<string, unknown>()
  const redis: CacheStore = {
    get: async <T,>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key, value) => {
      store.set(key, value)
      return 'OK'
    },
  }
  return { store, getCached: createCache(redis, silent).getCached }
}

describe('embed helpers and content', () => {
  test('youtube handle, spotify ids and embeds, instagram embeds', () => {
    expect(youtubeHandleFromUrl('https://www.youtube.com/@juicetheprod')).toBe('juicetheprod')
    expect(youtubeHandleFromUrl('https://youtube.com/channel/abc')).toBeNull()
    expect(spotifyIdFromUrl('https://open.spotify.com/track/abc123?si=x', 'track')).toBe('abc123')
    expect(spotifyIdFromUrl('https://open.spotify.com/embed/artist/xyz', 'artist')).toBe('xyz')
    expect(spotifyIdFromUrl('https://open.spotify.com/album/xyz', 'track')).toBeNull()
    expect(spotifyEmbedSrc('https://open.spotify.com/artist/abc?si=1')).toBe('https://open.spotify.com/embed/artist/abc')
    expect(spotifyEmbedSrc('http://open.spotify.com/artist/abc')).toBeNull()
    expect(instagramEmbedSrc('https://www.instagram.com/reel/Cx_1-a/')).toBe('https://www.instagram.com/reel/Cx_1-a/embed/')
    expect(instagramEmbedSrc('https://evil.test/p/abc')).toBeNull()
  })

  test('recent posts use the main channel; sameAs dedupes and adds Muso', () => {
    expect(YOUTUBE_HANDLE).toBe('juicetheprod')
    expect(new Set(PERSON_SAME_AS).size).toBe(PERSON_SAME_AS.length)
    expect(PERSON_SAME_AS).toContain('https://www.youtube.com/@juiceman-theprod')
    expect(PERSON_SAME_AS.some((u) => u.includes('muso.ai'))).toBe(true)
  })

  test('instagram media id pattern', () => {
    expect(INSTAGRAM_MEDIA_ID.test('17890000000000000')).toBe(true)
    expect(INSTAGRAM_MEDIA_ID.test('178_99')).toBe(true)
    expect(INSTAGRAM_MEDIA_ID.test('../etc')).toBe(false)
  })
})

describe('spotify client', () => {
  const tokenOk = () => Response.json({ access_token: 'tok', expires_in: 3600 })

  test('no credentials: null and no network', async () => {
    const { fn, fetchImpl } = fakeFetch(() => tokenOk())
    const client = createSpotifyClient({ clientId: undefined, clientSecret: 's', fetchImpl, logger: silent })
    expect(await client.getArtist('a')).toBeNull()
    expect(await client.getArtistReleases('a')).toEqual([])
    expect(fn).not.toHaveBeenCalled()
  })

  test('token is cached until 30s before expiry', async () => {
    let now = 0
    const { fn, fetchImpl } = fakeFetch((url) =>
      url.includes('accounts.spotify.com') ? tokenOk() : Response.json({ id: 't', name: 'T', album: { images: [] } }),
    )
    const client = createSpotifyClient({ clientId: 'id', clientSecret: 's', fetchImpl, now: () => now, logger: silent })
    await client.getTrack('t')
    await client.getTrack('t')
    const tokenCalls = () => fn.mock.calls.filter(([u]) => String(u).includes('accounts.spotify.com')).length
    expect(tokenCalls()).toBe(1)
    const [, init] = fn.mock.calls[0]!
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa('id:s')}`)
    now = 3_600_000 - 29_000
    await client.getTrack('t')
    expect(tokenCalls()).toBe(2)
  })

  test('artist maps the largest image, followers, genres', async () => {
    const { fetchImpl } = fakeFetch((url) =>
      url.includes('accounts')
        ? tokenOk()
        : Response.json({
            id: 'a',
            name: 'JUICEMAN',
            images: [{ url: 'small', width: 64 }, { url: 'big', width: 640 }],
            followers: { total: 1234 },
            genres: ['trap'],
            external_urls: { spotify: 'https://open.spotify.com/artist/a' },
          }),
    )
    const client = createSpotifyClient({ clientId: 'id', clientSecret: 's', fetchImpl, logger: silent })
    expect(await client.getArtist('a')).toEqual({
      id: 'a',
      name: 'JUICEMAN',
      imageUrl: 'big',
      followers: 1234,
      genres: ['trap'],
      spotifyUrl: 'https://open.spotify.com/artist/a',
    })
  })

  test('releases dedupe by name and sort newest first', async () => {
    const item = (id: string, name: string, date: string) => ({ id, name, album_type: 'single', release_date: date, images: [], external_urls: {} })
    const { fetchImpl } = fakeFetch((url) =>
      url.includes('accounts')
        ? tokenOk()
        : Response.json({ items: [item('1', 'Old', '2023-01-01'), item('2', 'New', '2025-05-01'), item('3', 'old ', '2024-01-01')] }),
    )
    const client = createSpotifyClient({ clientId: 'id', clientSecret: 's', fetchImpl, logger: silent })
    const releases = await client.getArtistReleases('a')
    expect(releases.map((r) => [r.id, r.releaseYear])).toEqual([
      ['2', '2025'],
      ['1', '2023'],
    ])
  })

  test('token failure, API failure, and a thrown fetch all fall back', async () => {
    const down = createSpotifyClient({ clientId: 'id', clientSecret: 's', fetchImpl: fakeFetch(() => new Response('', { status: 503 })).fetchImpl, logger: silent })
    expect(await down.getArtist('a')).toBeNull()
    const apiDown = createSpotifyClient({
      clientId: 'id',
      clientSecret: 's',
      fetchImpl: fakeFetch((url) => (url.includes('accounts') ? tokenOk() : new Response('', { status: 429 }))).fetchImpl,
      logger: silent,
    })
    expect(await apiDown.getArtistReleases('a')).toEqual([])
    const thrown = createSpotifyClient({
      clientId: 'id',
      clientSecret: 's',
      fetchImpl: fakeFetch(() => {
        throw new Error('offline')
      }).fetchImpl,
      logger: silent,
    })
    expect(await thrown.getTrack('t')).toBeNull()
  })
})

describe('youtube client', () => {
  test('no key: [] without a request', async () => {
    const { fn, fetchImpl } = fakeFetch(() => Response.json({}))
    expect(await createYouTubeClient({ apiKey: undefined, fetchImpl, logger: silent }).getLatestChannelVideos('h')).toEqual([])
    expect(fn).not.toHaveBeenCalled()
  })

  test('channel by handle, then uploads, the always-present high thumbnail', async () => {
    const { fn, fetchImpl } = fakeFetch((url) =>
      url.includes('/channels')
        ? Response.json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU1' } } }] })
        : Response.json({
            items: [
              { snippet: { title: 'Session', publishedAt: '2026-01-01', resourceId: { videoId: 'v1' }, thumbnails: { default: { url: 's', width: 120 }, high: { url: 'h', width: 480 }, maxres: { url: 'l', width: 1280 } } } },
              { snippet: { title: 'No id', publishedAt: '2026-01-01', resourceId: {} } },
            ],
          }),
    )
    const videos = await createYouTubeClient({ apiKey: 'k', fetchImpl, logger: silent }).getLatestChannelVideos('juicetheprod', 6)
    expect(videos).toEqual([{ id: 'v1', title: 'Session', thumbnailUrl: 'h', publishedAt: '2026-01-01', url: 'https://www.youtube.com/watch?v=v1' }])
    const first = new URL(String(fn.mock.calls[0]![0]))
    expect(first.searchParams.get('forHandle')).toBe('juicetheprod')
    expect(new URL(String(fn.mock.calls[1]![0])).searchParams.get('playlistId')).toBe('UU1')
  })

  test('no uploads playlist or an HTTP error: []', async () => {
    expect(await createYouTubeClient({ apiKey: 'k', fetchImpl: fakeFetch(() => Response.json({ items: [] })).fetchImpl, logger: silent }).getLatestChannelVideos('h')).toEqual([])
    expect(await createYouTubeClient({ apiKey: 'k', fetchImpl: fakeFetch(() => new Response('', { status: 403 })).fetchImpl, logger: silent }).getLatestChannelVideos('h')).toEqual([])
  })
})

describe('instagram client', () => {
  const media = {
    data: [
      { id: '1', media_type: 'VIDEO', media_url: 'mp4', thumbnail_url: 'thumb', permalink: 'https://www.instagram.com/reel/a/', timestamp: 't' },
      { id: '2', media_type: 'IMAGE', media_url: 'img', permalink: 'https://www.instagram.com/p/b/', timestamp: 't', caption: 'hi' },
      { id: '3', media_type: 'CAROUSEL_ALBUM', permalink: 'p', timestamp: 't', children: { data: [{ media_type: 'VIDEO', thumbnail_url: 'c' }] } },
      { id: '4', media_type: 'IMAGE', permalink: 'p', timestamp: 't' },
    ],
  }

  test('token from the oauth_tokens row wins over env', async () => {
    const client = createInstagramClient({ readTokenRow: async () => ({ access_token: 'db', expires_at: null }), envToken: 'env', logger: silent })
    expect(await client.getToken()).toBe('db')
    const fallback = createInstagramClient({ readTokenRow: async () => null, envToken: 'env', logger: silent })
    expect(await fallback.getToken()).toBe('env')
  })

  test('media: poster, video flags, filtered to usable thumbnails', async () => {
    const { fn, fetchImpl } = fakeFetch(() => Response.json(media))
    const client = createInstagramClient({ readTokenRow: async () => ({ access_token: 'db', expires_at: null }), fetchImpl, logger: silent })
    const items = await client.getLatestMedia(6)
    expect(items.map((m) => [m.id, m.imageUrl, m.isVideoPost, m.videoStreamable])).toEqual([
      ['1', 'thumb', true, true],
      ['2', 'img', false, false],
      ['3', 'c', true, false],
    ])
    expect(String(fn.mock.calls[0]![0])).toContain('graph.instagram.com/me/media')
  })

  test('graph errors and no token return empty', async () => {
    const err = createInstagramClient({
      readTokenRow: async () => ({ access_token: 'db', expires_at: null }),
      fetchImpl: fakeFetch(() => Response.json({ error: { message: 'expired' } }, { status: 400 })).fetchImpl,
      logger: silent,
    })
    expect(await err.getLatestMedia()).toEqual([])
    expect(await err.getVideoUrl('1')).toBeNull()
    const none = createInstagramClient({ readTokenRow: async () => null, logger: silent })
    expect(await none.getLatestMedia()).toEqual([])
  })

  test('video url resolves the lead video of a carousel', async () => {
    const { fetchImpl } = fakeFetch(() => Response.json({ media_type: 'CAROUSEL_ALBUM', children: { data: [{ media_type: 'VIDEO', media_url: 'fresh.mp4' }] } }))
    const client = createInstagramClient({ readTokenRow: async () => ({ access_token: 'db', expires_at: null }), fetchImpl, logger: silent })
    expect(await client.getVideoUrl('1')).toBe('fresh.mp4')
  })
})

describe('work with me aggregation and caching', () => {
  const fakeSpotify = (artist: boolean): SpotifyClient => ({
    getArtist: mock(async () =>
      artist ? { id: 'a', name: 'JUICEMAN', imageUrl: 'img', followers: 10, genres: [], spotifyUrl: 'u' } : null,
    ),
    getTrack: mock(async (id: string) => ({ id, name: 'n', artistName: 'a', albumImageUrl: `art-${id}`, spotifyUrl: 'u' })),
    getArtistReleases: mock(async () => []),
  })

  test('without credentials: stable shape, placements kept, nothing cached', async () => {
    const { store, getCached } = memoryCache()
    const client = fakeSpotify(false)
    client.getTrack = mock(async () => null)
    const result = await getWorkWithMeSpotify({ spotify: client, getCached })
    expect(result.artist).toBeNull()
    expect(result.releases).toEqual([])
    expect(result.placements).toHaveLength(PLACEMENTS.length)
    expect(result.placements.every((p) => p.artworkUrl === null)).toBe(true)
    expect(store.size).toBe(0)
  })

  test('with an artist: placements enriched and the result cached under work-with-me:spotify', async () => {
    const { store, getCached } = memoryCache()
    const client = fakeSpotify(true)
    const result = await getWorkWithMeSpotify({ spotify: client, getCached })
    expect(result.placements[0]?.artworkUrl).toBe('art-2dscDmPAiY0NoCZImNXXCR')
    expect(store.has('work-with-me:spotify')).toBe(true)
    await getWorkWithMeSpotify({ spotify: client, getCached })
    expect(client.getArtist).toHaveBeenCalledTimes(1)
  })

  test('recent posts: each source cached separately and only when non-empty; IG video proxy paths', async () => {
    const { store, getCached } = memoryCache()
    const youtube = { getLatestChannelVideos: mock(async () => []) }
    const instagram = {
      getLatestMedia: mock(async () => [
        { id: '1_2', permalink: 'https://www.instagram.com/reel/a/', caption: '', timestamp: 't', imageUrl: 'i', isVideoPost: true, videoStreamable: true },
        { id: '3', permalink: 'https://www.instagram.com/p/b/', caption: 'c', timestamp: 't', imageUrl: 'i', isVideoPost: false, videoStreamable: false },
      ]),
    }
    const posts = await getRecentPosts({ youtube, instagram, getCached })
    expect(youtube.getLatestChannelVideos).toHaveBeenCalledWith('juicetheprod', 6)
    expect(posts.youtube).toEqual([])
    expect(posts.instagram.map((p) => p.videoUrl)).toEqual(['/api/instagram/video/1_2', null])
    expect(store.has('work-with-me:youtube')).toBe(false)
    expect(store.has('work-with-me:instagram')).toBe(true)
  })
})
