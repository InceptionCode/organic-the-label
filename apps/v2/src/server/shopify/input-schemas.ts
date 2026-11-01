import { z } from 'zod'

// Server fn input schemas (catalog.fn.ts, cart.fn.ts). Kept apart from types.ts on purpose: the client
// build strips `.validator()`, so this module never reaches the browser, while types.ts is imported by
// client code (CART_UNAVAILABLE_MESSAGE) and would otherwise carry zod into the entry chunk (phase 07.6).

export const getProductInputSchema = z.object({
  handle: z.string().min(1).max(255),
})
export type GetProductInput = z.infer<typeof getProductInputSchema>

export const getNewestProductsInputSchema = z.object({
  n: z.number().int().min(1).max(50),
})
export type GetNewestProductsInput = z.infer<typeof getNewestProductsInputSchema>

export const listProductsInputSchema = z.object({
  sort: z.enum(['newest', 'price-low', 'price-high', 'name-asc', 'name-desc']).optional(),
  category: z.string().max(40).nullish(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  exclusive: z.boolean().optional(),
  search: z.string().max(100).nullish(),
  after: z.string().max(512).nullish(),
})
export type ListProductsInput = z.infer<typeof listProductsInputSchema>

export const addToCartInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
})
export type AddToCartInput = z.infer<typeof addToCartInputSchema>

export const updateCartLineInputSchema = z.object({
  lineId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
})
export type UpdateCartLineInput = z.infer<typeof updateCartLineInputSchema>

export const removeCartLinesInputSchema = z.object({
  lineIds: z.array(z.string().min(1)).min(1).max(50),
})
export type RemoveCartLinesInput = z.infer<typeof removeCartLinesInputSchema>
