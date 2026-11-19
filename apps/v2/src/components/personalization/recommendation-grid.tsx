import { useEffect, useRef, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductCard } from '~/components/product/product-card'
import type { RecommendationSlot } from '~/lib/recommendation-slots'
import { track } from '~/lib/track'
import { useSession } from '~/lib/use-session'
import { personalizationQueries } from '~/queries/personalization'
import type { Recommendations } from '~/server/personalization/recommendations'
import type { ProductSummary } from '~/server/shopify/types'
import { cn } from '~/ui/cn'

const emptyKey = (slot: RecommendationSlot) => `recommendations-empty:${slot}`

function rememberEmpty(slot: RecommendationSlot, empty: boolean) {
  try {
    if (empty) localStorage.setItem(emptyKey(slot), '1')
    else localStorage.removeItem(emptyKey(slot))
  } catch {
    // Storage blocked: the skeleton just shows and collapses.
  }
}

/**
 * One slot's recommendations. `hidden`: nothing to render (signed out, nothing to show, or the call
 * failed). `loading` also holds during the server render for signed-in users, because the query only
 * ever runs in the browser. Anonymous visitors make no request.
 */
export function useRecommendations(slot: RecommendationSlot): { status: 'hidden' } | { status: 'loading' } | { status: 'ready'; data: Recommendations } {
  const session = useSession()
  const query = useQuery({ ...personalizationQueries.recommendations(slot), enabled: !!session })
  const empty = query.data ? query.data.products.length === 0 : null
  useEffect(() => {
    if (empty !== null) rememberEmpty(slot, empty)
  }, [slot, empty])
  if (!session) return { status: 'hidden' }
  if (query.isPending) return { status: 'loading' }
  if (query.isError || query.data.products.length === 0) return { status: 'hidden' }
  return { status: 'ready', data: query.data }
}

/**
 * Hiding the fourth item keeps a single row at the three-column widths. A hidden item is never in
 * view, so it records no offer_viewed.
 */
const itemClass = (rank: number, threeColumns: string) => cn('flex flex-col', rank === 4 && threeColumns)

function OfferItem({
  product,
  slot,
  rank,
  source,
  className,
}: {
  product: ProductSummary
  slot: RecommendationSlot
  rank: number
  source: Recommendations['source']
  className: string
}) {
  const ref = useRef<HTMLLIElement>(null)
  const viewed = useRef(false)
  const properties = { slot, productId: product.id, rank, source }

  useEffect(() => {
    const el = ref.current
    if (!el || viewed.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (viewed.current || !entries.some((e) => e.isIntersecting)) return
        viewed.current = true
        observer.disconnect()
        track('offer_viewed', { slot, productId: product.id, rank, source })
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [slot, product.id, rank, source])

  return (
    <li ref={ref} className={className}>
      <ProductCard product={product} onLinkFollow={() => track('offer_clicked', properties)} />
    </li>
  )
}

export function RecommendationGrid({
  slot,
  data,
  gridClassName,
  threeColumnsClassName,
}: {
  slot: RecommendationSlot
  data: Recommendations
  gridClassName: string
  /** Hides the fourth item at the widths where this grid has three columns. */
  threeColumnsClassName: string
}) {
  return (
    <ul data-testid="recommendations-grid" className={gridClassName}>
      {data.products.map((product, i) => (
        <OfferItem
          key={product.id}
          product={product}
          slot={slot}
          rank={i + 1}
          source={data.source}
          className={itemClass(i + 1, threeColumnsClassName)}
        />
      ))}
    </ul>
  )
}

const bar = 'animate-pulse bg-surface-2 motion-reduce:animate-none rounded-[2px]'

/** Same grid and flat shape as the real cards, so the swap does not move the page. Hidden from assistive tech. */
export function RecommendationCardsSkeleton({ gridClassName, threeColumnsClassName }: { gridClassName: string; threeColumnsClassName: string }) {
  return (
    <div aria-hidden className={gridClassName}>
      {[1, 2, 3, 4].map((rank) => (
        <div key={rank} className={itemClass(rank, threeColumnsClassName)}>
          <div className="aspect-[3/4] animate-pulse bg-surface-1 motion-reduce:animate-none" />
          <div className="mt-4 flex justify-between gap-3">
            <div className={cn(bar, 'h-[27px] w-2/3')} />
            <div className={cn(bar, 'h-6 w-12')} />
          </div>
          <div className={cn(bar, 'mt-1 h-5 w-1/3')} />
          <div className={cn(bar, 'mt-4 h-10 w-full md:w-32')} />
        </div>
      ))}
    </div>
  )
}

export const skeletonBar = bar

/**
 * The server-rendered placeholder. Someone with nothing to show (turned off, or no favorites and no
 * activity yet) would otherwise watch the page jump on every load when it collapses, so when the last
 * answer on this browser was empty, this hides the space before first paint. The inline script only
 * exists in signed-in HTML. A wrong guess costs one jump and corrects itself.
 */
export function RecommendationsPlaceholder({ slot, className, children }: { slot: RecommendationSlot; className: string; children: ReactNode }) {
  const hideIfEmpty = `try{if(localStorage.getItem(${JSON.stringify(emptyKey(slot))}))document.currentScript.previousElementSibling.style.display="none"}catch(e){}`
  return (
    <>
      <div data-testid="recommendations-skeleton" className={className} suppressHydrationWarning>
        {children}
      </div>
      <script dangerouslySetInnerHTML={{ __html: hideIfEmpty }} />
    </>
  )
}
