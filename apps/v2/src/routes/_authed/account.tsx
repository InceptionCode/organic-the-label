import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '~/lib/use-session'
import { seo } from '~/seo/head'

// Placeholder until the account page is built in phase 05.
export const Route = createFileRoute('/_authed/account')({
  head: () =>
    seo({
      title: 'Account',
      description:
        'Manage your Organic Sonics account, your purchased sound kits and packs, and your email and personalization preferences.',
      path: '/account',
      noindex: true,
    }),
  component: Account,
})

function Account() {
  const session = useSession()
  return (
    <section className="content-container section-wrapper">
      <h1 className="text-h2">Account</h1>
      <p data-testid="account-email">{session?.email}</p>
    </section>
  )
}
