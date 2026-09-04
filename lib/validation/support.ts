import { z } from "zod/v4"

export const SupportCategories = [
  "order_issue",
  "download_issue",
  "licensing_question",
  "collaboration",
  "general",
] as const

export const SupportPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  category: z.enum(SupportCategories).default("general"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  marketingOptIn: z.boolean().optional().default(false),
})

export type SupportPayload = z.infer<typeof SupportPayloadSchema>
