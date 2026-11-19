import type { StoreSearch } from './store-search'

// Shared by the server function, the query and the slots. No server imports. Not imported by a route
// loader or the root route, so none of this reaches the entry chunk.

export const RECOMMENDATION_SLOTS = ['explore', 'store'] as const
export type RecommendationSlot = (typeof RECOMMENDATION_SLOTS)[number]

/** Products per slot. Fixed on the server, never read from the request. */
export const RECOMMENDATION_LIMIT = 4

/** The For you row only shows on the plain store: no filter, search, sort or cursor in the URL. */
export function isDefaultStoreView(search: StoreSearch): boolean {
  return !search.category && !search.tags && !search.exclusive && !search.sort && !search.search && !search.after
}
