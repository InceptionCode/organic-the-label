# Shopify Ops

## Storefront API

- SHOPIFY_STORE_DOMAIN
- SHOPIFY_STOREFRONT_ACCESS_TOKEN
- Used by: product listing, PDP, cart

Used for:

- product grid
- PDP
- cart
- checkout URL generation

## Webhooks

### products/update

- Purpose: revalidate PDP cache
- Endpoint: /api/store/revalidate-product

### orders/paid

- Purpose: future entitlement reconciliation / analytics
- Endpoint: TBD

## Product metafields

### custom.audio_preview_urls

- Type: JSON -> ProductPreviewUrls
- Stores: array of Shopify Files audio preview URLs

Example:
[
{preview_title: "beat 1", preview_url: "https://cdn.shopify.com/s/files/.../preview-1.mp3?v=123"},
{preview_title: "beat 2", preview_url: "https://cdn.shopify.com/s/files/.../preview-2.mp3?v=456"}
]

## Digital downloads & Checkout

- Fulfillment handled by Shopify Digital Downloads app
- Full deliverables are attached there
- Public previews are hosted in Shopify Files

## Domains / DNS

- www.organicsonics.com = production
- dev.organicsonics.com = dev
- DNS managed by Shopify
