import type { z } from 'zod'

export type FieldErrors = Record<string, string | undefined>

/** First message per top-level field; issues with no path land on `form`. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

/** Reads a form's named string values (files and duplicate keys are not used by the auth forms). */
export function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of new FormData(form)) if (typeof value === 'string') out[key] = value
  return out
}

export type LiveValidation = { errors: FieldErrors; valid: boolean }

/**
 * v1's Conform behaviour (validate on blur, revalidate on input) as a pure step: the whole form is
 * parsed every time, but only fields the user has left (`touched`) show their error.
 */
export function validateTouched(schema: z.ZodType, values: Record<string, string>, touched: ReadonlySet<string>): LiveValidation {
  const result = schema.safeParse(values)
  if (result.success) return { errors: {}, valid: true }
  const all = fieldErrors(result.error)
  const errors: FieldErrors = {}
  for (const [key, message] of Object.entries(all)) if (touched.has(key)) errors[key] = message
  return { errors, valid: false }
}
