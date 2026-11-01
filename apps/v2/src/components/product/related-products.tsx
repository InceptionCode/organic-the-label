import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { STORE_CATEGORIES, type StoreCategory } from '~/lib/store-search'
import { productQueries } from '~/queries/products'
import { cn } from '~/ui/cn'
import { ProductGrid } from './product-grid'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const pulse = 'animate-pulse bg-surface-1 motion-reduce:animate-none'

/** Home's featured-kits language: label column ("You might also like", "View all"), cards to the right. */
export function RelatedProducts({ category, handle }: { category: string; handle: string }) {
  const { data } = useSuspenseQuery(productQueries.list({ category, sort: 'newest' }))
  const products = data.products.filter((p) => p.handle !== handle).slice(0, 4)
  if (products.length === 0) return null
  const storeCategory = (STORE_CATEGORIES as readonly string[]).includes(category) ? (category as StoreCategory) : undefined

  return (
    <section aria-labelledby="related-heading" className="section-y-standard hairline-t">
      <div className="content-container grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="flex items-end justify-between gap-6 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start">
          <h2 id="related-heading" className="text-h1 text-primary">
            YOU MIGHT ALSO LIKE
          </h2>
          <Link
            to="/store"
            search={storeCategory ? { category: storeCategory } : {}}
            className={cn('link-underline inline-flex min-h-11 shrink-0 items-center rounded-sm text-body-s text-primary', focusRing)}
          >
            View all
          </Link>
        </div>
        <div className="lg:col-span-9">
          {/* Nine columns wide here, so the store's 5-column step at 2xl would make cards too small. */}
          <ProductGrid products={products} className="2xl:grid-cols-4" />
        </div>
      </div>
    </section>
  )
}

export function RelatedProductsSkeleton() {
  return (
    <div className="section-y-standard hairline-t" role="status" aria-label="Loading related products">
      <div className="content-container grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className={cn('h-10 w-56 lg:col-span-3', pulse)} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:col-span-9 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={i > 1 ? 'hidden md:block' : undefined}>
              <div className={cn('aspect-[3/4]', pulse)} />
              <div className={cn('mt-4 h-4 w-3/4', pulse)} />
              <div className={cn('mt-2 h-3 w-1/2', pulse)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
