import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { signUpFn } from '~/fns/auth.fn'
import { signUpFieldsSchema } from '~/lib/auth-schemas'
import { track } from '~/lib/track'
import { Field } from '~/ui/field'
import { AuthCard } from './auth-card'
import { useCheckboxCaptcha } from './captcha'
import { CheckEmailDialog } from './check-email-dialog'
import { FormAlert, SubmitButton, textButtonClasses, useLiveValidation } from './form-bits'
import { PasswordField } from './password-field'

export function SignupForm() {
  const captcha = useCheckboxCaptcha()
  const form = useLiveValidation(signUpFieldsSchema)
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.submit(event.currentTarget)
    if (!data) return
    if (!captcha.token) return form.setFormError('Please complete the CAPTCHA')
    setPending(true)
    try {
      const result = await signUpFn({ data: { ...data, captchaToken: captcha.token } })
      if (!result.ok) return form.setFormError(result.error)
      track('user_signed_up')
      setSentTo(data.email)
      setDialogOpen(true)
    } catch {
      form.setFormError('Something went wrong. Please try again.')
    } finally {
      captcha.reset()
      setPending(false)
    }
  }

  return (
    <AuthCard
      eyebrow="Join for free"
      title="CREATE ACCOUNT"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={textButtonClasses('link', 'px-0')}>
            Sign in here
          </Link>
        </>
      }
    >
      <form method="post" onSubmit={onSubmit} {...form.formProps} className="flex flex-col gap-4">
        {form.formError ? <FormAlert>{form.formError}</FormAlert> : null}
        <Field
          name="username"
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          hint={form.errors.username ? undefined : 'Periods, underscores, and hyphens are allowed'}
          error={form.errors.username}
        />
        <Field name="email" label="Email" type="email" autoComplete="email" inputMode="email" error={form.errors.email} />
        <PasswordField name="password" label="Password" autoComplete="new-password" error={form.errors.password} />
        <PasswordField name="confirmPassword" label="Confirm Password" autoComplete="new-password" error={form.errors.confirmPassword} />
        <div className="min-h-[144px] sm:min-h-[78px]">{captcha.element}</div>
        <SubmitButton pending={pending} disabled={!form.valid || !captcha.token}>
          Create account
        </SubmitButton>
      </form>
      {sentTo ? <CheckEmailDialog email={sentTo} open={dialogOpen} onClose={() => setDialogOpen(false)} /> : null}
    </AuthCard>
  )
}
