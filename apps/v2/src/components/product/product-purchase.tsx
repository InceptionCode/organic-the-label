import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ownedLibraryHash, resolveOwnedAccess, useOwnedProducts } from '~/lib/use-owned'
import type { OwnedProduct } from '~/server/account/owned-products'
import type { LicenseOption, Product } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { AddToCartPanel } from './add-to-cart-panel'
import { LicenseOptions } from './license-options'
import { OwnedAccessLink } from './owned-access-link'
import { OwnedBadge } from './product-card'

/** Every variant as a license option; falls back to the summary variant for older cache entries. */
function licenseOptionsOf(product: Product): LicenseOption[] {
  if (product.licenseOptions?.length) return product.licenseOptions
  if (!product.variantId || !product.price) return []
  return [{ id: product.variantId, title: product.title, price: product.price, availableForSale: product.availableForSale }]
}

export function ProductPurchase({ product }: { product: Product }) {
  const owned = useOwnedProducts().get(product.id)
  const options = licenseOptionsOf(product)
  const initial = options.find((o) => o.id === product.variantId && o.availableForSale) ?? options.find((o) => o.availableForSale) ?? options[0]
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null)
  const selected = options.find((o) => o.id === selectedId)
  const available = product.availableForSale && (selected?.availableForSale ?? false)

  if (owned) return <OwnedPurchase owned={owned} handle={product.handle} title={product.title} />

  return (
    <div className="space-y-6">
      <LicenseOptions options={options} selectedId={selectedId} onSelect={setSelectedId} />
      <AddToCartPanel variantId={selectedId} availableForSale={available} />
    </div>
  )
}

/**
 * Owned state: replaces license options and add-to-cart. v2 has no per-product download URL for paid
 * products yet (buyers get files through Shopify), so the primary is "Request access": /contact
 * prefilled with an access request and the order id. A direct URL, when one exists, becomes "Access".
 */
function OwnedPurchase({ owned, handle, title }: { owned: OwnedProduct; handle: string; title: string }) {
  const hash = ownedLibraryHash(handle)
  return (
    <div className="space-y-5" data-testid="owned-purchase">
      <div className="flex items-center gap-3">
        <OwnedBadge />
        <p className="text-body-m text-primary">You own this.</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <OwnedAccessLink access={resolveOwnedAccess(owned)} title={title} size="lg" className="min-w-0 flex-1" />
        <Link
          to="/account"
          hash={hash}
          className={cn(
            'link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]',
          )}
        >
          View in your library
        </Link>
      </div>
    </div>
  )
}
