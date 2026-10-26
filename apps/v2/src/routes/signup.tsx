import { useState, type FormEvent } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useCheckboxCaptcha } from '~/components/auth/captcha'
import { Field, FormMessage, SubmitButton, fieldErrors, type FieldErrors } from '~/components/auth/form-bits'
import { signUpFn } from '~/fns/auth.fn'
import { signUpFieldsSchema } from '~/lib/auth-schemas'
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
  component: Signup,
})

function Signup() {
  const captcha = useCheckboxCaptcha()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = signUpFieldsSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    if (!captcha.token) return setErrors({ captchaToken: 'Please complete the CAPTCHA.' })
    setErrors({})
    setPending(true)
    try {
      const result = await signUpFn({ data: { ...parsed.data, captchaToken: captcha.token } })
      if (!result.ok) setErrors({ form: result.error })
      else setSent(true)
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      captcha.reset()
      setPending(false)
    }
  }

  return (
    <section className="content-container section-wrapper flex max-w-md flex-col gap-6">
      <h1 className="text-h2">Create an account</h1>
      {sent ? (
        <FormMessage tone="success">Check your email. Confirm your address to finish signing up.</FormMessage>
      ) : (
        <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field name="username" label="Username" autoComplete="username" error={errors.username} />
          <Field name="email" label="Email" type="email" autoComplete="email" error={errors.email} />
          <Field name="password" label="Password" type="password" autoComplete="new-password" error={errors.password} />
          <Field
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          {captcha.element}
          {errors.captchaToken && <FormMessage tone="error">{errors.captchaToken}</FormMessage>}
          {errors.form && <FormMessage tone="error">{errors.form}</FormMessage>}
          <SubmitButton pending={pending} disabled={!captcha.token}>Create account</SubmitButton>
        </form>
      )}
      <p>
        Already have an account? <Link to="/login" className="link">Log in</Link>
      </p>
    </section>
  )
}
