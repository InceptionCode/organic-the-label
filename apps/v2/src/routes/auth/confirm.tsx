import { createFileRoute, Link } from '@tanstack/react-router'
import { confirmOtpFn } from '~/fns/auth.fn'
import { confirmSearchSchema } from '~/lib/auth-schemas'

export const Route = createFileRoute('/auth/confirm')({
  validateSearch: (search) => {
    const parsed = confirmSearchSchema.safeParse(search)
    return parsed.success ? parsed.data : {}
  },

  beforeLoad: async ({ search }) => {
    const result = await confirmOtpFn({ data: search })
    return { confirmFailed: !result.ok }
  },
  head: () => ({ meta: [{ title: 'Confirm | Organic Sonics' }, { name: 'robots', content: 'noindex' }] }),
  component: ConfirmError,
})

function ConfirmError() {
  return (
    <section className="content-container section-wrapper flex max-w-md flex-col gap-4">
      <h1 className="text-h2">This link has expired or was already used</h1>
      <p>
        <Link to="/login" className="link">Go to log in</Link> to request a new one.
      </p>
    </section>
  )
}
