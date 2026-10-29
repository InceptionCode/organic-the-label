// Port of v1 lib/composition/embed-url.ts. Shared by the composition social embed and work-with-me.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

/**
 * YouTube video id from a full URL (watch, youtu.be, /shorts/, /embed/) or a bare id. Null unless
 * the result is a strict 11-character id, so nothing unexpected reaches an iframe `src`.
 */
export function youtubeIdFromUrl(raw: string): string | null {
  const value = raw.trim()
  if (YOUTUBE_ID.test(value)) return value
  try {
    const url = new URL(value)
    let candidate: string | null
    if (url.hostname === 'youtu.be') candidate = url.pathname.slice(1)
    else if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) candidate = url.pathname.split('/')[2] ?? null
    else candidate = url.searchParams.get('v')
    return candidate && YOUTUBE_ID.test(candidate) ? candidate : null
  } catch {
    return null
  }
}

/**
 * The `/embed/` iframe URL for an Instagram permalink. Only `https://` links on an instagram.com
 * host with `/p/`, `/reel/` or `/tv/`; anything else is null so the caller falls back to a link.
 */
export function instagramEmbedSrc(raw: string): string | null {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:' || !/(^|\.)instagram\.com$/.test(url.hostname)) return null
    const match = url.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
    if (!match) return null
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`
  } catch {
    return null
  }
}

/** Only http(s) hrefs leave the site from user-editable content. */
export function safeExternalHref(raw: string): string | undefined {
  return /^https?:\/\//i.test(raw.trim()) ? raw.trim() : undefined
}
