/**
 * Flags for the /explore placeholder sections (v1 NEXT_PUBLIC_EXPLORE_* with the VITE_ prefix).
 * Public and non-secret; anything other than the exact string 'true' is off. Read straight from
 * import.meta.env (statically replaced by Vite on both builds) because env.client.ts is a
 * `*.client.*` module that import protection keeps out of the server bundle. v1's page, hero,
 * membership, and resources flags are gone: those sections are the always-on anonymous default
 * (decided 2026-10-26, pages/explore.md SEO section).
 */
export type ExploreFeatureFlags = {
  exploreNewsEnabled: boolean
  exploreCommunityEnabled: boolean
  exploreDiscoveryEnabled: boolean
  exploreEmailSignupEnabled: boolean
}

export const isFlagOn = (value: unknown) => value === 'true'

export const exploreFlags: ExploreFeatureFlags = {
  exploreNewsEnabled: isFlagOn(import.meta.env.VITE_EXPLORE_NEWS_ENABLED),
  exploreCommunityEnabled: isFlagOn(import.meta.env.VITE_EXPLORE_COMMUNITY_ENABLED),
  exploreDiscoveryEnabled: isFlagOn(import.meta.env.VITE_EXPLORE_DISCOVERY_ENABLED),
  exploreEmailSignupEnabled: isFlagOn(import.meta.env.VITE_EXPLORE_EMAIL_SIGNUP_ENABLED),
}
