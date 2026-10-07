import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { User } from '~/lib/supabase/map-user'

export interface RouterContext {
  user: User | null
}

export function getRouter() {
  return createRouter({
    routeTree,
    context: { user: null } as RouterContext,
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
