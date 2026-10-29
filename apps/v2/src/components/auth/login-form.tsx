import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { signInWithPasswordFn } from '~/fns/auth.fn'
import { signInFieldsSchema } from '~/lib/auth-schemas'
import { SESSION_KEY } from '~/queries/session'
import { Field } from '~/ui/field'
import { AuthCard } from './auth-card'
import { AuthDialog } from './auth-dialog'
import { CaptchaNotice, captchaFailedMessage, useInvisibleCaptcha } from './captcha'
import { EmailLinkForm } from './email-link-form'
import { FormAlert, SubmitButton, textButtonClasses, useLiveValidation } from './form-bits'
import { PasswordField } from './password-field'

type LinkDialog = 'magic' | 'reset'

const DIALOG_TITLES: Record<LinkDialog, string> = {
  magic: 'Sign in with magic link',
  reset: 'Reset Password',
}

export function LoginForm() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const captcha = useInvisibleCaptcha()
  const form = useLiveValidation(signInFieldsSchema)
  const [pending, setPending] = useState(false)
  // The dialog body mounts on first open (so its hCaptcha loads only then) and stays mounted while
  // the close animation runs. `opened` remounts it fresh on every open.
  const [dialog, setDialog] = useState<{ open: boolean; mode: LinkDialog; opened: number } | null>(null)

  const openDialog = (mode: LinkDialog) => setDialog((d) => ({ open: true, mode, opened: (d?.opened ?? 0) + 1 }))
  const closeDialog = () => setDialog((d) => (d ? { ...d, open: false } : d))

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
      const result = await signInWithPasswordFn({ data: { ...data, captchaToken } })
      if (!result.ok) return form.setFormError(result.error)
      queryClient.setQueryData(SESSION_KEY, result.user)
      await router.navigate({ to: '/explore' })
    } catch {
      form.setFormError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="SIGN IN"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className={textButtonClasses('link', 'px-0')}>
            Sign up here
          </Link>
        </>
      }
    >
      <form method="post" onSubmit={onSubmit} {...form.formProps} className="flex flex-col gap-4">
        {form.formError ? <FormAlert>{form.formError}</FormAlert> : null}
        <Field name="email" label="Email" type="email" autoComplete="email" inputMode="email" error={form.errors.email} />
        <PasswordField name="password" label="Password" autoComplete="current-password" error={form.errors.password} />
        {captcha.element}
        <SubmitButton pending={pending}>Sign In</SubmitButton>
        <CaptchaNotice />
      </form>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <button type="button" className={textButtonClasses('link')} onClick={() => openDialog('magic')}>
          Sign in with magic link
        </button>
        <button type="button" className={textButtonClasses('muted')} onClick={() => openDialog('reset')}>
          Forgot password?
        </button>
      </div>

      {dialog ? (
        <AuthDialog open={dialog.open} onClose={closeDialog} title={DIALOG_TITLES[dialog.mode]}>
          <EmailLinkForm key={dialog.opened} mode={dialog.mode} />
        </AuthDialog>
      ) : null}
    </AuthCard>
  )
}
