import {
  RawSearchParams,
  getNormalizedSearchParams,
} from '@/lib/product/normalize-search-params';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import Image from 'next/image';
import Link from 'next/link';
import FallbackFileSVG from '@/public/file.svg';
import { formatCategory, formatPrice } from '@/utils/helpers/product-helpers';

import { getCachedProductsPage } from '@/lib/Shopify/products-cache';

export default async function StoreContent({
  searchParams,
}: {
  searchParams: RawSearchParams | Promise<RawSearchParams>;
}) {
  const isDev = process.env.NODE_ENV === 'development';
  const productTable = isDev ? 'dev_products' : 'prod_products';
  const baseSearchParams = await searchParams
  const normalizedSearchParams = getNormalizedSearchParams(baseSearchParams);

  const { products, hasNext, nextCursor, error } = await getCachedProductsPage(normalizedSearchParams, productTable);
  console.table(products)
  return (
    <>
      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-red-400 text-lg mb-4">Failed to load products</p>
          <p className="text-muted-foreground text-sm">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      )}

      {/* Products Grid */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-lg mb-4">
            {Object.values(normalizedSearchParams).length === 0
              ? 'No products available at the moment.'
              : 'No products match your filters.'}
          </p>
          <p className="text-muted-foreground text-sm">
            {Object.values(normalizedSearchParams).length === 0
              ? 'Check back soon for new releases!'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : !error ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="flex flex-col hover:shadow-lg transition-shadow bg-gray-900 border-gray-800"
              >
                <CardHeader className="p-0">
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gray-800 rounded-t-xl overflow-hidden">
                    {product.image?.url ? (
                      <Image
                        src={product.image.url}
                        alt={product.image.altText || product.name}
                        placeholder='blur'
                        blurDataURL={product.image.url}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <span className="text-4xl font-bold">
                          {product.name.charAt(0)}
                          {
                            <Image
                              src={FallbackFileSVG}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                          }
                        </span>
                      </div>
                    )}
                    {product.is_exclusive && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                          Exclusive
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-6 flex flex-col">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl mb-2 line-clamp-2 text-white">
                    {product.name}
                  </CardTitle>
                  {product.description && (
                    <CardDescription className="text-sm mb-4 line-clamp-2 flex-1 text-gray-400">
                      {product.description}
                    </CardDescription>
                  )}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-white">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.tags.slice(0, 4).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    asChild
                  >
                    <Link href={`/store/${product.id}`}>View Details</Link>
                  </Button>
                  <Button className="flex-1">Add to Cart</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            {hasNext && nextCursor ? (() => {
              const nextParams = new URLSearchParams(baseSearchParams.toString());
              nextParams.set("after", nextCursor);
              return <Link href={`/store?${nextParams.toString()}`}>Next page →</Link>
            })()
              : (
                <span style={{ opacity: 0.7 }}>No more products</span>
              )}
          </div>
          {/* Footer Stats */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-center text-muted-foreground text-sm">
              Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}
