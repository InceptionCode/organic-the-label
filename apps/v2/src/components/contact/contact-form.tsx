import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useCheckboxCaptcha } from '~/components/auth/captcha'
import { submitSupportRequestFn } from '~/fns/support.fn'
import { prefillMessage, type ContactPrefill } from '~/lib/contact-prefill'
import { useSession } from '~/lib/use-session'
import {
  CONTACT_FORM_CATEGORIES,
  ContactFormSchema,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_MESSAGES,
  type SupportCategory,
} from '~/server/support/schema'
import { buttonClasses } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import {
  FormDivider,
  SupportField,
  SupportFormAlert,
  selectChevronStyle,
  supportInputClasses,
  supportSelectClasses,
  textareaClasses,
} from './support-fields'
import { ContactSuccess } from './contact-success'

type FieldName = 'name' | 'email' | 'message'
type FormError = { field?: FieldName; message: string }

/**
 * v1 /contact form. Client checks run in v1 order with v1 messages; the offending field is focused,
 * marked invalid, and described by the alert. hCaptcha gates submit (new on this form); the server
 * fn re-validates and verifies the token.
 */
export function ContactForm({ prefill }: { prefill?: ContactPrefill } = {}) {
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const hasPrefill = Boolean(prefill?.category || prefill?.subject || prefill?.message || prefill?.order)
  // Signed-in visitors don't retype who they are; both fields stay editable.
  const user = useSession()

  // Arriving with a prefill (e.g. "Request access"): focus the first empty required field, so the
  // visitor only has to add their name and email. Nothing is submitted for them.
  useEffect(() => {
    if (!hasPrefill) return
    const form = formRef.current
    if (!form) return
    for (const name of ['name', 'email', 'message'] as const) {
      const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
      if (field && !field.value.trim()) {
        field.focus()
        return
      }
    }
    // Everything is filled (signed in + prefill): land on the message so it can be reviewed.
    ;(form.elements.namedItem('message') as HTMLTextAreaElement | null)?.focus()
  }, [hasPrefill])
  const captcha = useCheckboxCaptcha()
  const [error, setError] = useState<FormError | null>(null)
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const alertId = `${id}-alert`
  const fieldId = (name: string) => `${id}-${name}`
  const fieldError = (name: FieldName) => (error?.field === name ? error.message : undefined)
  const invalid = (name: FieldName) =>
    error?.field === name ? { 'aria-invalid': true as const, 'aria-describedby': alertId } : {}

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const read = (key: string) => String(values.get(key) ?? '')

    const parsed = ContactFormSchema.safeParse({ name: read('name'), email: read('email'), message: read('message') })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!
      const field = issue.path[0] as FieldName
      setError({ field, message: issue.message })
      ;(form.elements.namedItem(field) as HTMLElement | null)?.focus()
      return
    }
    if (!captcha.token) {
      setError({ message: SUPPORT_MESSAGES.captcha })
      return
    }

    setError(null)
    setPending(true)
    try {
      const result = await submitSupportRequestFn({
        data: {
          ...parsed.data,
          category: read('category') as SupportCategory,
          subject: read('subject'),
          marketingOptIn: values.get('marketingOptIn') === 'on',
          captchaToken: captcha.token,
        },
      })
      if (result.ok) {
        setSentTo(parsed.data.email)
        return
      }
      setError({ message: result.error || SUPPORT_MESSAGES.generic })
      captcha.reset()
    } catch {
      setError({ message: SUPPORT_MESSAGES.generic })
      captcha.reset()
    } finally {
      setPending(false)
    }
  }

  if (sentTo) return <ContactSuccess email={sentTo} />

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={pending || undefined} className="flex flex-col gap-5">
      {/* Field errors render under their field; only form-level errors (captcha, server) show here. */}
      <SupportFormAlert id={error?.field ? undefined : alertId} message={error?.field ? undefined : error?.message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SupportField label="Name" htmlFor={fieldId('name')} required error={fieldError('name')} errorId={alertId}>
          <input
            id={fieldId('name')}
            name="name"
            type="text"
            placeholder="Your name"
            defaultValue={user?.displayName ?? undefined}
            autoComplete="name"
            required
            className={supportInputClasses}
            {...invalid('name')}
          />
        </SupportField>
        <SupportField label="Email" htmlFor={fieldId('email')} required error={fieldError('email')} errorId={alertId}>
          <input
            id={fieldId('email')}
            name="email"
            type="email"
            inputMode="email"
            placeholder="your@email.com"
            defaultValue={user?.email ?? undefined}
            autoComplete="email"
            required
            className={supportInputClasses}
            {...invalid('email')}
          />
        </SupportField>
      </div>

      <SupportField label="Category" htmlFor={fieldId('category')} required>
        <select id={fieldId('category')} name="category" defaultValue={prefill?.category ?? 'general'} className={supportSelectClasses} style={selectChevronStyle}>
          {CONTACT_FORM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {SUPPORT_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </SupportField>

      <SupportField label="Subject" htmlFor={fieldId('subject')}>
        <input
          id={fieldId('subject')}
          name="subject"
          type="text"
          placeholder="Brief topic or order number"
          defaultValue={prefill?.subject}
          className={supportInputClasses}
        />
      </SupportField>

      <SupportField label="Message" htmlFor={fieldId('message')} required error={fieldError('message')} errorId={alertId}>
        <textarea
          id={fieldId('message')}
          name="message"
          rows={5}
          placeholder="Tell us what's going on…"
          defaultValue={prefill ? prefillMessage(prefill) || undefined : undefined}
          required
          className={textareaClasses}
          {...invalid('message')}
        />
      </SupportField>

      <FormDivider />

      <Checkbox name="marketingOptIn">
        <span className="text-body-s leading-normal text-muted">
          Add me to the Organic Sonics newsletter for new drops, free resources, and occasional updates.
        </span>
      </Checkbox>

      <div className="min-h-[78px]">{captcha.element}</div>

      <button
        type="submit"
        disabled={pending || !captcha.token}
        aria-busy={pending || undefined}
        className={buttonClasses({ size: 'lg', className: 'w-full' })}
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
