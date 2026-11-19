import type { ReactNode } from 'react'
import { ExploreCompositions } from './explore-compositions'
import { ExploreEmailSignup } from './explore-email-signup'
import { exploreFlags } from './explore-flags'
import { ExploreFreeResources } from './explore-free-resources'
import { ExploreHeader } from './explore-header'
import { ExploreHero } from './explore-hero'
import { ExploreMembershipUpsell } from './explore-membership-upsell'
import { ExploreNewArrivals } from './explore-new-arrivals'
import { ExploreCommunitySection, ExploreDiscoverySection, ExploreNewsSection } from './explore-placeholder-sections'
import { ExploreRecommended } from './explore-recommended'
import { ExploreSectionWrapper } from './explore-section-wrapper'
import { visibleExploreSections, type ExploreSectionId, type ExploreSectionMetadata } from './explore-sections'

/** Which data sections have content (decided by the route loader; unavailable or empty sources hide). */
export type ExploreAvailability = { products: boolean; compositions: boolean; freeResources: boolean }

type Renderer = (m: ExploreSectionMetadata) => ReactNode

// The membership pitch is the page's single sand band; the hero sits flush under the header.
const variantFor = (id: ExploreSectionId) => (id === 'explore-hero' ? 'hero' : id === 'explore-membership' ? 'sand' : 'standard')

/**
 * The anonymous default render of /explore (what crawlers and signed-out visitors get): header,
 * hero, real new products, recent loops, free resources, membership. Flagged placeholder sections
 * slot in by registry order. Recommendations (phase 09) only ever add to this for signed-in users;
 * they render their own section because an empty result collapses all of it, spacing included.
 */
export function ExploreShell({ available }: { available: ExploreAvailability }) {
  const renderers: Record<ExploreSectionId, Renderer | null> = {
    'explore-hero': (m) => <ExploreHero metadata={m} />,
    'explore-recommended': null,
    'explore-new-arrivals': available.products ? (m) => <ExploreNewArrivals metadata={m} /> : null,
    'explore-compositions': available.compositions ? (m) => <ExploreCompositions metadata={m} /> : null,
    'explore-free-resources': available.freeResources ? (m) => <ExploreFreeResources metadata={m} /> : null,
    'explore-news': (m) => <ExploreNewsSection metadata={m} />,
    'explore-community': (m) => <ExploreCommunitySection metadata={m} />,
    'explore-discovery': (m) => <ExploreDiscoverySection metadata={m} />,
    'explore-membership': (m) => <ExploreMembershipUpsell metadata={m} />,
    'explore-email-signup': (m) => <ExploreEmailSignup metadata={m} />,
  }

  return (
    <div>
      <ExploreHeader />
      {visibleExploreSections(exploreFlags).map((m) => {
        if (m.id === 'explore-recommended') return <ExploreRecommended key={m.id} metadata={m} />
        const render = renderers[m.id]
        if (!render) return null
        return (
          <ExploreSectionWrapper key={m.id} metadata={m} variant={variantFor(m.id)}>
            {render(m)}
          </ExploreSectionWrapper>
        )
      })}
    </div>
  )
}
