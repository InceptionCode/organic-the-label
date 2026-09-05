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

- Purpose: entitlement grants (writes to `entitlements` table) after successful payment
- Endpoint: /api/store/orders/paid
- Auth: `?secret=` shared-secret query gate + Shopify HMAC verification

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

## /composition free loop downloads

- Route: `/composition` lists rows from the Supabase `compositions` table
- Each row's deliverables (full loop audio + terms-of-use file) live in **Shopify Files**
  (Shopify admin → Content → Files), not the Digital Downloads app — that app has no on-demand API
- `/api/composition/download/[slug]` fetches both Shopify Files URLs server-side, zips them with
  `fflate`, and streams one `.zip` (`<slug>/<audio file>` + `<slug>/Terms of Use.<ext>`)
- Content ops per loop: upload the audio + terms files to Shopify Files, copy their `cdn.shopify.com`
  URLs into `audio_file_url` / `terms_file_url`, set `embed_url` to the Instagram permalink or
  YouTube Short URL, then insert the row (or run `pnpm seed:compositions:dev`)
- A shared `organic-sonics-terms-of-use.txt` in Shopify Files can back every row's `terms_file_url`

## Domains / DNS

- www.organicsonics.com = production
- dev.organicsonics.com = dev
- DNS managed by Shopify

## Supabase Auth Flow

See `docs/supabase-auth-flow.md`.
