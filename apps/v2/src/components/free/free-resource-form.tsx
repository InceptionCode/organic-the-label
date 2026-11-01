import { lazy, Suspense, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { requestFreeResourceFn } from '~/fns/free-resources.fn'
import { FREE_REQUEST_MESSAGES, FreeResourceRequestSchema } from '~/server/free-resources/request-schema'
import { Button } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { FieldMarker, fieldErrorClasses, inputClasses, labelClasses } from '~/ui/field'
import { FreeResourceSuccess } from './free-resource-success'

const FreeCaptcha = lazy(() => import('./free-captcha'))

type FormError = { field?: 'email' | 'captcha'; message: string }

/** The request form island (pages/free.md). Validates with the server's zod schema, then posts. */
export function FreeResourceForm({ resourceSlug }: { resourceSlug: string }) {
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [captchaWanted, setCaptchaWanted] = useState(false)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [token, setToken] = useState('')
  const [error, setError] = useState<FormError | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  // Mount hCaptcha once the form is near the viewport (or on first focus, below).
  useEffect(() => {
    const form = formRef.current
    if (!form || captchaWanted) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        setCaptchaWanted(true)
        observer.disconnect()
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(form)
    return () => observer.disconnect()
  }, [captchaWanted])

  const resetCaptcha = () => {
    setToken('')
    setCaptchaKey((k) => k + 1)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = FreeResourceRequestSchema.safeParse({
      email: String(form.get('email') ?? ''),
      firstName: String(form.get('firstName') ?? ''),
      resourceSlug,
      marketingOptIn: form.get('marketingOptIn') === 'on',
      captchaToken: token,
    })
    if (!parsed.success) {
      const emailIssue = parsed.error.issues.some((i) => i.path[0] === 'email')
      setError(emailIssue ? { field: 'email', message: FREE_REQUEST_MESSAGES.email } : { message: FREE_REQUEST_MESSAGES.generic })
      return
    }
    if (!token) {
      setCaptchaWanted(true)
      setError({ field: 'captcha', message: FREE_REQUEST_MESSAGES.captchaMissing })
      return
    }

    setError(null)
    setPending(true)
    try {
      const result = await requestFreeResourceFn({ data: parsed.data })
      if (result.ok) {
        setDone(true)
        return
      }
      setError({ message: result.error || FREE_REQUEST_MESSAGES.generic })
      resetCaptcha()
    } catch {
      setError({ message: FREE_REQUEST_MESSAGES.generic })
      resetCaptcha()
    } finally {
      setPending(false)
    }
  }

  if (done) return <FreeResourceSuccess />

  const errorId = `${id}-error`
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocus={() => setCaptchaWanted(true)}
      noValidate
      aria-busy={pending}
      className="flex flex-col gap-5"
    >
      <h2 className="text-h3 text-primary">GET THE KIT</h2>

      {/* Form-level errors (captcha, server). The email error renders under its field with the same id. */}
      <div aria-live="polite" className="empty:hidden">
        {error && error.field !== 'email' && (
          <p
            id={errorId}
            role="alert"
            className="border-l-2 border-[color:var(--accent-primary)] py-1 pl-4 text-body-s font-medium text-[color:var(--accent-text)]"
          >
            {error.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-first`} className={labelClasses}>
          First name
          <FieldMarker />
        </label>
        <input id={`${id}-first`} name="firstName" type="text" maxLength={80} placeholder="Jay" autoComplete="given-name" className={inputClasses} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-email`} className={labelClasses}>
          Email address
          <FieldMarker required />
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="your@email.com"
          aria-invalid={error?.field === 'email' ? true : undefined}
          aria-describedby={error?.field === 'email' ? errorId : undefined}
          className={inputClasses}
        />
        {error?.field === 'email' ? (
          <p id={errorId} role="alert" className={fieldErrorClasses}>
            {error.message}
          </p>
        ) : null}
      </div>

      <Checkbox name="marketingOptIn">
        <span className="block text-body-s leading-normal text-muted">
          Also add me to the Organic Sonics newsletter for new drops, producer tips, and occasional free stuff.{' '}
          <span className="text-muted">Optional.</span>
        </span>
      </Checkbox>

      <div
        className="flex min-h-[144px] items-center justify-start lg:min-h-[78px]"
        aria-describedby={error?.field === 'captcha' ? errorId : undefined}
      >
        {captchaWanted && (
          <Suspense fallback={null}>
            <FreeCaptcha key={captchaKey} onToken={setToken} />
          </Suspense>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? 'Sending your link…' : 'Send me the free kit'}
      </Button>

      <p className="text-label">No spam. Unsubscribe at any time.</p>
    </form>
  )
}
