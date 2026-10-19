import { z } from 'zod'

// Supabase → compositions/free_resources webhook
export const compositionWebhookSchema = z.object({
  type: z.enum(['INSERT', 'UPDATE', 'DELETE']).optional(),
  table: z.string().optional(),
  schema: z.string().optional(),
  record: z.object({ slug: z.string().optional() }).nullish(),
  old_record: z.object({ slug: z.string().optional() }).nullish(),
})

// Supabase → support_requests webhook
const supportRequestRecordSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  status: z.string(),
  resolution_note: z.string().nullable(),
})

export const supportWebhookSchema = z.object({
  type: z.literal('UPDATE'),
  table: z.string(),
  schema: z.string(),
  record: supportRequestRecordSchema,
  old_record: supportRequestRecordSchema,
})

// MailerLite subscriber events webhook
export const mailerliteWebhookSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      occurred_at: z.string(),
      data: z.object({
        subscriber: z.object({
          id: z.string(),
          email: z.string(),
          status: z.string(),
        }),
      }),
    }),
  ),
})

// Shopify orders/paid webhook
export const shopifyOrderPaidSchema = z.object({
  id: z.number(),
  email: z.string().nullable().optional(),
  customer: z
    .object({ id: z.number().nullable().optional(), email: z.string().nullable().optional() })
    .nullable()
    .optional(),
  line_items: z
    .array(z.object({ product_id: z.number().nullable().optional() }))
    .optional(),
})

// Shopify product revalidate webhook
export const revalidateProductSchema = z.object({
  handle: z.string().optional(),
  id: z.number().optional(),
})

export type CompositionWebhookPayload = z.infer<typeof compositionWebhookSchema>
export type SupportWebhookPayload = z.infer<typeof supportWebhookSchema>
export type MailerLiteWebhookEvent = z.infer<typeof mailerliteWebhookSchema>
export type ShopifyOrderPaidPayload = z.infer<typeof shopifyOrderPaidSchema>
export type RevalidateProductPayload = z.infer<typeof revalidateProductSchema>
