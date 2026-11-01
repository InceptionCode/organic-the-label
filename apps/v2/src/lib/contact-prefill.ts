import { CONTACT_FORM_CATEGORIES } from './support-categories'

// /contact prefill (pages/contact.md). Optional search params that seed the form's initial values;
// the form stays fully editable and nothing auto-submits. Pure, so the route, the "Request access"
// links, and the unit tests share one definition. Zod-free on purpose: validateContactSearch is the
// route's validateSearch, which ships in the entry chunk (phase 07.6 budget).

export const CONTACT_SUBJECT_MAX = 200
export const CONTACT_MESSAGE_MAX = 2000
export const CONTACT_ORDER_MAX = 40

export type ContactCategory = (typeof CONTACT_FORM_CATEGORIES)[number]

export type ContactPrefill = {
  category?: ContactCategory
  subject?: string
  message?: string
  /** Order reference; the form has no order field, so it is appended to the message. */
  order?: string
}

// Repeated keys arrive as arrays and numbers can arrive unquoted; keep the first plain value.
const first = (v: unknown) => (Array.isArray(v) ? v[0] : typeof v === 'number' ? String(v) : v)

/** A trimmed string up to `max`. Oversized or blank values are dropped, not truncated. */
const text = (v: unknown, max: number): string | undefined => {
  const value = first(v)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : undefined
}

const category = (v: unknown): ContactCategory | undefined => {
  const value = first(v)
  return typeof value === 'string' && (CONTACT_FORM_CATEGORIES as readonly string[]).includes(value)
    ? (value as ContactCategory)
    : undefined
}

// v2's codec never JSON-quotes (lib/search-params.ts), but a hand-built link might: `"123"` -> `123`.
const order = (v: unknown): string | undefined => {
  const value = first(v)
  if (typeof value !== 'string') return undefined
  const trimmed = value.replace(/^"(.*)"$/, '$1').trim()
  return /^[A-Za-z0-9#-]{1,40}$/.test(trimmed) ? trimmed : undefined
}

/** validateSearch for /contact. Never throws; invalid or oversized values become absent. */
export function validateContactSearch(raw: Record<string, unknown>): ContactPrefill {
  // Keys are always present (undefined when dropped) so the router does not keep a stale raw value.
  return {
    category: category(raw.category),
    subject: text(raw.subject, CONTACT_SUBJECT_MAX),
    message: text(raw.message, CONTACT_MESSAGE_MAX),
    order: order(raw.order),
  }
}

/** The textarea's initial value: the message, plus the order reference on its own line. */
export function prefillMessage({ message, order }: ContactPrefill): string {
  if (!order) return message ?? ''
  const line = `Order ID: ${order}`
  return message ? `${message}\n\n${line}` : line
}

/** Search params for an access request about an owned product with no direct download source. */
export function accessRequestSearch(title: string, orderId?: string | null): ContactPrefill {
  return {
    category: 'download_issue',
    subject: `Access request: ${title}`.slice(0, CONTACT_SUBJECT_MAX),
    message: orderId
      ? `Hi, I purchased ${title} and need access to the files. Could you send me a download link?`
      : `Hi, I purchased ${title} and need access to the files. Could you send me a download link?\n\nOrder number: `,
    ...(orderId ? { order: orderId } : {}),
  }
}

/** `/contact?...` href for an access request (encoded with URLSearchParams). */
export function accessRequestHref(title: string, orderId?: string | null): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(accessRequestSearch(title, orderId))) {
    if (value) params.set(key, value)
  }
  return `/contact?${params.toString()}`
}
