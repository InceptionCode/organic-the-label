import type { ProductPreviewUrls, ProductWhatsIncluded } from '@organic/content-schema'
import { z } from 'zod'

export type Money = { amount: string; currencyCode: string }

export type ShopifyImage = {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export type AudioPreview = ProductPreviewUrls[number]

export type ProductSummary = {
  id: string
  handle: string
  title: string
  createdAt: string
  /** Lowercased Shopify productType. */
  category: string
  /** Lowercased Shopify tags. */
  tags: string[]
  isExclusive: boolean
  availableForSale: boolean
  image: ShopifyImage | null
  variantId: string | null
  price: Money | null
  audioPreview: AudioPreview | null
}

export type Product = ProductSummary & {
  description: string
  descriptionHtml: string
  images: ShopifyImage[]
  audioPreviews: ProductPreviewUrls
  whatsIncluded: ProductWhatsIncluded
}

export type PageInfo = { hasNextPage: boolean; endCursor: string | null }

export type ProductPage = { products: ProductSummary[]; pageInfo: PageInfo }

export type ProductSitemapEntry = { handle: string; updatedAt: string }

export const getProductInputSchema = z.object({
  handle: z.string().min(1),
})
export type GetProductInput = z.infer<typeof getProductInputSchema>

export const getNewestProductsInputSchema = z.object({
  n: z.number().int().min(1).max(50),
})
export type GetNewestProductsInput = z.infer<typeof getNewestProductsInputSchema>

export const listProductsInputSchema = z.object({
  sort: z.enum(['newest', 'price-low', 'price-high', 'name-asc', 'name-desc']).optional(),
  category: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  exclusive: z.boolean().optional(),
  after: z.string().nullish(),
})
export type ListProductsInput = z.infer<typeof listProductsInputSchema>

export const searchProductsInputSchema = z.object({
  q: z.string().max(100),
})
export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>

export type CartLine = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: Money
    product: { handle: string; title: string }
    image: ShopifyImage | null
  }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: Money; totalAmount: Money }
  lines: CartLine[]
}

export type CartUserError = { field: string[] | null; message: string; code?: string | null }

export type CartResult = { cart: Cart | null; userErrors: CartUserError[] }

export type CartLineInput = { merchandiseId: string; quantity: number }
export type CartLineUpdateInput = { id: string; quantity: number }

export const addToCartInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
})
export type AddToCartInput = z.infer<typeof addToCartInputSchema>

export const updateCartLinesInputSchema = z.object({
  lines: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(0).max(99),
      }),
    )
    .min(1),
})
export type UpdateCartLinesInput = z.infer<typeof updateCartLinesInputSchema>

export const removeCartLinesInputSchema = z.object({
  lineIds: z.array(z.string().min(1)).min(1),
})
export type RemoveCartLinesInput = z.infer<typeof removeCartLinesInputSchema>
