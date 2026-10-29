import { z } from 'zod'

// Free resource request payload (port of v1 ResourceRequestPayloadSchema). Zod only, no server
// imports: the client form validates with it for its messages and requestFreeResourceFn validates
// with the same schema as the source of truth.

/** Same shape as SLUG_PATTERN in @organic/content-schema (kept here so the client skips that package). */
export const FREE_RESOURCE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const FREE_REQUEST_MESSAGES = {
  email: 'Please enter a valid email address.',
  captchaMissing: 'Please complete the captcha and try again.',
  notFound: 'Resource not found.',
  generic: 'Something went wrong. Please try again.',
} as const

export const FreeResourceRequestSchema = z.object({
  email: z.string().trim().pipe(z.email(FREE_REQUEST_MESSAGES.email)),
  firstName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || undefined),
  resourceSlug: z.string().regex(FREE_RESOURCE_SLUG_PATTERN, 'Resource slug is required'),
  marketingOptIn: z.boolean(),
  captchaToken: z.string().max(10_000),
})

export type FreeResourceRequestInput = z.input<typeof FreeResourceRequestSchema>
export type FreeResourceRequest = z.output<typeof FreeResourceRequestSchema>

export type FreeResourceRequestResult = { ok: true } | { ok: false; error: string }
