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

export type LicenseOption = {
  id: string
  /** Variant title; Shopify's "Default Title" is replaced by the product title. */
  title: string
  price: Money
  availableForSale: boolean
}

export type Product = ProductSummary & {
  description: string
  /** Sanitized in the service before caching (no script/style, handlers, javascript: URLs). */
  descriptionHtml: string
  /** Every variant, in Shopify order. One entry for single-variant products. */
  licenseOptions: LicenseOption[]
  images: ShopifyImage[]
  audioPreviews: ProductPreviewUrls
  whatsIncluded: ProductWhatsIncluded
}

export type PageInfo = { hasNextPage: boolean; endCursor: string | null }

export type ProductPage = { products: ProductSummary[]; pageInfo: PageInfo }

export type ProductSitemapEntry = { handle: string; updatedAt: string }

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

export const updateCartLineInputSchema = z.object({
  lineId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
})
export type UpdateCartLineInput = z.infer<typeof updateCartLineInputSchema>

export const removeCartLinesInputSchema = z.object({
  lineIds: z.array(z.string().min(1)).min(1).max(50),
})
export type RemoveCartLinesInput = z.infer<typeof removeCartLinesInputSchema>

/** Shown for any thrown cart failure (network, Shopify outage, gateway error). */
export const CART_UNAVAILABLE_MESSAGE = 'Cart is unavailable right now. Please try again.'

/** What the adapter should do with the `cartId` cookie after a cart operation. */
export type CartCookieAction = 'keep' | 'clear' | { set: string }

export type CartOutcome = { result: CartResult; cookie: CartCookieAction }
