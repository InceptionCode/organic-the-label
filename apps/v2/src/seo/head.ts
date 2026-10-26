import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_ORIGIN, absoluteUrl } from './site'

export type SeoImage = { url: string; width?: number | null; height?: number | null; alt?: string | null }

export type SeoInput = {
  /** Page title without the brand; omit for the plain brand title. */
  title?: string
  /** 120 to 160 characters. */
  description: string
  /** Path only: '/store/foo', no origin, no query. */
  path: string
  image?: SeoImage | null
  type?: 'website' | 'product' | 'article' | 'music.song'
  noindex?: boolean
}

export type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }

export type LinkTag = { rel: string; href: string }

// Trailing "| Organic Sonics", "- Organic Sonics", "– Organic Sonics" or "— Organic Sonics".
const BRAND_SUFFIX = new RegExp(`\\s*[|\\-\\u2013\\u2014]\\s*${SITE_NAME}\\s*$`, 'i')

/** Applies `%s | Organic Sonics` once, stripping any brand suffix the caller already added. */
export function formatTitle(title?: string | null): string {
  const bare = (title ?? '').replace(BRAND_SUFFIX, '').trim()
  if (!bare || bare.toLowerCase() === SITE_NAME.toLowerCase()) return SITE_NAME
  return `${bare} | ${SITE_NAME}`
}

/** Strips query and hash and guarantees a leading slash. */
function cleanPath(path: string): string {
  const bare = path.split(/[?#]/)[0] ?? '/'
  return bare.startsWith('/') ? bare : `/${bare}`
}

/**
 * Head builder for every leaf route. Returns the only canonical link a page emits (none when
 * noindex). Root and layout routes must never emit a canonical: TanStack concatenates links.
 */
export function seo(i: SeoInput): { meta: MetaTag[]; links: LinkTag[] } {
  const title = formatTitle(i.title)
  const url = `${SITE_ORIGIN}${cleanPath(i.path)}`
  const image = i.image?.url ? i.image : DEFAULT_OG_IMAGE
  const imageUrl = absoluteUrl(image.url)
  const imageAlt = image.alt || (i.title ? formatTitle(i.title) : SITE_NAME)

  const meta: MetaTag[] = [
    { title },
    { name: 'description', content: i.description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: i.description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: i.type ?? 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:image', content: imageUrl },
  ]
  // Emitted only when known; the root never sets dimensions, so nothing stale can leak through.
  if (image.width) meta.push({ property: 'og:image:width', content: String(image.width) })
  if (image.height) meta.push({ property: 'og:image:height', content: String(image.height) })
  meta.push(
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: i.description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: imageAlt },
  )
  if (i.noindex) meta.push({ name: 'robots', content: 'noindex, follow' })

  const links: LinkTag[] = i.noindex ? [] : [{ rel: 'canonical', href: url }]
  return { meta, links }
}
