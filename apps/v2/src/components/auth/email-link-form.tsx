import { useState, type FormEvent } from 'react'
import { requestPasswordResetFn, sendMagicLinkFn } from '~/fns/auth.fn'
import { emailFieldsSchema } from '~/lib/auth-schemas'
import { Field } from '~/ui/field'
import { captchaFailedMessage, useInvisibleCaptcha } from './captcha'
import { FormAlert, SubmitButton, useLiveValidation } from './form-bits'

const COPY = {
  magic: { submit: 'Send Magic Link', sent: 'Check your email for the magic link.' },
  reset: { submit: 'Send Reset Link', sent: 'Check your email for reset instructions.' },
} as const

/** Body of the "Sign in with magic link" and "Reset Password" dialogs on /login. */
export function EmailLinkForm({ mode }: { mode: 'magic' | 'reset' }) {
  const captcha = useInvisibleCaptcha()
  const form = useLiveValidation(emailFieldsSchema)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.submit(event.currentTarget)
    if (!data) return
    setPending(true)
    try {
      let captchaToken: string
      try {
        captchaToken = await captcha.getToken()
      } catch (error) {
        return form.setFormError(captchaFailedMessage(error))
      }
      const send = mode === 'magic' ? sendMagicLinkFn : requestPasswordResetFn
      const result = await send({ data: { ...data, captchaToken } })
      if (!result.ok) form.setFormError(result.error)
      else setSent(true)
    } catch {
      form.setFormError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form method="post" onSubmit={onSubmit} {...form.formProps} className="flex flex-col gap-4">
      {form.formError ? <FormAlert>{form.formError}</FormAlert> : null}
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={form.errors.email}
        readOnly={sent}
      />
      {captcha.element}
      {sent ? (
        <FormAlert tone="success">{COPY[mode].sent}</FormAlert>
      ) : (
        <SubmitButton pending={pending} className="mt-0">
          {COPY[mode].submit}
        </SubmitButton>
      )}
    </form>
  )
}
