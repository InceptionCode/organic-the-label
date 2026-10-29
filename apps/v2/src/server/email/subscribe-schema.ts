import { z } from 'zod'

// Port of v1 SubscribePayloadSchema (lib/validation/email.ts). Zod only, no server imports, so the
// client forms import it for their messages and the server fn validates with the same schema.
export const SUBSCRIBE_SOURCES = ['footer', 'newsletter_page', 'popup', 'checkout', 'explore', 'account'] as const
export type SubscribeSource = (typeof SUBSCRIBE_SOURCES)[number]

export const SUBSCRIBE_MESSAGES = {
  email: 'Please enter a valid email address.',
  consent: 'Please check the consent box to continue.',
  consentRequired: 'Marketing consent is required to subscribe.',
  generic: 'Something went wrong. Please try again.',
} as const

/** /newsletter page copy (v1 app/newsletter/newsletter-signup-form.tsx), in client check order. */
export const NEWSLETTER_PAGE_MESSAGES = {
  email: 'Enter a valid email address.',
  consent: 'Check the consent box to continue.',
  generic: 'Something went wrong. Try again.',
} as const

/** Hidden honeypot field name (pages/newsletter.md open decision 1). Real people leave it empty. */
export const HONEYPOT_FIELD = 'company'

export const SubscribePayloadSchema = z.object({
  email: z.string().trim().pipe(z.email(SUBSCRIBE_MESSAGES.email)),
  firstName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || undefined),
  source: z.enum(SUBSCRIBE_SOURCES).optional(),
  marketingOptIn: z.boolean(),
  /** Honeypot. A filled value is answered with a silent success and nothing is written. */
  company: z.string().max(200).optional(),
})

export type SubscribePayload = z.input<typeof SubscribePayloadSchema>
export type ParsedSubscribePayload = z.output<typeof SubscribePayloadSchema>

/** True when the hidden honeypot was filled in (a bot). Checked before any visitor or write. */
export const isHoneypotTripped = (payload: { company?: string | undefined }) => Boolean(payload.company?.trim())

export type SubscribeResult = { ok: true } | { ok: false; error: string }
