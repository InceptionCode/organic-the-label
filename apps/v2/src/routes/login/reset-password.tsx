import { createFileRoute, redirect } from '@tanstack/react-router'
import { ResetPasswordForm } from '~/components/auth/reset-password-form'
import { isRecoverySessionFn } from '~/fns/auth.fn'
import { seo } from '~/seo/head'

export const Route = createFileRoute('/login/reset-password')({
  // The recovery link signs the user in through /auth/confirm. Only that recovery session (amr
  // 'recovery', under an hour old) may set a new password; an ordinary session goes to /login.
  // UX only: updatePasswordFn enforces the same rule.
  beforeLoad: async ({ context }) => {
    if (!context.session || !(await isRecoverySessionFn())) throw redirect({ to: '/login' })
  },
  head: () =>
    seo({
      title: 'Set new password',
      description:
        'Choose a new password for your Organic Sonics account after following the password recovery link we sent to your email address.',
      path: '/login/reset-password',
      noindex: true,
    }),
  component: ResetPasswordForm,
})
