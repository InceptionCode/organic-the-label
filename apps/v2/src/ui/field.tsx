import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement } from 'react'
import { cn } from './cn'

export const inputClasses =
  'w-full min-h-11 rounded-md border border-default bg-surface-2 px-3 py-2 text-base text-primary placeholder:text-muted transition-soft hover:border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] active:border-strong disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive'

type DescribedProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }

type FieldProps = {
  label: string
  hint?: string
  error?: string
  className?: string
  /** A select or textarea to render instead of the default input. It receives id and aria props. */
  children?: ReactElement<DescribedProps>
} & Omit<ComponentProps<'input'>, 'children'>

export function Field({ label, hint, error, className, children, id: idProp, ...inputProps }: FieldProps) {
  const autoId = useId()
  const id = idProp ?? `field-${autoId}`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  const aria: DescribedProps = { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-body-s text-secondary">
        {label}
      </label>
      {isValidElement(children) ? (
        cloneElement(children, aria)
      ) : (
        <input {...inputProps} {...aria} className={inputClasses} />
      )}
      {hint ? (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
      <p id={errorId} aria-live="polite" className="text-body-s text-accent empty:hidden">
        {error}
      </p>
    </div>
  )
}
