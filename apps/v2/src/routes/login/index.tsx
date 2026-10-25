import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { CaptchaNotice, captchaFailedMessage, useInvisibleCaptcha } from '~/components/auth/captcha'
import { Field, FormMessage, SubmitButton, fieldErrors, type FieldErrors } from '~/components/auth/form-bits'
import { requestPasswordResetFn, sendMagicLinkFn, signInWithPasswordFn } from '~/fns/auth.fn'
import { emailFieldsSchema, signInFieldsSchema } from '~/lib/auth-schemas'
import { SESSION_KEY } from '~/queries/session'

export const Route = createFileRoute('/login/')({
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/explore' })
  },
  head: () => ({ meta: [{ title: 'Log in | Organic Sonics' }] }),
  component: Login,
})

type Mode = 'password' | 'magic' | 'reset'

function Login() {
  const [mode, setMode] = useState<Mode>('password')
  return (
    <section className="content-container section-wrapper flex max-w-md flex-col gap-6">
      <h1 className="text-h2">Log in</h1>
      {mode === 'password' ? <PasswordForm /> : <EmailLinkForm key={mode} mode={mode} />}
      <div className="flex flex-wrap gap-4">
        {mode !== 'password' && (
          <button type="button" className="link ring-focus" onClick={() => setMode('password')}>
            Log in with password
          </button>
        )}
        {mode !== 'magic' && (
          <button type="button" className="link ring-focus" onClick={() => setMode('magic')}>
            Email me a sign-in link
          </button>
        )}
        {mode !== 'reset' && (
          <button type="button" className="link ring-focus" onClick={() => setMode('reset')}>
            Forgot password?
          </button>
        )}
      </div>
      <p>
        New here? <Link to="/signup" className="link">Create an account</Link>
      </p>
      <CaptchaNotice />
    </section>
  )
}

function PasswordForm() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const captcha = useInvisibleCaptcha()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = signInFieldsSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setPending(true)
    try {
      let captchaToken: string
      try {
        captchaToken = await captcha.getToken()
      } catch (error) {
        return setErrors({ form: captchaFailedMessage(error) })
      }
      const result = await signInWithPasswordFn({ data: { ...parsed.data, captchaToken } })
      if (!result.ok) return setErrors({ form: result.error })
      queryClient.setQueryData(SESSION_KEY, result.user)
      await router.navigate({ to: '/explore' })
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field name="email" label="Email" type="email" autoComplete="email" error={errors.email} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" error={errors.password} />
      {captcha.element}
      {errors.form && <FormMessage tone="error">{errors.form}</FormMessage>}
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  )
}

function EmailLinkForm({ mode }: { mode: 'magic' | 'reset' }) {
  const captcha = useInvisibleCaptcha()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = emailFieldsSchema.safeParse({ email: new FormData(event.currentTarget).get('email') })
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setPending(true)
    try {
      let captchaToken: string
      try {
        captchaToken = await captcha.getToken()
      } catch (error) {
        return setErrors({ form: captchaFailedMessage(error) })
      }
      const send = mode === 'magic' ? sendMagicLinkFn : requestPasswordResetFn
      const result = await send({ data: { ...parsed.data, captchaToken } })
      if (!result.ok) setErrors({ form: result.error })
      else setSent(true)
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <FormMessage tone="success">
        Check your email. {mode === 'magic' ? 'The link signs you in.' : 'The link lets you choose a new password.'}
      </FormMessage>
    )
  }

  return (
    <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="text-h4">{mode === 'magic' ? 'Email me a sign-in link' : 'Reset your password'}</h2>
      <Field name="email" label="Email" type="email" autoComplete="email" error={errors.email} />
      {captcha.element}
      {errors.form && <FormMessage tone="error">{errors.form}</FormMessage>}
      <SubmitButton pending={pending}>{mode === 'magic' ? 'Send link' : 'Send reset link'}</SubmitButton>
    </form>
  )
}
