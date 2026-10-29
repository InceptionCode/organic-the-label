import { createFileRoute } from '@tanstack/react-router'
import { AuthCard } from '~/components/auth/auth-card'
import { confirmOtpFn } from '~/fns/auth.fn'
import { confirmSearchSchema } from '~/lib/auth-schemas'
import { seo } from '~/seo/head'
import { ButtonLink } from '~/ui/button'

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
    <AuthCard eyebrow="Email link" title="LINK EXPIRED">
      <p className="text-body-m text-secondary">
        This link has expired or was already used. Sign in to request a new one.
      </p>
      <ButtonLink to="/login" className="w-full">
        Go to sign in
      </ButtonLink>
    </AuthCard>
  )
}
