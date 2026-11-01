import { useId, useState, type FormEvent } from 'react'
import { subscribeFn } from '~/fns/newsletter.fn'
import { SUBSCRIBE_MESSAGES, SubscribePayloadSchema, type SubscribeSource } from '~/server/email/subscribe-schema'
import { Button } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { cn } from '~/ui/cn'
import { inputClasses, labelClasses } from '~/ui/field'

type Errors = { email?: string; consent?: string; form?: string }

type Tone = 'dark' | 'light'

const inputBase =
  'w-full h-12 rounded-sm border px-4 text-base transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2'

// dark: flat on the home canvas. light: the explore page's bone card.
const TONES = {
  // The shared flat field (ui/field.tsx), identical to the auth, contact, newsletter and free forms.
  dark: {
    input: inputClasses,
    label: labelClasses,
    consent: 'text-body-s leading-normal text-muted',
    error: 'text-[color:var(--accent-text)]',
    submitOffset: 'focus-visible:ring-offset-[color:var(--bg-canvas)]',
  },
  light: {
    input: cn(
      inputBase,
      'border-[rgba(7,7,7,0.14)] bg-white text-[#070707] placeholder:text-[#6B6152] hover:border-[rgba(7,7,7,0.3)] focus-visible:ring-offset-[#F7F3EB] aria-invalid:border-[#B31919]',
    ),
    label: 'text-caption text-[#5C4A33]',
    consent: 'text-caption leading-normal text-[#5C4A33]',
    error: 'text-[#B31919]',
    submitOffset: 'focus-visible:ring-offset-[#F7F3EB]',
  },
} satisfies Record<Tone, Record<string, string>>

/**
 * Email signup island for the home beige card (v1 email-signup-section.tsx form). Client checks use
 * the same zod schema as subscribeFn; the server is the source of truth.
 */
export function EmailSignupForm({ source = 'footer', tone = 'dark' }: { source?: SubscribeSource; tone?: Tone }) {
  const id = useId()
  const t = TONES[tone]
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const marketingOptIn = form.get('marketingOptIn') === 'on'
    const parsed = SubscribePayloadSchema.safeParse({
      email: String(form.get('email') ?? ''),
      firstName: String(form.get('firstName') ?? ''),
      source,
      marketingOptIn,
    })
    // v1 order: email first, then consent; one message at a time.
    if (!parsed.success) return setErrors({ email: SUBSCRIBE_MESSAGES.email })
    if (!marketingOptIn) return setErrors({ consent: SUBSCRIBE_MESSAGES.consent })

    setErrors({})
    setPending(true)
    try {
      const result = await subscribeFn({ data: parsed.data })
      if (result.ok) setDone(true)
      else setErrors({ form: result.error || SUBSCRIBE_MESSAGES.generic })
    } catch {
      setErrors({ form: SUBSCRIBE_MESSAGES.generic })
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <div role="status" className="border-l-2 border-[color:var(--accent-primary)] py-2 pl-5">
        <p className={cn('text-body-m font-medium', tone === 'dark' ? 'text-primary' : 'text-[#070707]')}>
          You&apos;re on the list. I&apos;ll send sounds, notes, and updates when they&apos;re actually worth opening. ✦
        </p>
      </div>
    )
  }

  const emailError = `${id}-email-error`
  const consentError = `${id}-consent-error`
  const message = errors.email ?? errors.consent ?? errors.form

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3" aria-busy={pending}>
      <p aria-live="polite" role={message ? 'alert' : undefined} className={cn('text-body-s empty:hidden', t.error)}>
        <span id={errors.email ? emailError : errors.consent ? consentError : undefined}>{message}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-first`} className={t.label}>
            First name (optional)
          </label>
          <input id={`${id}-first`} name="firstName" type="text" autoComplete="given-name" placeholder="First name (optional)" className={t.input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className={t.label}>
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            placeholder="your@email.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? emailError : undefined}
            className={t.input}
          />
        </div>
      </div>

      <Checkbox
        name="marketingOptIn"
        tone={tone}
        aria-invalid={errors.consent ? true : undefined}
        aria-describedby={errors.consent ? consentError : undefined}
      >
        <span className={t.consent}>
          I agree to receive marketing emails from Organic Sonics, including new drops, free samples, and exclusive deals.
          Unsubscribe at any time.
        </span>
      </Checkbox>

      <Button type="submit" size="lg" disabled={pending} className={cn('w-full', t.submitOffset)}>
        {pending ? 'Signing up…' : 'Sign up for free'}
      </Button>
    </form>
  )
}
