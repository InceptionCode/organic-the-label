import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignupForm } from '~/components/auth/signup-form'
import { seo } from '~/seo/head'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/explore' })
  },
  head: () =>
    seo({
      title: 'Create account',
      description:
        'Create a free Organic Sonics account to keep your purchases in one place, save your preferences, and get a personalized Explore page.',
      path: '/signup',
      noindex: true,
    }),
  component: SignupForm,
})
