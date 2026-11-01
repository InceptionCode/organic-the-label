import { createFileRoute } from '@tanstack/react-router'
import { ExploreShell } from '~/components/explore/explore-shell'
import { useTrackOnMount } from '~/lib/use-track-on-mount'
import { accountQueries } from '~/queries/account'
import { exploreQueries } from '~/queries/explore'
import { productQueries } from '~/queries/products'
import { seo } from '~/seo/head'
import { CDN_TAG, publicPageHeaders } from '~/server/http/cache-headers'

// Landing page for every sign-in completion, and indexable: the SSR render is the anonymous
// default with real catalog content (pages/explore.md, decided 2026-10-26). Each source is
// optional; a failed or empty one hides only its own section and the page stays 200.
export const Route = createFileRoute('/explore')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: () => publicPageHeaders([CDN_TAG.products, CDN_TAG.compositions, CDN_TAG.freeResources]),
  loader: async ({ context }) => {
    const qc = context.queryClient
    const [products, compositions, freeResources] = await Promise.allSettled([
      qc.query(productQueries.list({ sort: 'newest' })),
      qc.query(exploreQueries.recentCompositions()),
      qc.query(exploreQueries.freeResources()),
      // Signed in only: the profile's display_name for the header greeting. Crawlers never send a
      // session, so their HTML stays the anonymous default.
      context.session ? qc.query(accountQueries.summary()) : null,
    ])
    return {
      available: {
        products: products.status === 'fulfilled' && products.value.products.length > 0,
        compositions: compositions.status === 'fulfilled' && compositions.value.length > 0,
        freeResources: freeResources.status === 'fulfilled' && freeResources.value.length > 0,
      },
    }
  },
  head: () =>
    seo({
      title: 'Explore',
      description:
        'Explore what is new at Organic Sonics: the latest kits and packs, free loops you can download with their terms, and free resources for producers.',
      path: '/explore',
    }),
  component: ExplorePage,
})

function ExplorePage() {
  const { available } = Route.useLoaderData()
  useTrackOnMount('explore_viewed')
  return <ExploreShell available={available} />
}
