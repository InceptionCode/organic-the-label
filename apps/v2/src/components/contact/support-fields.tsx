import type { ReactNode } from 'react'
import {
  FieldMarker,
  fieldErrorClasses,
  inputClasses,
  labelClasses,
  selectChevronStyle,
  selectClasses,
  textareaClasses as sharedTextareaClasses,
} from '~/ui/field'

// Form pieces for /contact (and the chevron for the Work With Me inquiry). They are the shared flat
// field styles from ui/field.tsx, re-exported under the names the support forms already use.

export const supportInputClasses = inputClasses
export const supportSelectClasses = selectClasses
export const textareaClasses = sharedTextareaClasses
export { selectChevronStyle }

export function SupportField({
  label,
  htmlFor,
  required,
  error,
  errorId,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  /** This field's message, shown under it (the input points at `errorId` via aria-describedby). */
  error?: string
  errorId?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
        <FieldMarker required={required} />
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className={fieldErrorClasses}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Form-level message: red-as-text with a red left bar (no panel). Announced politely; empty renders nothing. */
export function SupportFormAlert({ id, message }: { id?: string; message?: string }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {message ? (
        <p id={id} role="alert" className="border-l-2 border-[color:var(--accent-primary)] py-1 pl-4 text-body-s font-medium text-[color:var(--accent-text)]">
          {message}
        </p>
      ) : null}
    </div>
  )
}

export function FormDivider() {
  return <div aria-hidden="true" className="my-1 border-t border-[color:var(--border-subtle)]" />
}
