import { z } from 'zod'

export const SUPPORT_CATEGORIES = [
  'order_issue',
  'download_issue',
  'licensing_question',
  'collaboration',
  'general',
  'work_with_me',
] as const
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  order_issue: 'Order issue',
  download_issue: 'Download issue',
  licensing_question: 'Licensing question',
  collaboration: 'Collaboration',
  general: 'General inquiry',
  work_with_me: 'Work With Me inquiry',
}

/** Categories offered on /contact. work_with_me is only submitted from the Work With Me page. */
export const CONTACT_FORM_CATEGORIES = SUPPORT_CATEGORIES.filter(
  (c): c is Exclude<SupportCategory, 'work_with_me'> => c !== 'work_with_me',
)

export const SUPPORT_MESSAGES = {
  // v1 server and Work With Me messages.
  name: 'Name is required',
  email: 'Invalid email address',
  message: 'Message must be at least 10 characters',
  captcha: 'Please complete the CAPTCHA',
  saveFailed: 'Failed to save request.',
  generic: 'Something went wrong. Please try again.',
} as const

/** v1 /contact client messages, shown in this order (pages/contact.md). */
export const CONTACT_MESSAGES = {
  name: 'Please enter your name.',
  email: 'Please enter a valid email address.',
  message: 'Message must be at least 10 characters.',
} as const

const trimmed = (max: number) => z.string().trim().max(max)

export const SupportPayloadSchema = z.object({
  name: trimmed(120).min(1, SUPPORT_MESSAGES.name),
  email: z.string().trim().pipe(z.email(SUPPORT_MESSAGES.email)),
  category: z.enum(SUPPORT_CATEGORIES).default('general'),
  subject: trimmed(200)
    .optional()
    .transform((v) => v || undefined),
  message: trimmed(5000).min(10, SUPPORT_MESSAGES.message),
  marketingOptIn: z.boolean().optional().default(false),
  captchaToken: z.string().min(1, SUPPORT_MESSAGES.captcha),
})

export type SupportPayload = z.input<typeof SupportPayloadSchema>
export type ParsedSupportPayload = z.output<typeof SupportPayloadSchema>

export type SupportResult = { ok: true; id: string } | { ok: false; error: string }

/** /contact client checks with the v1 page messages (same rules as the server schema). */
export const ContactFormSchema = z.object({
  name: z.string().trim().min(1, CONTACT_MESSAGES.name),
  email: z.string().trim().pipe(z.email(CONTACT_MESSAGES.email)),
  message: z.string().trim().min(10, CONTACT_MESSAGES.message),
})

export const WORK_WITH_ME_PROJECT_TYPES = [
  'Collaboration',
  'Mixing & Mastering',
  'Production',
  'Beat Leasing',
  'Production Suite',
  'General',
] as const
export type WorkWithMeProjectType = (typeof WORK_WITH_ME_PROJECT_TYPES)[number]

/** v1 WorkWithMeFormSchema: the inquiry form's client checks. */
export const WorkWithMeFormSchema = z.object({
  name: z.string().trim().min(1, SUPPORT_MESSAGES.name),
  email: z.string().trim().pipe(z.email(SUPPORT_MESSAGES.email)),
  projectType: z.enum(WORK_WITH_ME_PROJECT_TYPES),
  message: z.string().trim().min(10, SUPPORT_MESSAGES.message),
  marketingOptIn: z.boolean().optional().default(false),
})

/** v1 subject for inquiries: "Work With Me: {projectType}". */
export const workWithMeSubject = (projectType: WorkWithMeProjectType) => `Work With Me: ${projectType}`
