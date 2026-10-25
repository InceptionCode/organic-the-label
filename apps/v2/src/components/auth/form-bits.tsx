import type { ReactNode } from 'react'
import type { z } from 'zod'

export type FieldErrors = Record<string, string | undefined>

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

export function Field(props: {
  name: string
  label: string
  type?: string
  autoComplete?: string
  error?: string
}) {
  const id = `field-${props.name}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-body-s text-secondary">
        {props.label}
      </label>
      <input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        autoComplete={props.autoComplete}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={props.error ? `${id}-error` : undefined}
        className="bg-surface-2 border border-default text-primary rounded px-3 py-2"
      />
      {props.error ? (
        <p id={`${id}-error`} className="text-body-s text-accent">
          {props.error}
        </p>
      ) : null}
    </div>
  )
}

export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={tone === 'error' ? 'text-accent' : 'text-primary'}>
      {children}
    </p>
  )
}

export function SubmitButton({
  pending,
  disabled = false,
  children,
}: {
  pending: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-accent ring-focus rounded px-4 py-2 disabled:opacity-50"
    >
      {pending ? 'Working...' : children}
    </button>
  )
}
