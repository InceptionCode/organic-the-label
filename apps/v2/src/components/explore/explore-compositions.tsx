import { useSuspenseQuery } from '@tanstack/react-query'
import { CompositionCard } from '~/components/compositions/composition-card'
import { exploreQueries } from '~/queries/explore'
import { ExploreSectionLink, ExploreSplit } from './explore-section-wrapper'
import type { ExploreSectionMetadata } from './explore-sections'

/**
 * Recent free loops (active compositions, newest first) in the shared composition card, stacked in
 * one column on the right of the label column (the card's own look comes from the compositions pass).
 */
export function ExploreCompositions({ metadata }: { metadata: ExploreSectionMetadata }) {
  const compositions = useSuspenseQuery(exploreQueries.recentCompositions()).data
  return (
    <ExploreSplit
      id={`${metadata.id}-heading`}
      title="FREE LOOPS"
      intro="Original loops from Instagram and YouTube. Preview here, then download the loop with its terms of use."
      action={<ExploreSectionLink href="/compositions">All loops</ExploreSectionLink>}
    >
      <ul className="hairline-b">
        {compositions.map((c) => (
          <li key={c.id} className="hairline-t py-6 md:py-8">
            <CompositionCard composition={c} headingLevel="h3" />
          </li>
        ))}
      </ul>
    </ExploreSplit>
  )
}
