import { spotifyIdFromUrl, youtubeHandleFromUrl } from './work-with-me-embeds'

// All Work With Me copy (port of v1 lib/work-with-me/content.ts, em dashes removed). The YouTube
// main channel is @juicetheprod and the Shorts channel @juiceman-theprod (decided 2026-10-26; v1
// pointed both links at the Shorts channel).

export type ServiceIconKey = 'mixing' | 'collab' | 'leasing' | 'suite'
export type Service = { title: string; blurb: string; icon: ServiceIconKey }
export type Placement = {
  artist: string
  track: string
  role: string
  /** Spotify track URL. Cover art comes from it; without one the card shows the Music icon. */
  href?: string
}
export type ArtistPlatform = 'spotify' | 'appleMusic' | 'youtube'
export type ArtistLink = { platform: ArtistPlatform; label: string; url: string }

export const HERO = {
  eyebrow: 'Producer services & placements',
  titleLines: ['Crafting the', 'future of sound'],
  subcopy:
    'Collaborate directly with JUICEMAN to elevate your sound, from custom production and beats to mixing and mastering for Hip-Hop, Trap, and R&B.',
  ctaLabel: 'Start a project',
} as const

export const BIO = {
  heading: 'Who is JUICEMAN?',
  paragraphs: [
    'JUICEMAN makes atmospheric instrumentals where emotion, texture, and rhythm move as one: melodic trap, ambient soundscapes, soulful harmony, and vintage-inspired production. Rooted in Atlanta and built on an artist-first approach, he treats every beat as its own world with expressive melodies, spacious arrangements, detailed sound design, and drums that carry real weight and movement.',
    "The sound sits between modern hip-hop and immersive, film-like composition pulling from analog warmth, R&B, and soul, and shaped by everyone from Pharrell, Kanye, and Prince to Wheezy, Future, and Travis Scott. Across instrumental projects, producer collaborations, and visual storytelling, it's a body of work centered on feeling and music that lasts beyond the moment.",
  ],
  platformNote:
    "Organic Sonics is the platform being built around that work: part catalog, part studio, part storefront. It's where artists and producers stream the instrumentals, book production and mix sessions, and pull from the same sounds and sessions that shape the releases.",
  ctaLabel: 'Work with me',
} as const

export const MUSO_PROFILE_URL = 'https://muso.ai/profile/5883477a-6ef7-4a70-ba34-a2f17530bcb1'
export const MUSO_SCREENSHOT_URL = '/muso-screenshot.png'

export const YOUTUBE_MAIN_URL = 'https://www.youtube.com/@juicetheprod'
export const YOUTUBE_SHORTS_URL = 'https://www.youtube.com/@juiceman-theprod'

export const ARTIST_LINKS: ArtistLink[] = [
  { platform: 'spotify', label: 'Spotify Artist Page', url: 'https://open.spotify.com/artist/1rfSEaVxpWG8WXtL6Wj0SH' },
  { platform: 'appleMusic', label: 'Apple Music Artist Page', url: 'https://music.apple.com/us/artist/juiceman/6788973192' },
  { platform: 'youtube', label: 'YouTube Main Channel', url: YOUTUBE_MAIN_URL },
  { platform: 'youtube', label: 'YouTube Shorts Channel', url: YOUTUBE_SHORTS_URL },
]

/** Recent posts pull from the main channel. */
export const YOUTUBE_HANDLE = youtubeHandleFromUrl(YOUTUBE_MAIN_URL) ?? ''

export const PLACEMENTS: Placement[] = [
  {
    artist: 'RRForeverSolid',
    track: 'Like The Rest',
    role: 'Producer, Mastering Engineer',
    href: 'https://open.spotify.com/track/2dscDmPAiY0NoCZImNXXCR',
  },
  {
    artist: 'RRForeverSolid',
    track: 'Something To See',
    role: 'Producer, Mastering Engineer',
    href: 'https://open.spotify.com/track/7sB9pnsYK9KiwFkVjwSLld',
  },
  {
    artist: 'RRForeverSolid',
    track: 'Double Up',
    role: 'Producer, Mastering Engineer',
    href: 'https://open.spotify.com/track/72RbpkRqYj5p5MWqDQSUfU',
  },
  {
    artist: 'RRForeverSolid',
    track: 'Muddies',
    role: 'Producer',
    href: 'https://open.spotify.com/track/7sjmDwOaN9WBPj73uDxYlg',
  },
]

export const SERVICES_HEADING = 'A skilled craftsman and artist offering a range of services'

export const SERVICES: Service[] = [
  { title: 'Mixing & Mastering', blurb: 'Industry-standard sonic quality: clean, loud, and DSP-ready.', icon: 'mixing' },
  { title: 'Production Collabs', blurb: 'Co-produce your next record from the first idea to the final bounce.', icon: 'collab' },
  { title: 'Beat Leasing', blurb: 'License from an exclusive catalog of instrumentals.', icon: 'leasing' },
  {
    title: 'Production Suite',
    blurb: 'Full-service package: production, arrangement, mix, and master under one roof.',
    icon: 'suite',
  },
]

export const SPOTIFY_EMBED_URL = 'https://open.spotify.com/embed/artist/1rfSEaVxpWG8WXtL6Wj0SH'
export const SPOTIFY_ARTIST_ID =
  spotifyIdFromUrl(ARTIST_LINKS.find((l) => l.platform === 'spotify')?.url ?? '', 'artist') ?? ''

/** Person.sameAs: the artist links deduped, plus the Muso.ai profile. */
export const PERSON_SAME_AS = [...new Set([...ARTIST_LINKS.map((l) => l.url), MUSO_PROFILE_URL])]
