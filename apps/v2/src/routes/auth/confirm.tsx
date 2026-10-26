import { createFileRoute, Link } from '@tanstack/react-router'
import { confirmOtpFn } from '~/fns/auth.fn'
import { confirmSearchSchema } from '~/lib/auth-schemas'
import { seo } from '~/seo/head'

export const Route = createFileRoute('/auth/confirm')({
  validateSearch: (search) => {
    const parsed = confirmSearchSchema.safeParse(search)
    return parsed.success ? parsed.data : {}
  },

  beforeLoad: async ({ search }) => {
    const result = await confirmOtpFn({ data: search })
    return { confirmFailed: !result.ok }
  },
  head: () =>
    seo({
      title: 'Confirm',
      description:
        'Confirm your email address to finish signing in to your Organic Sonics account and reach your kits, packs, and personalized Explore page.',
      path: '/auth/confirm',
      noindex: true,
    }),
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
