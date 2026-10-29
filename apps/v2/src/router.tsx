import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'
import { ErrorPage } from './components/errors/error-page'
import { NotFoundPage } from './components/errors/not-found-page'
import { parseSearch, stringifySearch } from './lib/search-params'

export type RouterContext = { queryClient: QueryClient }

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    parseSearch,
    stringifySearch,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: ErrorPage,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
