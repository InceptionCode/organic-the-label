const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract a YouTube video id from a full URL (watch, youtu.be, /shorts/, /embed/)
 * or a bare id. Returns null unless the result is a strict 11-char id, so nothing
 * unexpected reaches the iframe `src`.
 */
export function youtubeIdFromUrl(raw: string): string | null {
  const value = raw.trim();
  if (YOUTUBE_ID.test(value)) return value;
  try {
    const url = new URL(value);
    let candidate: string | null = null;
    if (url.hostname === 'youtu.be') candidate = url.pathname.slice(1);
    else if (url.pathname.startsWith('/shorts/')) candidate = url.pathname.split('/')[2] ?? null;
    else if (url.pathname.startsWith('/embed/')) candidate = url.pathname.split('/')[2] ?? null;
    else candidate = url.searchParams.get('v');
    return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * Build the `/embed/` iframe URL for an Instagram permalink. Only accepts
 * `https://` links on an `instagram.com` host containing `/p/`, `/reel/` or
 * `/tv/` — everything else returns null so the caller can fall back to a link.
 */
export function instagramEmbedSrc(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || !/(^|\.)instagram\.com$/.test(url.hostname)) return null;
    const match = url.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`;
  } catch {
    return null;
  }
}
