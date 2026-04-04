'use client';

import { useState } from 'react';
import { LicenseOptions, type LicenseOption } from './license-options';
import { AddToCartPanel } from './add-to-cart-panel';

type ProductPurchaseClientProps = {
  variantId: string;
  availableForSale: boolean;
  licenseOptions: LicenseOption[];
};

export function ProductPurchaseClient({
  variantId: initialVariantId,
  availableForSale,
  licenseOptions,
}: ProductPurchaseClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);

  return (
    <div className="space-y-6">
      {licenseOptions.length > 0 && (
        <LicenseOptions
          options={licenseOptions}
          selectedId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />
      )}
      <AddToCartPanel variantId={selectedVariantId} availableForSale={availableForSale} />
    </div>
  );
}
