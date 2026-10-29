import type { ExploreFeatureFlags } from './explore-flags'

export type ExploreSectionId =
  | 'explore-hero'
  | 'explore-new-arrivals'
  | 'explore-compositions'
  | 'explore-free-resources'
  | 'explore-news'
  | 'explore-community'
  | 'explore-discovery'
  | 'explore-membership'
  | 'explore-email-signup'

export type ExploreSectionMetadata = {
  id: ExploreSectionId
  label: string
  /** null: always rendered (part of the anonymous default). */
  flagKey: keyof ExploreFeatureFlags | null
  /** v1 section_view_explore_* keys, kept as inert data (pages/explore.md open decision 1). */
  trackingKey: string | null
}

/** Render order. The data sections hide themselves when their source is empty or unavailable. */
export const EXPLORE_SECTIONS: readonly ExploreSectionMetadata[] = [
  { id: 'explore-hero', label: 'Explore hero', flagKey: null, trackingKey: 'section_view_explore_hero' },
  { id: 'explore-new-arrivals', label: 'New kits and packs', flagKey: null, trackingKey: 'section_view_explore_resources' },
  { id: 'explore-compositions', label: 'Free loops', flagKey: null, trackingKey: null },
  { id: 'explore-free-resources', label: 'Free resources', flagKey: null, trackingKey: null },
  { id: 'explore-news', label: 'News', flagKey: 'exploreNewsEnabled', trackingKey: 'section_view_explore_news' },
  { id: 'explore-community', label: 'Community', flagKey: 'exploreCommunityEnabled', trackingKey: 'section_view_explore_community' },
  { id: 'explore-discovery', label: 'Discovery', flagKey: 'exploreDiscoveryEnabled', trackingKey: 'section_view_explore_discovery' },
  { id: 'explore-membership', label: 'Membership', flagKey: null, trackingKey: 'section_view_explore_membership' },
  { id: 'explore-email-signup', label: 'Email signup', flagKey: 'exploreEmailSignupEnabled', trackingKey: 'section_view_explore_email_signup' },
]

export function visibleExploreSections(flags: ExploreFeatureFlags): ExploreSectionMetadata[] {
  return EXPLORE_SECTIONS.filter((s) => s.flagKey === null || flags[s.flagKey])
}
