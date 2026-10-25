import {
  ProductPreviewUrlsSchema,
  ProductWhatsIncludedSchema,
  type ProductPreviewUrls,
  type ProductWhatsIncluded,
} from '@organic/content-schema'
import type { RawCart, RawImage, RawProduct, RawProductSummary, ProductsListData } from './queries'
import type { Cart, Product, ProductPage, ProductSummary, ShopifyImage } from './types'

function parseJsonMetafield<T>(value: string | null | undefined, schema: { safeParse(v: unknown): { success: true; data: T } | { success: false } }, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = schema.safeParse(JSON.parse(value))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

export function parseImage(image: RawImage | null | undefined): ShopifyImage | null {
  if (!image?.url) return null
  return {
    url: image.url,
    altText: image.altText ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
  }
}

export function parseAudioPreviews(value: string | null | undefined): ProductPreviewUrls {
  return parseJsonMetafield<ProductPreviewUrls>(value, ProductPreviewUrlsSchema, [])
}

export function parseWhatsIncluded(value: string | null | undefined): ProductWhatsIncluded {
  return parseJsonMetafield<ProductWhatsIncluded>(value, ProductWhatsIncludedSchema, [])
}

export function parseProductSummary(raw: RawProductSummary): ProductSummary {
  const variant = raw.variants.edges[0]?.node ?? null
  const tags = raw.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    createdAt: raw.createdAt,
    category: raw.productType.trim().toLowerCase(),
    tags,
    isExclusive: tags.includes('exclusive'),
    availableForSale: raw.availableForSale,
    image: parseImage(raw.featuredImage),
    variantId: variant?.id ?? null,
    price: variant ? { amount: variant.price.amount, currencyCode: variant.price.currencyCode } : null,
    audioPreview: parseAudioPreviews(raw.audioPreviewMetafield?.value)[0] ?? null,
  }
}

export function parseProduct(raw: RawProduct): Product {
  const images = raw.images.edges.map((e) => parseImage(e.node)).filter((i): i is ShopifyImage => i !== null)
  return {
    ...parseProductSummary(raw),
    image: parseImage(raw.featuredImage) ?? images[0] ?? null,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    images,
    audioPreviews: parseAudioPreviews(raw.audioPreviewMetafield?.value),
    whatsIncluded: parseWhatsIncluded(raw.whatsIncludedMetafield?.value),
  }
}

export function parseProductPage(data: ProductsListData): ProductPage {
  return {
    products: data.products.edges.map((e) => parseProductSummary(e.node)),
    pageInfo: {
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor,
    },
  }
}

export function parseCart(raw: RawCart | null | undefined): Cart | null {
  if (!raw) return null
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: { subtotalAmount: raw.cost.subtotalAmount, totalAmount: raw.cost.totalAmount },
    lines: raw.lines.edges.map(({ node }) => ({
      id: node.id,
      quantity: node.quantity,
      merchandise: {
        id: node.merchandise.id,
        title: node.merchandise.title,
        price: node.merchandise.price,
        product: { handle: node.merchandise.product.handle, title: node.merchandise.product.title },
        image: parseImage(node.merchandise.image),
      },
    })),
  }
}
