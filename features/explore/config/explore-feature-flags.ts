/**
 * Explore page feature flags. All default to false so only the Coming Soon state shows until explicitly enabled.
 * Enable via NEXT_PUBLIC_* env vars (e.g. NEXT_PUBLIC_EXPLORE_PAGE_ENABLED=true).
 */

export type ExploreFeatureFlags = {
  explorePageEnabled: boolean;
  exploreHeroEnabled: boolean;
  exploreEmailSignupEnabled: boolean;
  exploreMembershipEnabled: boolean;
  exploreNewsEnabled: boolean;
  exploreCommunityEnabled: boolean;
  exploreDiscoveryEnabled: boolean;
  exploreResourcesEnabled: boolean;
};

export const exploreFeatureFlags: ExploreFeatureFlags = {
  explorePageEnabled: process.env.NEXT_PUBLIC_EXPLORE_PAGE_ENABLED === 'true',
  exploreHeroEnabled: process.env.NEXT_PUBLIC_EXPLORE_HERO_ENABLED === 'true',
  exploreEmailSignupEnabled: process.env.NEXT_PUBLIC_EXPLORE_EMAIL_SIGNUP_ENABLED === 'true',
  exploreMembershipEnabled: process.env.NEXT_PUBLIC_EXPLORE_MEMBERSHIP_ENABLED === 'true',
  exploreNewsEnabled: process.env.NEXT_PUBLIC_EXPLORE_NEWS_ENABLED === 'true',
  exploreCommunityEnabled: process.env.NEXT_PUBLIC_EXPLORE_COMMUNITY_ENABLED === 'true',
  exploreDiscoveryEnabled: process.env.NEXT_PUBLIC_EXPLORE_DISCOVERY_ENABLED === 'true',
  exploreResourcesEnabled: process.env.NEXT_PUBLIC_EXPLORE_RESOURCES_ENABLED === 'true',
};
