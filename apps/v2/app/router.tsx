import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { createQueryClient } from '~/lib/query-client'
import type { QueryClient } from '@tanstack/react-query'
import type { User } from '~/lib/supabase/map-user'

export interface RouterContext {
  user: User | null
  // A fresh QueryClient per SSR request; the single shared instance on the
  // client.  Route loaders call `context.queryClient.prefetchQuery(...)` to
  // warm the server-side cache before rendering.  The root route dehydrates
  // this and sends it to the client via HydrationBoundary.
  queryClient: QueryClient
}

export function getRouter() {
  return createRouter({
    routeTree,
    context: {
      user: null,
      queryClient: createQueryClient(),
    } as RouterContext,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
