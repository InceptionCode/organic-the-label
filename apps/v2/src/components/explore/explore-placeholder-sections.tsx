import { MOCK_COMMUNITY, MOCK_DISCOVERY_PROFILES, MOCK_NEWS } from './explore-mock-data'
import { ExploreSplit } from './explore-section-wrapper'
import type { ExploreSectionMetadata } from './explore-sections'

// v1 news, community, and discovery sections over mock data, shown only when their flag is on.
// Nothing here is clickable, so the rows have no hover state (pages/explore.md). Flat: hairline rows
// in the label-column layout, no cards.

export function ExploreNewsSection({ metadata }: { metadata: ExploreSectionMetadata }) {
  return (
    <ExploreSplit id={`${metadata.id}-heading`} title="RECENT NEWS FROM PRODUCERS & ARTISTS">
      <ul className="hairline-t" aria-label="News">
        {MOCK_NEWS.map((item) => (
          <li key={item.id} className="hairline-b">
            <article className="grid gap-x-8 gap-y-1 py-5 md:grid-cols-[8rem_minmax(0,1fr)] md:py-6">
              <p className="text-label tabular-nums">{item.date}</p>
              <div>
                <h3 className="text-h4 text-primary">{item.title}</h3>
                <p className="mt-1 text-body-s text-secondary">{item.excerpt}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </ExploreSplit>
  )
}

export function ExploreCommunitySection({ metadata }: { metadata: ExploreSectionMetadata }) {
  return (
    <ExploreSplit id={`${metadata.id}-heading`} title="COMMUNITY PULSE">
      <ul className="hairline-t" aria-label="Community">
        {MOCK_COMMUNITY.map((item) => (
          <li key={item.id} className="hairline-b py-5 md:py-6">
            <p className="max-w-[60ch] text-body-l text-primary">{item.snippet}</p>
            <p className="mt-2 text-label">
              {item.author} · {item.timeAgo}
            </p>
          </li>
        ))}
      </ul>
    </ExploreSplit>
  )
}

export function ExploreDiscoverySection({ metadata }: { metadata: ExploreSectionMetadata }) {
  return (
    <ExploreSplit id={`${metadata.id}-heading`} title="FIND PRODUCERS AND ARTISTS">
      <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="Producers and artists">
        {MOCK_DISCOVERY_PROFILES.map((p) => (
          <li key={p.id} className="hairline-t flex items-center gap-4 py-5">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-[2px] bg-surface-2 font-heading text-2xl leading-none text-primary"
            >
              {p.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <h3 className="text-h5 text-primary">{p.name}</h3>
              <p className="mt-0.5 text-label">{p.tagline}</p>
            </div>
          </li>
        ))}
      </ul>
    </ExploreSplit>
  )
}
