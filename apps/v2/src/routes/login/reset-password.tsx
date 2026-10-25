import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Field, FormMessage, SubmitButton, fieldErrors, type FieldErrors } from '~/components/auth/form-bits'
import { updatePasswordFn } from '~/fns/auth.fn'
import { updatePasswordSchema } from '~/lib/auth-schemas'
import { useSession } from '~/lib/use-session'
import { SESSION_KEY } from '~/queries/session'

export const Route = createFileRoute('/login/reset-password')({
  head: () => ({ meta: [{ title: 'Choose a new password | Organic Sonics' }, { name: 'robots', content: 'noindex' }] }),
  component: ResetPassword,
})

function ResetPassword() {
  const session = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = updatePasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setPending(true)
    try {
      const result = await updatePasswordFn({ data: parsed.data })
      if (!result.ok) return setErrors({ form: result.error })
      queryClient.setQueryData(SESSION_KEY, null)
      await router.navigate({ to: '/login' })
    } catch {
      setErrors({ form: 'Your reset link has expired. Request a new one from the log in page.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="content-container section-wrapper flex max-w-md flex-col gap-6">
      <h1 className="text-h2">Choose a new password</h1>
      {session ? (
        <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field name="password" label="New password" type="password" autoComplete="new-password" error={errors.password} />
          <Field
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          {errors.form && <FormMessage tone="error">{errors.form}</FormMessage>}
          <SubmitButton pending={pending}>Save new password</SubmitButton>
        </form>
      ) : (
        <p>
          Open the reset link from your email to choose a new password, or{' '}
          <Link to="/login" className="link">request a new link</Link>.
        </p>
      )}
    </section>
  )
}
