import type { ReactNode } from 'react'
import { createRootRouteWithContext, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { QueryClientProvider, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { ensureAnonVisitorFn } from '~/lib/auth/actions'
import { AuthProvider } from '~/lib/auth-context'
import type { RouterContext } from '../router'
import '../../styles/globals.css'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Organic Sonics' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  beforeLoad: async () => {
    const user = await ensureAnonVisitorFn()
    return { user }
  },
  component: RootComponent,
})

function RootComponent() {
  const { user, queryClient } = Route.useRouteContext()

  // dehydrate() is called here — after all child route loaders have run
  // and prefetched into queryClient.  The dehydrated state serialises the
  // server-populated cache; HydrationBoundary rehydrates it on the client
  // so components that call useQuery() with matching keys never see a
  // loading spinner on first render.
  const dehydratedState = dehydrate(queryClient)

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <AuthProvider initialUser={user}>
            <Outlet />
          </AuthProvider>
        </HydrationBoundary>
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
