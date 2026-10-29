// Site-wide SEO constants. head() also runs on the client, so the canonical origin is a hardcoded
// constant rather than the server-only SITE_URL. Previews canonicalize to production on purpose.
// Decided (2026-10-18): the apex domain is canonical; www 308s to it at cutover (phase 08).
export const SITE_NAME = 'Organic Sonics'
export const SITE_ORIGIN = 'https://organicsonics.com'

// v1 app/layout.tsx default description.
export const DEFAULT_DESCRIPTION =
  'Premium beats, drum kits, sample packs, and sound design for modern producers.'

export const DEFAULT_OG_IMAGE = {
  url: '/og/default.png',
  width: 1200,
  height: 630,
  alt: 'Organic Sonics logo on a dark background',
} as const

export const LOGO_PATH = '/brand-assets/organic-sonics-logo.png'
// Downscaled copies of the 1024px (1.7 MB) logo for on-page use and browser icons (phase 07.2).
// 128px covers the 40px navbar mark at 3x; 96px is the favicon (a multiple of 48 for search results);
// 192px covers the 180px apple-touch-icon.
export const LOGO_UI_PATH = '/brand-assets/organic-sonics-logo-128.png'
export const LOGO_FAVICON_PATH = '/brand-assets/organic-sonics-logo-96.png'
export const LOGO_ICON_PATH = '/brand-assets/organic-sonics-logo-192.png'

// Organization.sameAs: the brand's own profiles (confirmed by the owner 2026-10-26). YouTube main
// channel is @juicetheprod; @juiceman-theprod is the separate Shorts channel. No Twitter/X handle,
// so TWITTER_HANDLE is intentionally not defined.
export const SOCIAL_PROFILES: readonly string[] = [
  'https://open.spotify.com/artist/1rfSEaVxpWG8WXtL6Wj0SH',
  'https://music.apple.com/us/artist/juiceman/6788973192',
  'https://www.youtube.com/@juicetheprod',
  'https://www.instagram.com/youknowjuiceman/',
]

/** Make a root-relative path absolute against SITE_ORIGIN; absolute URLs pass through. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}
