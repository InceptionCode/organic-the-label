import type { ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ProductGrid, productGridClasses } from '~/components/product/product-grid'
import { hasActiveFilters, storeSearchToListParams, type StoreSearch } from '~/lib/store-search'
import { productQueries } from '~/queries/products'
import { Button, ButtonLink } from '~/ui/button'
import { cn } from '~/ui/cn'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'
const textLink = cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary hover:cursor-pointer', focusRing)

export function StoreResults({ search }: { search: StoreSearch }) {
  const { data } = useSuspenseQuery(productQueries.list(storeSearchToListParams(search)))
  const router = useRouter()
  const { products, pageInfo } = data
  const filtered = hasActiveFilters(search)

  if (products.length === 0) {
    return (
      <StoreMessage
        title={filtered ? 'No products match your filters.' : 'No products available at the moment.'}
        body={filtered ? 'Try adjusting your search or filters.' : 'Check back soon for new releases!'}
      >
        {filtered && (
          <Link to="/store" search={{}} resetScroll={false} className={cn(textLink, 'mt-6')}>
            Clear filters
          </Link>
        )}
      </StoreMessage>
    )
  }

  return (
    <>
      <ProductGrid products={products} />
      <div className="hairline-t mt-16 flex min-h-16 flex-wrap items-center justify-between gap-x-8 gap-y-2 pt-4">
        <p className="text-label">
          Showing {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
        {(search.after || (pageInfo.hasNextPage && pageInfo.endCursor)) && (
          <nav aria-label="Pagination" className="flex items-center gap-8">
            {search.after && (
              <button type="button" onClick={() => router.history.back()} className={textLink}>
                Previous page
              </button>
            )}
            {pageInfo.hasNextPage && pageInfo.endCursor && (
              <Link to="/store" search={{ ...search, after: pageInfo.endCursor }} preload="intent" className={textLink}>
                Next page
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  )
}

function StoreMessage({ title, body, tone = 'neutral', children }: { title: string; body: string; tone?: 'neutral' | 'error'; children?: ReactNode }) {
  return (
    <div className="flex min-h-[40dvh] flex-col items-start justify-center py-16" role={tone === 'error' ? 'alert' : undefined}>
      <p className={cn('mb-3 max-w-[22ch] text-display-m', tone === 'error' ? 'text-[color:var(--accent-text)]' : 'text-primary')}>{title}</p>
      <p className="text-body-m text-secondary">{body}</p>
      {children}
    </div>
  )
}

export function StoreError() {
  const router = useRouter()
  return (
    <StoreMessage tone="error" title="Failed to load products" body="Please try refreshing the page or contact support if the problem persists.">
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => void router.invalidate()}>Try again</Button>
        <ButtonLink to="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
    </StoreMessage>
  )
}

export function StoreResultsSkeleton() {
  return (
    <div role="status" aria-label="Loading products" className={productGridClasses}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={i >= 4 ? 'hidden md:block' : undefined}>
          <div className="aspect-[3/4] animate-pulse bg-surface-1 motion-reduce:animate-none" />
          <div className="mt-4 flex justify-between gap-3">
            <div className="h-5 w-2/3 animate-pulse rounded-[2px] bg-surface-2 motion-reduce:animate-none" />
            <div className="h-5 w-12 animate-pulse rounded-[2px] bg-surface-2 motion-reduce:animate-none" />
          </div>
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded-[2px] bg-surface-2 motion-reduce:animate-none" />
          <div className="mt-4 h-10 w-full animate-pulse rounded-[2px] bg-surface-2 motion-reduce:animate-none md:w-32" />
        </div>
      ))}
      <span className="sr-only">Loading products</span>
    </div>
  )
}
