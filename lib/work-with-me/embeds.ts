/**
 * URL validators for the Work With Me page embeds.
 */

const SPOTIFY_EMBED_KINDS = ["track", "album", "artist", "playlist", "show", "episode"] as const;

/**
 * Accept a Spotify link and return its `open.spotify.com/embed/...` form.
 * Handles both a bare `open.spotify.com/artist/<id>` URL and one that already
 * points at `/embed/`. Returns null for anything that is not an https
 * open.spotify.com link with a known kind + id.
 */
export function spotifyEmbedSrc(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts[0] === "embed" ? 1 : 0;
    const kind = parts[embedIndex];
    const id = parts[embedIndex + 1];

    if (!kind || !id) return null;
    if (!SPOTIFY_EMBED_KINDS.includes(kind as (typeof SPOTIFY_EMBED_KINDS)[number])) return null;
    if (!/^[A-Za-z0-9]+$/.test(id)) return null;

    return `https://open.spotify.com/embed/${kind}/${id}`;
  } catch {
    return null;
  }
}

/**
 * Accept a Muso.ai profile/embed URL and return an iframe `src`, or null.
 * The exact embed path shape is unknown until a real profile exists, so the
 * allowlist is deliberately narrow: https on a `muso.ai` host only. Callers
 * always render a fallback link when this returns null.
 */
export function musoEmbedSrc(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!/(^|\.)muso\.ai$/.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
