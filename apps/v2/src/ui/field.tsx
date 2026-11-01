import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement } from 'react'
import { cn } from './cn'

// The flat form language shared by every form on the dark canvas (auth, contact, newsletter, free,
// home email signup)
export const inputClasses =
  'w-full h-12 rounded-[2px] border border-[color:var(--border-default)] bg-transparent px-4 text-base text-primary placeholder:text-[color:var(--text-muted)] transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--border-strong)] focus-visible:border-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] read-only:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[color:var(--accent-text)]'

export const selectClasses = cn(inputClasses, 'cursor-pointer appearance-none pr-10')
export const textareaClasses = cn(inputClasses, 'h-auto min-h-[140px] resize-y py-3 leading-[1.625rem]')

export const labelClasses = 'text-sm font-medium text-secondary'
export const fieldErrorClasses = 'text-body-s text-[color:var(--accent-text)] empty:hidden'

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23958B7C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")"
/** Flat chevron for native selects (pair with `selectClasses`). */
export const selectChevronStyle = { backgroundImage: CHEVRON, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' } as const

/** "*" for required (announced as "required") or a muted "(optional)". */
export function FieldMarker({ required }: { required?: boolean }) {
  return required ? (
    <>
      {' '}
      <span aria-hidden="true" className="text-[color:var(--accent-text)]">
        *
      </span>
      <span className="sr-only">(required)</span>
    </>
  ) : (
    <span className="font-normal text-muted"> (optional)</span>
  )
}

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
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={labelClasses}>
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
      <p id={errorId} aria-live="polite" className={fieldErrorClasses}>
        {error}
      </p>
    </div>
  )
}
