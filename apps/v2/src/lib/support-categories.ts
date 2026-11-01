// Support categories, zod-free so /contact's validateSearch (lib/contact-prefill.ts, in the entry chunk)
// can use them without pulling zod into the entry graph. server/support/schema.ts re-exports these.

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
