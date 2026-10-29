import { useState, type ReactNode } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CompositionActions } from '~/components/compositions/composition-actions'
import { CompositionCard } from '~/components/compositions/composition-card'
import { ProductGrid, productGridClasses } from '~/components/product/product-grid'
import type { SearchType } from '~/lib/search-query'
import { searchQueries } from '~/queries/search'
import { cn } from '~/ui/cn'
import { SearchNoResults } from './search-empty'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function resultSummary(products: number, compositions: number, q: string, type?: SearchType): string {
  if (type === 'products') return `${plural(products, 'product', 'products')} for "${q}"`
  if (type === 'compositions') return `${plural(compositions, 'composition', 'compositions')} for "${q}"`
  return `${plural(products, 'product', 'products')} and ${plural(compositions, 'composition', 'compositions')} for "${q}"`
}

export function SearchResults({ q, type }: { q: string; type?: SearchType }) {
  const { products, compositions, partial } = useSuspenseQuery(searchQueries.results(q)).data
  // One composition video open at a time, inline under its row (no panel on search).
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null)
  const empty = products.length === 0 && compositions.length === 0
  const showProducts = type !== 'compositions'
  const showCompositions = type !== 'products'
  const filteredEmpty = !empty && ((type === 'products' && products.length === 0) || (type === 'compositions' && compositions.length === 0))

  return (
    <div className="flex flex-col gap-14 md:gap-20">
      {/* Still announced when empty, but not shown twice next to the no-results message. sr-only takes the
          block out of flow, so the column gap does not leave an empty band above the message. */}
      <div className={empty && !partial ? 'sr-only' : 'flex flex-col gap-6'}>
        {!empty && <TypeTabs q={q} type={type} products={products.length} compositions={compositions.length} />}
        <p aria-live="polite" className="text-label">
          {resultSummary(products.length, compositions.length, q, type)}
        </p>
        {partial && (
          <p role="status" className="text-body-s text-secondary">
            Some results could not be loaded. Try again.
          </p>
        )}
      </div>

      {empty && <SearchNoResults q={q} />}

      {filteredEmpty && (
        <p className="text-body-m text-secondary">
          No {type} for &ldquo;{q}&rdquo;.{' '}
          <Link to="/search" search={{ q }} className="link-underline text-primary">
            See all results
          </Link>
        </p>
      )}

      {showProducts && products.length > 0 && (
        <ResultGroup id="search-products-heading" title="Products" count={plural(products.length, 'product', 'products')}>
          <ProductGrid products={products} />
        </ResultGroup>
      )}

      {showCompositions && compositions.length > 0 && (
        <ResultGroup id="search-compositions-heading" title="Compositions" count={plural(compositions.length, 'loop', 'loops')}>
          {/* Two columns from xl only when there are 2+ loops; a single loop would leave half the row empty. */}
          <ul className={cn('hairline-b grid grid-cols-1', compositions.length > 1 && 'xl:grid-cols-2 xl:gap-x-12')}>
            {compositions.map((c) => {
              const watching = watchingSlug === c.slug
              return (
                <li key={c.id} className="hairline-t">
                  <CompositionCard
                    composition={c}
                    headingLevel="h3"
                    watching={watching}
                    onWatch={() => setWatchingSlug((open) => (open === c.slug ? null : c.slug))}
                    // Outline downloads; only the open row's is the red primary (the /compositions rule).
                    actions={<CompositionActions slug={c.slug} title={c.title} platform={c.platform} embedUrl={c.embed_url} primary={watching} />}
                  />
                </li>
              )
            })}
          </ul>
        </ResultGroup>
      )}
    </div>
  )
}

const TABS: { value: SearchType | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'compositions', label: 'Compositions' },
]

/**
 * Type filter, styled like the Store category tabs (muted -> bone, active = bone + 2px red underline).
 * Links that set `?type=` (absent = all), so back/forward and shared URLs keep the tab. Not sticky:
 * search results are short (two groups), so a pinned bar would only add chrome.
 */
function TypeTabs({ q, type, products, compositions }: { q: string; type?: SearchType; products: number; compositions: number }) {
  const counts = { all: products + compositions, products, compositions }
  return (
    <nav aria-label="Result type" className="hairline-b">
      <div className="no-scrollbar -ml-6 flex gap-6 overflow-x-auto pl-6 pr-8 md:-ml-1 md:pl-1 xl:gap-7">
        {TABS.map((tab) => {
          const active = type === tab.value
          return (
            <Link
              key={tab.label}
              to="/search"
              search={{ q, type: tab.value }}
              resetScroll={false}
              // Router active matching: "All" (type undefined) must not match ?type=products.
              activeOptions={{ includeSearch: true, explicitUndefined: true }}
              className={cn(
                'relative flex h-14 flex-none items-center whitespace-nowrap rounded-sm text-[0.9375rem] font-medium transition-colors duration-150 active:opacity-70',
                'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-[color:var(--accent-primary)] after:transition-transform after:duration-200 after:ease-[var(--ease-spring)]',
                'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)]',
                active ? 'text-primary after:scale-x-100' : 'text-muted hover:text-primary after:scale-x-0',
              )}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums text-muted">({counts[tab.value ?? 'all']})</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function ResultGroup({ id, title, count, children }: { id: string; title: string; count: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-8 flex items-baseline justify-between gap-4 md:mb-10">
        <h2 id={id} className="text-h1 text-primary">
          {title}
        </h2>
        <p className="text-label">{count}</p>
      </div>
      {children}
    </section>
  )
}

export function SearchResultsSkeleton() {
  return (
    <div role="status" aria-label="Loading results" className="flex flex-col gap-8">
      <div className="h-5 w-56 animate-pulse bg-surface-2 motion-reduce:animate-none" />
      <div className={productGridClasses}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={i >= 2 ? 'max-md:hidden' : undefined}>
            <div className="aspect-[3/4] animate-pulse bg-surface-1 motion-reduce:animate-none" />
            <div className="mt-4 h-5 w-3/4 animate-pulse bg-surface-2 motion-reduce:animate-none" />
            <div className="mt-2 h-4 w-1/3 animate-pulse bg-surface-2 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading results</span>
    </div>
  )
}
