import { useState, type FocusEvent, type FormEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { z } from 'zod'
import { buttonClasses } from '~/ui/button'
import { cn } from '~/ui/cn'
import { fieldErrors, formValues, validateTouched, type FieldErrors } from './validation'

export { fieldErrors, type FieldErrors } from './validation'

/** Focus ring for controls on the auth pages (unboxed, on the canvas). */
export const authFocusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/** Text links ("Sign in with magic link", footer links) as underlined text with a 44px hit area. */
export function textButtonClasses(tone: 'link' | 'muted' = 'link', className?: string) {
  return cn(
    'link-underline',
    tone === 'link' ? 'text-primary hover:text-[color:var(--text-secondary)]' : 'text-muted hover:text-primary',
    'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm px-1 text-body-s touch-manipulation active:opacity-70',
    authFocusRing,
    className,
  )
}

/**
 * Validate on blur, revalidate on input (v1's Conform settings), using the shared zod schema.
 * Spread `formProps` on the <form>; call `submit(form)` in onSubmit to validate everything.
 */
export function useLiveValidation<T>(schema: z.ZodType<T>) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [valid, setValid] = useState(false)
  const [formError, setFormError] = useState<string>()

  const run = (form: HTMLFormElement, seen: ReadonlySet<string>) => {
    const next = validateTouched(schema, formValues(form), seen)
    setErrors(next.errors)
    setValid(next.valid)
  }

  const onBlur = (event: FocusEvent<HTMLFormElement>) => {
    const name = (event.target as { name?: unknown }).name
    if (typeof name !== 'string' || !name) return
    const seen = touched.has(name) ? touched : new Set(touched).add(name)
    if (seen !== touched) setTouched(seen)
    run(event.currentTarget, seen)
  }

  const onInput = (event: FormEvent<HTMLFormElement>) => run(event.currentTarget, touched)

  /** Validates every field. Returns the parsed data, or null after focusing the first invalid field. */
  const submit = (form: HTMLFormElement): T | null => {
    const values = formValues(form)
    setTouched(new Set(Object.keys(values)))
    setFormError(undefined)
    const result = schema.safeParse(values)
    if (result.success) {
      setErrors({})
      setValid(true)
      return result.data
    }
    const all = fieldErrors(result.error)
    setErrors(all)
    setValid(false)
    for (const element of Array.from(form.elements)) {
      const name = (element as { name?: unknown }).name
      if (typeof name === 'string' && all[name] && element instanceof HTMLElement) {
        element.focus()
        break
      }
    }
    return null
  }

  return { errors, valid, formError, setFormError, submit, formProps: { onBlur, onInput, noValidate: true } }
}

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: ReactNode }) {
  // Flat: a 2px left bar, no panel (design-direction.md "Forms").
  if (tone === 'success') {
    return (
      <p role="status" className="border-l-2 border-[color:var(--accent-secondary)] py-1 pl-4 text-body-s text-primary">
        {children}
      </p>
    )
  }
  return (
    <div role="alert" className="border-l-2 border-[color:var(--accent-primary)] py-1 pl-4 text-body-s font-medium text-[color:var(--accent-text)]">
      {children}
    </div>
  )
}

export function SubmitButton({
  pending,
  disabled = false,
  className,
  children,
}: {
  pending: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={buttonClasses({ size: 'lg', className: cn('mt-2 w-full', className) })}
    >
      {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : null}
      {children}
    </button>
  )
}
