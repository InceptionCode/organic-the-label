import { describe, expect, test } from 'bun:test'
import { buildRobotsTxt, isProductionEnv, xRobotsTag } from '~/server/seo/robots'
import { STATIC_SITEMAP_PATHS, buildSitemapXml, collectSitemapUrls, type SitemapSources } from '~/server/seo/sitemap'

const sources = (over: Partial<SitemapSources> = {}): SitemapSources => ({
  products: async () => [
    { handle: 'night-drive', updatedAt: '2026-07-19T02:46:20Z' },
    { handle: 'raw-pack', updatedAt: '2026-07-01T00:00:00Z' },
  ],
  compositionsLastmod: async () => '2026-08-14T18:30:00Z',
  freeResources: async () => [{ slug: 'starter-kit', updatedAt: null }],
  ...over,
})
const silent = { error: () => {} }

describe('buildSitemapXml', () => {
  test('valid urlset with loc and lastmod', () => {
    const xml = buildSitemapXml([{ path: '/' }, { path: '/store/a', lastmod: '2026-07-19T02:46:20Z' }])
    expect(xml).toMatchSnapshot()
  })

  test('escapes XML characters and dedupes', () => {
    const xml = buildSitemapXml([{ path: '/a?x=1&y=<2>' }, { path: '/a?x=1&y=<2>' }])
    expect(xml).toContain('<loc>https://organicsonics.com/a?x=1&amp;y=&lt;2&gt;</loc>')
    expect(xml.match(/<url>/g)).toHaveLength(1)
  })

  test('drops an unparseable lastmod', () => {
    expect(buildSitemapXml([{ path: '/', lastmod: 'nope' }])).not.toContain('<lastmod>')
  })

  test('caps at 50,000 URLs', () => {
    const urls = Array.from({ length: 50_010 }, (_, i) => ({ path: `/p/${i}` }))
    expect(buildSitemapXml(urls).match(/<url>/g)).toHaveLength(50_000)
  })
})

describe('collectSitemapUrls', () => {
  test('static pages, every product, free resources, and /compositions lastmod', async () => {
    const urls = await collectSitemapUrls(sources(), silent)
    expect(urls.map((u) => u.path)).toEqual([
      ...STATIC_SITEMAP_PATHS,
      '/store/night-drive',
      '/store/raw-pack',
      '/free/starter-kit',
    ])
    expect(urls.find((u) => u.path === '/compositions')?.lastmod).toBe('2026-08-14T18:30:00Z')
  })

  test('a failing part is omitted, not fatal', async () => {
    const errors: string[] = []
    const urls = await collectSitemapUrls(
      sources({ products: async () => { throw new Error('shopify down') } }),
      { error: (m: string) => errors.push(m) },
    )
    expect(urls.some((u) => u.path.startsWith('/store/'))).toBe(false)
    expect(urls.some((u) => u.path === '/free/starter-kit')).toBe(true)
    expect(errors).toEqual(['[sitemap] products omitted: shopify down'])
  })
})

describe('robots', () => {
  test('only VERCEL_ENV=production is production', () => {
    expect(isProductionEnv('production')).toBe(true)
    expect(isProductionEnv('preview')).toBe(false)
    expect(isProductionEnv('development')).toBe(false)
    expect(isProductionEnv(undefined)).toBe(false)
  })

  test('non-production disallows everything', () => {
    expect(buildRobotsTxt(false)).toBe('User-agent: *\nDisallow: /\n')
  })

  test('production rule set with the sitemap line', () => {
    expect(buildRobotsTxt(true)).toMatchSnapshot()
    expect(buildRobotsTxt(true)).toContain('Sitemap: https://organicsonics.com/sitemap.xml')
    expect(buildRobotsTxt(true)).not.toContain('Disallow: /\n')
  })

  test('X-Robots-Tag only off production', () => {
    expect(xRobotsTag(false)).toBe('noindex, nofollow')
    expect(xRobotsTag(true)).toBeNull()
  })
})
