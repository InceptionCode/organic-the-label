import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useCheckboxCaptcha } from '~/components/auth/captcha'
import { selectChevronStyle } from '~/components/contact/support-fields'
import { submitSupportRequestFn } from '~/fns/support.fn'
import {
  SUPPORT_MESSAGES,
  WORK_WITH_ME_PROJECT_TYPES,
  WorkWithMeFormSchema,
  workWithMeSubject,
  type WorkWithMeProjectType,
} from '~/server/support/schema'
import { buttonClasses } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { cn } from '~/ui/cn'

const BULLETS = [
  'Every message gets a personal reply, usually within 2 business days.',
  'No brief is too rough. A reference track and a deadline is enough to start.',
  "Rates and timelines depend on scope; you'll get a clear quote before anything begins.",
]

type FieldName = 'name' | 'email' | 'message'

// The form sits on the sand band: ink text and hairlines, a bone-tinted field fill, and the
// band's dark red (#8E1414, 5.6:1 on sand) for required marks and errors.
const SAND_ERROR = 'text-[color:var(--accent-text)]'
const sandInput = cn(
  'w-full min-h-12 rounded-[2px] border border-[color:var(--border-strong)] bg-[rgba(247,243,235,0.45)] px-4 py-3 text-base leading-[1.625rem] text-[color:var(--band-sand-fg)] placeholder:text-[color:var(--band-sand-muted)]',
  'transition-[border-color,background-color] duration-150 hover:border-[color:var(--band-sand-fg)]',
  'outline-none focus-visible:border-[color:var(--band-sand-fg)] focus-visible:bg-[rgba(247,243,235,0.7)] focus-visible:ring-2 focus-visible:ring-[color:var(--band-sand-fg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--band-sand-bg)]',
  'aria-invalid:border-[color:var(--accent-text)]',
)
const sandSelect = cn(sandInput, 'cursor-pointer appearance-none pr-10')
const sandTextarea = cn(sandInput, 'min-h-[140px] resize-y')

// ── Project type preselect (from the services index rows) ──
const PROJECT_TYPE_EVENT = 'wwm:project-type'

/** Asks the inquiry form to preselect a project type and take focus (services index rows call this). */
export function requestProjectType(type: WorkWithMeProjectType) {
  window.dispatchEvent(new CustomEvent<WorkWithMeProjectType>(PROJECT_TYPE_EVENT, { detail: type }))
}

function SandField({ label, htmlFor, required, children }: { label: string; htmlFor: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-label">
        {label}{' '}
        {required ? (
          <span aria-hidden="true" className={SAND_ERROR}>
            *
          </span>
        ) : (
          <span>(optional)</span>
        )}
      </label>
      {children}
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} aria-live="polite" className={cn('text-body-s font-medium empty:hidden', SAND_ERROR)}>
      {message}
    </p>
  )
}

function FormAlert({ message }: { message?: string }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {message ? (
        <p role="alert" className={cn('border-l-2 border-[color:var(--accent-text)] py-1 pl-4 text-body-s font-medium', SAND_ERROR)}>
          {message}
        </p>
      ) : null}
    </div>
  )
}

/** Mounts the hCaptcha widget only once the form is near the viewport. */
function useNearViewport() {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        setNear(true)
        io.disconnect()
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, near }
}

/**
 * The page's closing section and its one sand band: "Get started today" over the inquiry form (the
 * former CTA band merged in). Shared support service (category work_with_me, subject
 * "Work With Me: {projectType}"); each issue shows next to its field, the banner is for server errors.
 */
export function InquiryForm() {
  const id = useId()
  const captcha = useCheckboxCaptcha({ theme: 'light' })
  const { ref: formAreaRef, near } = useNearViewport()
  const formRef = useRef<HTMLFormElement>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [formError, setFormError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const fid = (name: string) => `${id}-${name}`
  const errorProps = (name: FieldName) =>
    fieldErrors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `${fid(name)}-error` } : {}

  // A services row was chosen: preselect its project type and move focus to the first empty field.
  // The row's anchor does the scrolling; focus waits until that fragment navigation has run (it
  // resets focus) and skips its own scroll.
  useEffect(() => {
    let timer = 0
    const onRequest = (event: Event) => {
      const form = formRef.current
      if (!form) return
      const type = (event as CustomEvent<WorkWithMeProjectType>).detail
      const select = form.elements.namedItem('projectType') as HTMLSelectElement | null
      if (select && WORK_WITH_ME_PROJECT_TYPES.includes(type)) select.value = type
      const firstEmpty = (['name', 'email', 'message'] as const)
        .map((name) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)
        .find((el) => el && !el.value.trim())
      window.clearTimeout(timer)
      timer = window.setTimeout(() => (firstEmpty ?? select)?.focus({ preventScroll: true }), 0)
    }
    window.addEventListener(PROJECT_TYPE_EVENT, onRequest)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(PROJECT_TYPE_EVENT, onRequest)
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const parsed = WorkWithMeFormSchema.safeParse({
      name: String(values.get('name') ?? ''),
      email: String(values.get('email') ?? ''),
      projectType: String(values.get('projectType') ?? ''),
      message: String(values.get('message') ?? ''),
      marketingOptIn: values.get('marketingOptIn') === 'on',
    })
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName
        next[key] ??= issue.message
      }
      setFieldErrors(next)
      setFormError(undefined)
      const first = parsed.error.issues[0]?.path[0]
      if (typeof first === 'string') (form.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    setFieldErrors({})
    if (!captcha.token) {
      setFormError(SUPPORT_MESSAGES.captcha)
      return
    }

    setFormError(undefined)
    setPending(true)
    try {
      const result = await submitSupportRequestFn({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          category: 'work_with_me',
          subject: workWithMeSubject(parsed.data.projectType),
          message: parsed.data.message,
          marketingOptIn: parsed.data.marketingOptIn,
          captchaToken: captcha.token,
        },
      })
      if (result.ok) {
        setSentTo(parsed.data.email)
        return
      }
      setFormError(result.error || SUPPORT_MESSAGES.generic)
      captcha.reset()
    } catch {
      setFormError(SUPPORT_MESSAGES.generic)
      captcha.reset()
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      id="work-with-me-inquiry"
      aria-labelledby="wwm-inquiry-title"
      className="band-sand section-y-standard scroll-mt-16 lg:scroll-mt-[72px]"
    >
      <div className="content-container grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col lg:col-span-5">
          <h2 id="wwm-inquiry-title" className="text-display-l uppercase">
            Get started today
          </h2>
          <p className="mt-6 max-w-[42ch] text-body-l">Bring the demo, the reference, or just the idea. We&apos;ll build the record.</p>
          <p className="mt-10 text-h3">Tell me what you&apos;re making</p>
          <p className="mt-3 max-w-[46ch] text-body-m">Share the shape of the project and I&apos;ll get back to you with next steps.</p>
          <ul className="mt-8 hairline-t">
            {BULLETS.map((line) => (
              <li key={line} className="hairline-b py-4 text-body-s leading-[1.6]">
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div ref={formAreaRef} className="lg:col-span-6 lg:col-start-7">
          {sentTo ? (
            <div className="os-swap-in hairline-t hairline-b py-10" role="status">
              <h3 className="mb-3 text-h2 uppercase">Message received</h3>
              <p className="text-body-m">Thanks for reaching out. I&apos;ll follow up at {sentTo} soon.</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={pending || undefined} className="flex flex-col gap-5">
              <FormAlert message={formError} />

              <div className="grid gap-4 sm:grid-cols-2">
                <SandField label="Name" htmlFor={fid('name')} required>
                  <input id={fid('name')} name="name" type="text" placeholder="Your name" autoComplete="name" required className={sandInput} {...errorProps('name')} />
                  <FieldError id={`${fid('name')}-error`} message={fieldErrors.name} />
                </SandField>
                <SandField label="Email" htmlFor={fid('email')} required>
                  <input
                    id={fid('email')}
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                    className={sandInput}
                    {...errorProps('email')}
                  />
                  <FieldError id={`${fid('email')}-error`} message={fieldErrors.email} />
                </SandField>
              </div>

              <SandField label="Project type" htmlFor={fid('projectType')} required>
                <select id={fid('projectType')} name="projectType" defaultValue="Collaboration" className={sandSelect} style={selectChevronStyle}>
                  {WORK_WITH_ME_PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </SandField>

              <SandField label="Message" htmlFor={fid('message')} required>
                <textarea
                  id={fid('message')}
                  name="message"
                  rows={5}
                  placeholder="What are you working on, and what do you need?"
                  required
                  className={sandTextarea}
                  {...errorProps('message')}
                />
                <FieldError id={`${fid('message')}-error`} message={fieldErrors.message} />
              </SandField>

              <Checkbox
                name="marketingOptIn"
                tone="light"
                className="border-[color:var(--border-strong)] bg-[rgba(247,243,235,0.45)] hover:border-[color:var(--band-sand-fg)] focus-visible:ring-[color:var(--band-sand-fg)] focus-visible:ring-offset-[color:var(--band-sand-bg)]"
              >
                <span className="text-body-s leading-normal">
                  Add me to the Organic Sonics newsletter for new drops, free resources, and occasional updates.
                </span>
              </Checkbox>

              <div className="min-h-[78px]">{near ? captcha.element : null}</div>

              <button
                type="submit"
                disabled={pending || !captcha.token}
                aria-busy={pending || undefined}
                className={buttonClasses({
                  size: 'lg',
                  className:
                    'w-full bg-[color:var(--band-sand-fg)] text-[color:var(--band-sand-bg)] hover:bg-[color:var(--surface-3)] focus-visible:ring-[color:var(--band-sand-fg)] focus-visible:ring-offset-[color:var(--band-sand-bg)]',
                })}
              >
                {pending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
