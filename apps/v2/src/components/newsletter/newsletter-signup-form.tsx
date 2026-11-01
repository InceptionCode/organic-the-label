import { useId, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { FormSuccess } from '~/components/forms/split-form-page'
import { subscribeFn } from '~/fns/newsletter.fn'
import { HONEYPOT_FIELD, NEWSLETTER_PAGE_MESSAGES, SubscribePayloadSchema } from '~/server/email/subscribe-schema'
import { Button } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { FieldMarker, fieldErrorClasses, inputClasses, labelClasses } from '~/ui/field'

type ErrorState = { field?: 'email' | 'consent'; message: string }

/**
 * /newsletter form (v1 app/newsletter/newsletter-signup-form.tsx) on the shared subscribe service
 * with source 'newsletter_page'. Client checks in v1 order: email, then consent.
 */
export function NewsletterSignupForm() {
  const id = useId()
  const [error, setError] = useState<ErrorState | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  const errorId = `${id}-error`
  const describe = (field: ErrorState['field']) =>
    error?.field === field ? { 'aria-invalid': true as const, 'aria-describedby': errorId } : {}

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const marketingOptIn = values.get('marketingOptIn') === 'on'
    const parsed = SubscribePayloadSchema.safeParse({
      email: String(values.get('email') ?? ''),
      firstName: String(values.get('firstName') ?? ''),
      source: 'newsletter_page',
      marketingOptIn,
      company: String(values.get(HONEYPOT_FIELD) ?? ''),
    })
    const focus = (name: string) => (form.elements.namedItem(name) as HTMLElement | null)?.focus()
    if (!parsed.success) {
      setError({ field: 'email', message: NEWSLETTER_PAGE_MESSAGES.email })
      return focus('email')
    }
    if (!marketingOptIn) {
      setError({ field: 'consent', message: NEWSLETTER_PAGE_MESSAGES.consent })
      return focus('marketingOptIn')
    }

    setError(null)
    setPending(true)
    try {
      const result = await subscribeFn({ data: parsed.data })
      if (result.ok) setDone(true)
      else setError({ message: result.error || NEWSLETTER_PAGE_MESSAGES.generic })
    } catch {
      setError({ message: NEWSLETTER_PAGE_MESSAGES.generic })
    } finally {
      setPending(false)
    }
  }

  if (done) return <NewsletterSuccess />

  const fieldError = (field: ErrorState['field']) =>
    error && error.field === field ? (
      <p id={errorId} role="alert" className={fieldErrorClasses}>
        {error.message}
      </p>
    ) : null

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={pending || undefined}
      className="flex flex-col gap-5"
    >
      {/* Form-level errors only; field errors render under their field with the same id. */}
      <p
        id={error?.field ? undefined : errorId}
        aria-live="polite"
        role={error && !error.field ? 'alert' : undefined}
        className="border-l-2 border-[color:var(--accent-primary)] py-1 pl-4 text-body-s font-medium text-[color:var(--accent-text)] empty:hidden"
      >
        {error?.field ? null : error?.message}
      </p>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor={`${id}-first`}>
          First name
          <FieldMarker />
        </label>
        <input id={`${id}-first`} name="firstName" type="text" autoComplete="given-name" className={inputClasses} />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor={`${id}-email`}>
          Email
          <FieldMarker required />
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className={inputClasses}
          {...describe('email')}
        />
        {fieldError('email')}
      </div>

      {/* Honeypot (pages/newsletter.md open decision 1): off screen, skipped by keyboard and AT. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`${id}-hp`}>Company</label>
        <input id={`${id}-hp`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Checkbox name="marketingOptIn" {...describe('consent')}>
        <span className="text-body-s leading-normal text-muted">
          I agree to receive marketing emails from Organic Sonics. Unsubscribe anytime.
        </span>
      </Checkbox>
      {fieldError('consent')}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending || undefined} className="w-full">
        {pending ? 'Signing up…' : 'Subscribe'}
      </Button>
    </form>
  )
}

function NewsletterSuccess() {
  return (
    <FormSuccess
      title="CHECK YOUR INBOX"
      headingRef={(el) => el?.focus()}
      action={
        <Link
          to="/store"
          className="link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]"
        >
          Browse the store
        </Link>
      }
    >
      <p>You&apos;re on the list. Check your inbox to confirm.</p>
    </FormSuccess>
  )
}
