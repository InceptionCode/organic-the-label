import { Suspense } from 'react'
import { noop } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { AudioPreviews } from '~/components/product/audio-previews'
import { ProductGallery } from '~/components/product/product-gallery'
import { ProductInfo } from '~/components/product/product-info'
import { ProductPageSkeleton } from '~/components/product/product-page-skeleton'
import { ProductPurchase } from '~/components/product/product-purchase'
import { RelatedProducts, RelatedProductsSkeleton } from '~/components/product/related-products'
import { TrustBadges } from '~/components/product/trust-badges'
import { WhatsIncluded } from '~/components/product/whats-included'
import { productSeoDescription, productSeoTitle } from '~/lib/product-seo'
import { useTrackOnMount } from '~/lib/use-track-on-mount'
import { productQueries } from '~/queries/products'
import { seo } from '~/seo/head'
import { breadcrumbJsonLd, productJsonLd } from '~/seo/jsonld'
import { shopifyImageUrl } from '~/ui/shopify-image'
import { publicPageHeaders } from '~/server/http/cache-headers'

export const Route = createFileRoute('/store/$handle')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: publicPageHeaders,
  loader: async ({ context, params }) => {
    const product = await context.queryClient.query(productQueries.byHandle(params.handle))
    if (!product) throw notFound()
    // Related products stream in; never block the page on them.
    void context.queryClient.query(productQueries.list({ category: product.category, sort: 'newest' })).catch(noop)
    return { product }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { product } = loaderData
    const head = seo({
      title: productSeoTitle(product.title),
      description: productSeoDescription(product),
      path: `/store/${product.handle}`,
      image: product.image ? { url: shopifyImageUrl(product.image.url, 1200), alt: product.image.altText ?? product.title } : null,
      type: 'product',
    })
    const crumbs = [
      { name: 'Home', path: '/' },
      { name: 'Store', path: '/store' },
      { name: product.title, path: `/store/${product.handle}` },
    ]
    return { ...head, meta: [...head.meta, productJsonLd(product), breadcrumbJsonLd(crumbs)] }
  },
  pendingComponent: ProductPageSkeleton,
  component: ProductPage,
})

function ProductPage() {
  const { product } = Route.useLoaderData()
  useTrackOnMount('product_viewed', { handle: product.handle, productId: product.id })

  return (
    <div>
      {/* lg+: artwork and tracklist on the left, info and purchase sticky on the right. Below lg the DOM
          order reads gallery, info, purchase, trust line, tracklist. */}
      <div className="content-container pb-14 pt-6 md:pt-10 lg:pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
          <div className="min-w-0 lg:col-span-7 lg:row-start-1">
            <ProductGallery key={product.handle} title={product.title} featuredImage={product.image} images={product.images} />
          </div>
          <div className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-[calc(72px+2.5rem)] lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-start">
            <ProductInfo product={product} />
            <ProductPurchase key={product.handle} product={product} />
            <TrustBadges />
          </div>
          <AudioPreviews
            key={product.handle}
            previews={product.audioPreviews}
            handle={product.handle}
            productId={product.id}
            className="min-w-0 lg:col-span-7 lg:row-start-2 lg:pt-6"
          />
        </div>
      </div>
      <WhatsIncluded items={product.whatsIncluded} category={product.category} />
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts category={product.category} handle={product.handle} />
      </Suspense>
    </div>
  )
}
