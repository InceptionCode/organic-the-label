import { z } from "zod/v4"

export const SupportCategories = [
  "order_issue",
  "download_issue",
  "licensing_question",
  "collaboration",
  "general",
  "work_with_me",
] as const

export type SupportCategory = (typeof SupportCategories)[number]

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  order_issue: "Order issue",
  download_issue: "Download issue",
  licensing_question: "Licensing question",
  collaboration: "Collaboration",
  general: "General inquiry",
  work_with_me: "Work With Me inquiry",
}

/** Categories offered on the generic /contact form — excludes work_with_me,
 *  which is only submitted from the Work With Me page. */
export const CONTACT_FORM_CATEGORIES = SupportCategories.filter(
  (category): category is Exclude<SupportCategory, "work_with_me"> =>
    category !== "work_with_me",
)

export const SupportPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  category: z.enum(SupportCategories).default("general"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  marketingOptIn: z.boolean().optional().default(false),
})

export type SupportPayload = z.infer<typeof SupportPayloadSchema>
