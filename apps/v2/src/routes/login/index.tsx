import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '~/components/auth/login-form'
import { seo } from '~/seo/head'

type LoginSearch = { redirect?: string }

export const Route = createFileRoute('/login/')({
  // Every sign-in lands on /explore (pages/auth.md open decision 1); `redirect` is carried, not used.
  validateSearch: (search: Record<string, unknown>): LoginSearch =>
    typeof search.redirect === 'string' && search.redirect.startsWith('/') ? { redirect: search.redirect } : {},
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/explore' })
  },
  head: () =>
    seo({
      title: 'Sign in',
      description:
        'Sign in to your Organic Sonics account to reach your purchased kits and packs, your preferences, and your personalized Explore page.',
      path: '/login',
      noindex: true,
    }),
  component: LoginForm,
})
