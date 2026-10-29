import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CollectionHeader } from '~/components/store/collection-header'
import { StoreFilters } from '~/components/store/store-filters'
import { StoreError, StoreResults, StoreResultsSkeleton } from '~/components/store/store-results'
import { storeSearchToListParams, validateStoreSearch } from '~/lib/store-search'
import { useTrackOnMount } from '~/lib/use-track-on-mount'
import { productQueries } from '~/queries/products'
import { seo } from '~/seo/head'
import { breadcrumbJsonLd, productItemListJsonLd } from '~/seo/jsonld'
import { publicPageHeaders } from '~/server/http/cache-headers'

export const Route = createFileRoute('/store/')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: publicPageHeaders,
  validateSearch: validateStoreSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    try {
      const page = await context.queryClient.query(productQueries.list(storeSearchToListParams(deps)))
      return { error: false, items: page.products.map((p) => ({ handle: p.handle, title: p.title })) }
    } catch {
      // The page exists; the catalog is temporarily unavailable. Render the v1 error state (200).
      return { error: true, items: [] }
    }
  },
  head: ({ loaderData }) => {
    const head = seo({
      title: 'Store: Beats, Drum Kits and Sample Packs',
      description:
        'Shop beats, drum kits, sample packs, sound banks, and plugin presets from Organic Sonics. Instant downloads, new releases every week, and free sounds too.',
      path: '/store',
    })
    const jsonLd = [
      ...(loaderData?.items.length ? [productItemListJsonLd(loaderData.items)] : []),
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Store', path: '/store' },
      ]),
    ]
    return { ...head, meta: [...head.meta, ...jsonLd] }
  },
  pendingComponent: () => <StoreLayout results={<StoreResultsSkeleton />} />,
  component: StorePage,
})

function StorePage() {
  const { error } = Route.useLoaderData()
  const search = Route.useSearch()
  useTrackOnMount('store_viewed')
  return <StoreLayout results={error ? <StoreError /> : <StoreResults search={search} />} />
}

function StoreLayout({ results }: { results: ReactNode }) {
  const search = Route.useSearch()
  return (
    <>
      <CollectionHeader />
      <StoreFilters search={search} />
      <div className="content-container pb-16 pt-4 md:pb-24 md:pt-6">
        {/* Phase 09 personalization slot (v1 PersonalizedContent) goes here. */}
        {results}
      </div>
    </>
  )
}
