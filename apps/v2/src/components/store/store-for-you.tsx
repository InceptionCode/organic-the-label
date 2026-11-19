import {
  RecommendationCardsSkeleton,
  RecommendationGrid,
  RecommendationsPlaceholder,
  skeletonBar,
  useRecommendations,
} from '~/components/personalization/recommendation-grid'
import { productGridClasses } from '~/components/product/product-grid'
import { cn } from '~/ui/cn'

// Same columns as the results below, so the two line up. Three columns from md until lg.
const THREE_COLUMNS = 'md:max-lg:hidden'
const SECTION = 'hairline-b mb-10 pb-12 pt-4 md:mb-14 md:pb-14'
const HEADER = 'mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8'

/**
 * The "For you" row above the results on the plain store (the route decides when). Signed-out visitors
 * get no markup and no request; an empty result collapses the row, heading and rule included.
 */
export function StoreForYou() {
  const recommendations = useRecommendations('store')
  if (recommendations.status === 'hidden') return null

  if (recommendations.status === 'loading') {
    return (
      <RecommendationsPlaceholder slot="store" className={SECTION}>
        <div aria-hidden className={HEADER}>
          <div className={cn(skeletonBar, 'h-[3rem] w-40')} />
          <div className={cn(skeletonBar, 'h-6 w-72 max-w-full')} />
        </div>
        <RecommendationCardsSkeleton gridClassName={productGridClasses} threeColumnsClassName={THREE_COLUMNS} />
      </RecommendationsPlaceholder>
    )
  }

  return (
    <section data-testid="recommendations" data-slot="store" aria-labelledby="store-for-you-heading" className={SECTION}>
      <div className={HEADER}>
        <h2 id="store-for-you-heading" className="text-h2 text-primary">
          FOR YOU
        </h2>
        <p className="text-body-s text-secondary">
          Picked from your favorites and what you browse and play here.{' '}
          <a
            href="/account#account-preferences"
            className="link-underline inline-flex min-h-11 items-center rounded-sm text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] active:opacity-70"
          >
            Change recommendations
          </a>
        </p>
      </div>
      <RecommendationGrid slot="store" data={recommendations.data} gridClassName={productGridClasses} threeColumnsClassName={THREE_COLUMNS} />
    </section>
  )
}
