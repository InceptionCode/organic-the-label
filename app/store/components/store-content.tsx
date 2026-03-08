import {
  RawSearchParams,
  getNormalizedSearchParams,
} from '@/lib/product/normalize-search-params';

import { getCachedProducts } from '@/lib/Shopify/products-cache';
import HistoryBackButton from '@/app/components/history-backbutton';
import PrefetchNext from '@/app/components/prefetch-next';
import { ProductGrid } from '@/app/store/components/product-grid';

export default async function StoreContent({
  searchParams,
}: {
  searchParams: RawSearchParams | Promise<RawSearchParams>;
}) {
  const isDev = process.env.NODE_ENV === 'development';
  const productTable = isDev ? 'dev_products' : 'prod_products';
  const baseSearchParams = await searchParams
  const normalizedSearchParams = getNormalizedSearchParams(baseSearchParams);

  const { products, hasNext, nextCursor, error } = await getCachedProducts(normalizedSearchParams, productTable);

  return (
    <>
      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[color:var(--danger)] text-body-l mb-4">Failed to load products</p>
          <p className="text-muted text-body-s">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      )}

      {/* Products Grid */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-secondary text-body-l mb-4">
            {Object.values(normalizedSearchParams).length === 0
              ? 'No products available at the moment.'
              : 'No products match your filters.'}
          </p>
          <p className="text-muted text-body-s">
            {Object.values(normalizedSearchParams).length === 0
              ? 'Check back soon for new releases!'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : !error ? (
        <>
          <ProductGrid products={products} />
          <div style={{ marginTop: 24 }}>
            {/* Back Button */}
            <HistoryBackButton />
            {/* Next Button */}
            {hasNext && nextCursor ? (() => {
              const nextParams = new URLSearchParams(baseSearchParams.toString());
              nextParams.set("after", nextCursor);
              return <PrefetchNext href={`/store?${nextParams.toString()}`} label='Next page →' />
            })() : null}
          </div>
          {/* Footer Stats */}
          <div className="mt-12 pt-8 border-t border-subtle">
            <p className="text-center text-muted text-body-s">
              Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}
