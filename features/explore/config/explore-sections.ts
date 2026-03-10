/**
 * Centralized section metadata for Explore. Single source for section id, label, and flag key;
 * use for rendering, a11y, and future analytics/tracking.
 */

import type { ExploreFeatureFlags } from './explore-feature-flags';

export type ExploreSectionConfig = {
  id: string;
  label: string;
  flagKey: keyof ExploreFeatureFlags;
  trackingKey?: string;
};

/** Section registry: order and metadata for all gated sections (excludes explorePageEnabled). */
export const EXPLORE_SECTIONS: ExploreSectionConfig[] = [
  { id: 'explore-hero', label: 'Hero', flagKey: 'exploreHeroEnabled', trackingKey: 'section_view_explore_hero' },
  { id: 'explore-email-signup', label: 'Email signup', flagKey: 'exploreEmailSignupEnabled', trackingKey: 'section_view_explore_email_signup' },
  { id: 'explore-membership', label: 'Membership upsell', flagKey: 'exploreMembershipEnabled', trackingKey: 'section_view_explore_membership' },
  { id: 'explore-news', label: 'News', flagKey: 'exploreNewsEnabled', trackingKey: 'section_view_explore_news' },
  { id: 'explore-community', label: 'Community', flagKey: 'exploreCommunityEnabled', trackingKey: 'section_view_explore_community' },
  { id: 'explore-discovery', label: 'Discovery', flagKey: 'exploreDiscoveryEnabled', trackingKey: 'section_view_explore_discovery' },
  { id: 'explore-resources', label: 'Resources', flagKey: 'exploreResourcesEnabled', trackingKey: 'section_view_explore_resources' },
];
