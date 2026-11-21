import { z } from "zod/v4"

export const SupportStatusSchema = z.enum(["open", "pending", "closed", "spam"])
export type SupportStatus = z.infer<typeof SupportStatusSchema>

/** The fields of a `support_requests` row that decide whether the customer gets an email. */
export type SupportReplyState = { status: string; resolution_note?: string | null }

const EMAILABLE_STATUSES: ReadonlySet<string> = new Set<SupportStatus>(["pending", "closed"])

const normalizedNote = (note: string | null | undefined) => (note ?? "").trim()

/**
 * True when saving `next` over `previous` emails the customer. Shared so the admin's save button and
 * the support-status webhook cannot disagree: the status must be pending or closed, and either the
 * status changed or the note changed to non-empty text. Clearing a note never sends.
 */
export function supportReplyEmailsCustomer(previous: SupportReplyState, next: SupportReplyState): boolean {
  if (!EMAILABLE_STATUSES.has(next.status)) return false
  if (next.status !== previous.status) return true
  const note = normalizedNote(next.resolution_note)
  return note !== "" && note !== normalizedNote(previous.resolution_note)
}
