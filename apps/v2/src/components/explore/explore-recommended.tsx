import {
  RecommendationCardsSkeleton,
  RecommendationGrid,
  RecommendationsPlaceholder,
  skeletonBar,
  useRecommendations,
} from '~/components/personalization/recommendation-grid'
import { cn } from '~/ui/cn'
import { ExploreSectionLink, ExploreSectionWrapper, ExploreSplit } from './explore-section-wrapper'
import type { ExploreSectionMetadata } from './explore-sections'

// The same columns as "New kits and packs" right below it.
const GRID = 'grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4'
const THREE_COLUMNS = 'md:max-xl:hidden'

export function ExploreRecommended({ metadata }: { metadata: ExploreSectionMetadata }) {
  const recommendations = useRecommendations('explore')
  if (recommendations.status === 'hidden') return null

  if (recommendations.status === 'loading') {
    return (
      <RecommendationsPlaceholder slot="explore" className="hairline-t section-y-standard">
        <div className="content-container">
          <div aria-hidden className="grid gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-3 lg:col-span-3">
              <div className={cn(skeletonBar, 'h-[2.375rem] w-3/4 lg:h-[7.25rem]')} />
              <div className={cn(skeletonBar, 'h-12 w-full max-w-[40ch]')} />
              <div className={cn(skeletonBar, 'h-11 w-40 lg:mt-2')} />
            </div>
            <div className="min-w-0 lg:col-span-9">
              <RecommendationCardsSkeleton gridClassName={GRID} threeColumnsClassName={THREE_COLUMNS} />
            </div>
          </div>
        </div>
      </RecommendationsPlaceholder>
    )
  }

  return (
    <div data-testid="recommendations" data-slot="explore">
      <ExploreSectionWrapper metadata={metadata} reveal={false}>
        <ExploreSplit
          id={`${metadata.id}-heading`}
          title="RECOMMENDED FOR YOU"
          intro="Picked from your favorites and what you browse and play here."
          action={<ExploreSectionLink href="/account#account-preferences">Change recommendations</ExploreSectionLink>}
        >
          <RecommendationGrid slot="explore" data={recommendations.data} gridClassName={GRID} threeColumnsClassName={THREE_COLUMNS} />
        </ExploreSplit>
      </ExploreSectionWrapper>
    </div>
  )
}
