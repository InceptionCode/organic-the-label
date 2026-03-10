/**
 * Shared types for the Explore feature: section metadata, placeholder data shapes.
 */

/** Section identity and future analytics; passed to section wrapper and components. */
export type ExploreSectionMetadata = {
  id: string;
  label: string;
  trackingKey?: string;
};

/** Placeholder shape for news items. */
export type ExploreNewsItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  imageUrl?: string;
};

/** Placeholder shape for community/discussion items. */
export type ExploreCommunityItem = {
  id: string;
  author: string;
  snippet: string;
  timeAgo: string;
};

/** Placeholder shape for producer/artist discovery. */
export type ExploreProfile = {
  id: string;
  name: string;
  tagline: string;
  avatarUrl?: string;
};

/** Placeholder shape for kits/packs/resources. */
export type ExploreResourceItem = {
  id: string;
  title: string;
  category: string;
  price?: string;
  imageUrl?: string;
}
