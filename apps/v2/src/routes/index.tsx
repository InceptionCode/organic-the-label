import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { BrowseByType } from '~/components/home/browse-by-type'
import { EmailSignup } from '~/components/home/email-signup'
import { FeaturedKits } from '~/components/home/featured-kits'
import { Hero } from '~/components/home/hero'
import { LatestDrop } from '~/components/home/latest-drop'
import { Membership } from '~/components/home/membership'
import { useTrackOnMount } from '~/lib/use-track-on-mount'
import { productQueries } from '~/queries/products'
import { seo } from '~/seo/head'
import { RevealSection } from '~/ui/reveal-section'
import { CDN_TAG, publicPageHeaders } from '~/server/http/cache-headers'

// Same cache entry as /store with no params (compacted to { sort: 'newest' }), so either page warms the other.
const newest = () => productQueries.list({ sort: 'newest' })

export const Route = createFileRoute('/')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: () => publicPageHeaders([CDN_TAG.products]),
  loader: async ({ context }) => {
    try {
      const page = await context.queryClient.query(newest())
      return { hasProducts: page.products.length > 0 }
    } catch {
      // Shopify down: the page still renders (200) without the featured and latest-drop sections.
      return { hasProducts: false }
    }
  },
  head: () =>
    seo({
      title: 'Premium Sounds for Modern Producers',
      description:
        'Premium beats, drum kits, sample packs, sound banks, and presets for modern producers. Instant downloads, new drops weekly, and free resources to start.',
      path: '/',
    }),
  component: HomePage,
})

function HomePage() {
  const { hasProducts } = Route.useLoaderData()
  useTrackOnMount('homepage_viewed')
  return (
    <>
      {hasProducts ? <ProductSections /> : <Hero />}
      <RevealSection threshold={0.08} distance={32}>
        <BrowseByType />
      </RevealSection>
      <RevealSection threshold={0.08} distance={32}>
        <Membership />
      </RevealSection>
      <RevealSection threshold={0.08} distance={32}>
        <EmailSignup />
      </RevealSection>
    </>
  )
}

function ProductSections() {
  const { products } = useSuspenseQuery(newest()).data
  // The hero's waveform plays the latest drop's preview, so it renders with the product data.
  return (
    <>
      <Hero latest={products[0]} />
      <RevealSection threshold={0.08} distance={32}>
        <FeaturedKits products={products.slice(0, 8)} />
      </RevealSection>
      <RevealSection threshold={0.08} distance={24}>
        <LatestDrop product={products[0]} />
      </RevealSection>
    </>
  )
}
