import { createServerFn } from '@tanstack/react-start'
import { PLACEMENTS } from '~/lib/work-with-me-content'
import { getRecentPosts, getWorkWithMeSpotify, type RecentPostsData, type WorkWithMeSpotify } from '~/server/social/work-with-me'

// Both services return stable empty shapes on any upstream failure; the catch is a last guard so
// the page never errors because of a social API (pages/work-with-me.md, Route and data).

export const getWorkWithMeSpotifyFn = createServerFn({ method: 'GET' }).handler(async (): Promise<WorkWithMeSpotify> => {
  try {
    return await getWorkWithMeSpotify()
  } catch (error) {
    console.error('[workWithMe.spotify]', error instanceof Error ? error.message : error)
    return { artist: null, releases: [], placements: PLACEMENTS.map((p) => ({ ...p, artworkUrl: null })) }
  }
})

export const getRecentPostsFn = createServerFn({ method: 'GET' }).handler(async (): Promise<RecentPostsData> => {
  try {
    return await getRecentPosts()
  } catch (error) {
    console.error('[workWithMe.recentPosts]', error instanceof Error ? error.message : error)
    return { youtube: [], instagram: [] }
  }
})
