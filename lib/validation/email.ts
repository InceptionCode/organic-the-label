import { z } from "zod/v4"

export const SubscribePayloadSchema = z.object({
  email: z.email("Invalid email address"),
  firstName: z.string().optional(),
  source: z.enum(["footer", "newsletter_page", "popup", "checkout"]).optional(),
  marketingOptIn: z.boolean(),
})

export type SubscribePayload = z.infer<typeof SubscribePayloadSchema>

export const ResourceRequestPayloadSchema = z.object({
  email: z.email("Invalid email address"),
  firstName: z.string().optional(),
  resourceSlug: z.string().min(1, "Resource slug is required"),
  marketingOptIn: z.boolean(),
})

export type ResourceRequestPayload = z.infer<typeof ResourceRequestPayloadSchema>
