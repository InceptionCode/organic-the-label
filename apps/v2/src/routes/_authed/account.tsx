import { createFileRoute } from '@tanstack/react-router'
import { AccountPage, AccountSkeleton } from '~/components/account/account-page'
import { ErrorPage } from '~/components/errors/error-page'
import { accountQueries } from '~/queries/account'
import { preferencesQueries } from '~/queries/preferences'
import { seo } from '~/seo/head'

export const Route = createFileRoute('/_authed/account')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent']],
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(accountQueries.summary()),
      context.queryClient.query(accountQueries.ownedProducts()),
      context.queryClient.query(accountQueries.ownedResources()),
      context.queryClient.query(preferencesQueries.current()),
    ])
  },
  // Private HTML: never cacheable by a CDN or shared cache (phase 07 caches anonymous HTML).
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  head: () =>
    seo({
      title: 'Account',
      description:
        'Manage your Organic Sonics account, your purchased sound kits and packs, and your email and personalization preferences.',
      path: '/account',
      noindex: true,
    }),
  pendingComponent: AccountSkeleton,
  errorComponent: ErrorPage,
  component: AccountPage,
})
