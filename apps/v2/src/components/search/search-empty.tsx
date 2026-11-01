import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ProductGrid } from '~/components/product/product-grid'
import { productQueries } from '~/queries/products'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'

const linkClasses =
  'inline-flex min-h-11 items-center rounded-sm text-body-m text-primary no-underline outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] active:opacity-70'

/** No `q`: one plain line plus the 4 newest products (the store's default list entry, no new query). */
export function SearchPrompt({ showProducts }: { showProducts: boolean }) {
  return (
    <div className="flex flex-col gap-14 md:gap-20">
      <p className="max-w-[48ch] text-body-l text-secondary">Find sample packs, kits, and compositions.</p>
      {showProducts && <NewestProducts />}
    </div>
  )
}

function NewestProducts() {
  const { products } = useSuspenseQuery(productQueries.list({ sort: 'newest' })).data
  if (products.length === 0) return null
  return (
    <section aria-labelledby="search-new-heading">
      <div className="mb-8 flex items-baseline justify-between gap-4 md:mb-10">
        <h2 id="search-new-heading" className="text-h1 text-primary">
          New arrivals
        </h2>
        <Link to="/store" className={linkClasses}>
          <span className="link-underline">View all</span>
        </Link>
      </div>
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  )
}

export function SearchNoResults({ q }: { q: string }) {
  return (
    <div className="hairline-t hairline-b flex flex-col items-start py-12 md:py-16">
      {/* The query stays in body text: Bebas would uppercase it and misquote what was typed. */}
      <h2 className="text-h2 text-primary">No results</h2>
      <p className="mt-3 max-w-[48ch] text-body-m text-secondary">
        Nothing matched <span className="text-primary">&ldquo;{q}&rdquo;</span>. Check the spelling, or try a genre, a sound, or a shorter phrase.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2">
        <Link to="/search" className={linkClasses}>
          <span className="link-underline">Clear search</span>
        </Link>
        <Link to="/store" className={linkClasses}>
          <span className="link-underline">Browse the store</span>
        </Link>
        <a href="/compositions" className={linkClasses}>
          <span className="link-underline">Explore compositions</span>
        </a>
      </div>
    </div>
  )
}

export function SearchError() {
  const router = useRouter()
  return (
    <div role="alert" className="hairline-t hairline-b flex flex-col items-start py-12 md:py-16">
      <h2 className="text-h2 text-primary">Search is unavailable right now</h2>
      <p className="mt-3 text-body-m text-secondary">Try again in a moment, or browse the store instead.</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Button size="lg" onClick={() => void router.invalidate()}>
          Try again
        </Button>
        <Link to="/" className={cn(linkClasses)}>
          <span className="link-underline">Back to home</span>
        </Link>
      </div>
    </div>
  )
}
