// Embed URL helpers for the Work With Me page (port of v1 lib/work-with-me/embeds.ts plus v1's
// instagramEmbedSrc). Pure, shared by the server services and the client sections.

const SPOTIFY_EMBED_KINDS = ['track', 'album', 'artist', 'playlist', 'show', 'episode'] as const

function parse(raw: string): URL | null {
  try {
    return new URL(raw.trim())
  } catch {
    return null
  }
}

/** The handle (without "@") of a youtube.com/@handle URL, or null. */
export function youtubeHandleFromUrl(raw: string): string | null {
  const url = parse(raw)
  if (!url || !/(^|\.)youtube\.com$/.test(url.hostname)) return null
  const seg = url.pathname.split('/').filter(Boolean)[0] ?? ''
  if (!seg.startsWith('@')) return null
  const handle = seg.slice(1)
  return /^[A-Za-z0-9._-]+$/.test(handle) ? handle : null
}

/** The id of a given kind from a bare or /embed/ Spotify URL, or null. */
export function spotifyIdFromUrl(raw: string, kind: 'artist' | 'track' | 'album'): string | null {
  const url = parse(raw)
  if (!url || !/(^|\.)spotify\.com$/.test(url.hostname)) return null
  const parts = url.pathname.split('/').filter(Boolean)
  const idx = parts[0] === 'embed' ? 1 : 0
  if (parts[idx] !== kind) return null
  const id = parts[idx + 1]
  return id && /^[A-Za-z0-9]+$/.test(id) ? id : null
}

/** https open.spotify.com link of a known kind to its /embed/ form, else null. */
export function spotifyEmbedSrc(raw: string): string | null {
  const url = parse(raw)
  if (!url || url.protocol !== 'https:' || !/(^|\.)spotify\.com$/.test(url.hostname)) return null
  const parts = url.pathname.split('/').filter(Boolean)
  const idx = parts[0] === 'embed' ? 1 : 0
  const kind = parts[idx]
  const id = parts[idx + 1]
  if (!kind || !id || !(SPOTIFY_EMBED_KINDS as readonly string[]).includes(kind) || !/^[A-Za-z0-9]+$/.test(id)) return null
  return `https://open.spotify.com/embed/${kind}/${id}`
}

/** An instagram.com post, reel or tv URL to its /embed/ form, else null (v1 embed-url.ts). */
export function instagramEmbedSrc(raw: string): string | null {
  const url = parse(raw)
  if (!url || url.protocol !== 'https:' || !/(^|\.)instagram\.com$/.test(url.hostname)) return null
  const match = url.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed/` : null
}
