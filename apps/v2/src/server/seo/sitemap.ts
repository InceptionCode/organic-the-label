import { SITE_ORIGIN } from '~/seo/site'

// Pure sitemap assembly. The route (routes/sitemap[.]xml.ts) injects the cached sources, so this
// module stays framework free and unit testable.

export type SitemapUrl = { path: string; lastmod?: string | null }

export type SitemapSources = {
  products: () => Promise<{ handle: string; updatedAt: string }[]>
  /** Newest posted_at across active compositions; null when there are none. */
  compositionsLastmod: () => Promise<string | null>
  freeResources: () => Promise<{ slug: string; updatedAt: string | null }[]>
}

/** Indexable pages that exist regardless of catalog data. */
export const STATIC_SITEMAP_PATHS = [
  '/',
  '/store',
  '/compositions',
  '/free',
  '/work-with-me',
  '/explore',
  '/contact',
  '/newsletter',
] as const

export const SITEMAP_URL_LIMIT = 50_000

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]!)

/** W3C datetime (what <lastmod> expects); null for anything unparseable. */
function toLastmod(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function buildSitemapXml(urls: SitemapUrl[], origin: string = SITE_ORIGIN): string {
  const seen = new Set<string>()
  const body: string[] = []
  for (const url of urls) {
    const loc = `${origin}${url.path}`
    if (seen.has(loc) || seen.size >= SITEMAP_URL_LIMIT) continue
    seen.add(loc)
    const lastmod = toLastmod(url.lastmod)
    body.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`,
    )
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...body,
    '</urlset>',
    '',
  ].join('\n')
}

/**
 * Collects every URL. A failing source is logged and left out so one upstream outage never takes
 * the whole sitemap down (getCached only stores successful, non-empty results).
 */
export async function collectSitemapUrls(
  sources: SitemapSources,
  logger: Pick<Console, 'error'> = console,
): Promise<SitemapUrl[]> {
  const [products, compositionsLastmod, freeResources] = await Promise.allSettled([
    sources.products(),
    sources.compositionsLastmod(),
    sources.freeResources(),
  ])
  const failed = (part: string, result: PromiseRejectedResult) => {
    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
    logger.error(`[sitemap] ${part} omitted: ${reason}`)
  }

  const urls: SitemapUrl[] = STATIC_SITEMAP_PATHS.map((path) => ({ path }))

  if (compositionsLastmod.status === 'fulfilled') {
    const entry = urls.find((u) => u.path === '/compositions')
    if (entry) entry.lastmod = compositionsLastmod.value
  } else failed('compositions', compositionsLastmod)

  if (products.status === 'fulfilled') {
    for (const p of products.value) urls.push({ path: `/store/${encodeURIComponent(p.handle)}`, lastmod: p.updatedAt })
  } else failed('products', products)

  if (freeResources.status === 'fulfilled') {
    for (const r of freeResources.value) urls.push({ path: `/free/${encodeURIComponent(r.slug)}`, lastmod: r.updatedAt })
  } else failed('free resources', freeResources)

  return urls
}
