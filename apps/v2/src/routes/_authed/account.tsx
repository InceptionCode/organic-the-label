import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '~/lib/use-session'

// Placeholder until the account page is built in phase 05.
export const Route = createFileRoute('/_authed/account')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
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
