import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// QueryClient and SSR query hydration are wired in phase 01.
export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
