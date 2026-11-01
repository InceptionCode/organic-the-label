import { createFileRoute } from '@tanstack/react-router'
import { getProductHandles } from '~/server/catalog/products'
import { getCompositionsLastmod } from '~/server/compositions/sitemap'
import { getFreeResourceSitemapEntries } from '~/server/free-resources/sitemap'
import { CDN_TAG } from '~/server/http/cache-headers'
import { buildSitemapXml, collectSitemapUrls } from '~/server/seo/sitemap'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const urls = await collectSitemapUrls({
          products: getProductHandles,
          compositionsLastmod: getCompositionsLastmod,
          freeResources: getFreeResourceSitemapEntries,
        })
        return new Response(buildSitemapXml(urls), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            // Purged with the pages when apps/api busts a family (phase 07.8).
            'Vercel-Cache-Tag': [CDN_TAG.products, CDN_TAG.compositions, CDN_TAG.freeResources].join(','),
          },
        })
      },
    },
  },
})
