import { createFileRoute, Link } from '@tanstack/react-router'
import { SignOutButton } from '~/components/auth/sign-out-button'
import { useSession } from '~/lib/use-session'

// Placeholder landing for every sign-in completion until the explore page is built in phase 05.
export const Route = createFileRoute('/explore')({
  component: Explore,
})

function Explore() {
  const session = useSession()
  return (
    <section className="content-container section-wrapper flex flex-col gap-4">
      <h1 className="text-h2">Explore</h1>
      {session ? (
        <>
          <p data-testid="session-user">Signed in as {session.email}</p>
          <SignOutButton />
        </>
      ) : (
        <p data-testid="session-user">
          Not signed in. <Link to="/login" className="link">Log in</Link>
        </p>
      )}
    </section>
  )
}
