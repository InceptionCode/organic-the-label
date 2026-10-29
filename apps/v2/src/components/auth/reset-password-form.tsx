import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { updatePasswordFn } from '~/fns/auth.fn'
import { updatePasswordSchema } from '~/lib/auth-schemas'
import { SESSION_KEY } from '~/queries/session'
import { AuthCard } from './auth-card'
import { FormAlert, SubmitButton, textButtonClasses, useLiveValidation } from './form-bits'
import { PasswordField } from './password-field'

export function ResetPasswordForm() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useLiveValidation(updatePasswordSchema)
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.submit(event.currentTarget)
    if (!data) return
    setPending(true)
    try {
      const result = await updatePasswordFn({ data })
      if (!result.ok) return form.setFormError(result.error)
      // updatePasswordFn signed the recovery session out; sign in again with the new password.
      queryClient.setQueryData(SESSION_KEY, null)
      await router.navigate({ to: '/login', replace: true })
    } catch {
      form.setFormError('Your reset link has expired. Request a new one from the sign in page.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      eyebrow="Password recovery"
      title="SET NEW PASSWORD"
      footer={
        <>
          Remember your password?{' '}
          <Link to="/login" className={textButtonClasses('link', 'px-0')}>
            Back to sign in
          </Link>
        </>
      }
    >
      <form method="post" onSubmit={onSubmit} {...form.formProps} className="flex flex-col gap-4">
        {form.formError ? <FormAlert>{form.formError}</FormAlert> : null}
        <PasswordField name="password" label="Password" autoComplete="new-password" error={form.errors.password} />
        <PasswordField name="confirmPassword" label="Confirm Password" autoComplete="new-password" error={form.errors.confirmPassword} />
        <SubmitButton pending={pending}>Reset password</SubmitButton>
      </form>
    </AuthCard>
  )
}
