// v1 features/explore/mock/explore-mock-data.ts, verbatim except the em dash in MOCK_COMMUNITY[2].
// Placeholder data only; rendered only when its section flag is on.

export type ExploreNewsItem = { id: string; title: string; excerpt: string; date: string }
export type ExploreCommunityItem = { id: string; author: string; snippet: string; timeAgo: string }
export type ExploreProfile = { id: string; name: string; tagline: string }

export const MOCK_NEWS: ExploreNewsItem[] = [
  { id: '1', title: 'New pack drop', excerpt: 'Latest kit now available in the store.', date: 'Mar 8' },
  { id: '2', title: 'Producer spotlight', excerpt: 'Behind the scenes with our featured artist.', date: 'Mar 5' },
  { id: '3', title: 'Tips: mixing low end', excerpt: 'Quick guide to cleaner bass and kicks.', date: 'Mar 1' },
]

export const MOCK_COMMUNITY: ExploreCommunityItem[] = [
  { id: '1', author: 'ProducerA', snippet: 'That new pack is fire for 808s.', timeAgo: '2h ago' },
  { id: '2', author: 'BeatMaker', snippet: 'Anyone tried the vocal chops in the latest drop?', timeAgo: '5h ago' },
  { id: '3', author: 'StudioJ', snippet: 'Reward points just unlocked the discount. Copped.', timeAgo: '1d ago' },
]

export const MOCK_DISCOVERY_PROFILES: ExploreProfile[] = [
  { id: '1', name: 'Alex Beats', tagline: 'Producer · sound design' },
  { id: '2', name: 'Nova Sounds', tagline: 'Artist · vocals' },
  { id: '3', name: 'Echo Lab', tagline: 'Producer · mixing' },
  { id: '4', name: 'Cipher', tagline: 'Artist · beats' },
]
