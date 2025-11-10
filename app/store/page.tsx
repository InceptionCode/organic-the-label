import { type Product } from '@/lib/schemas';
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
import { StoreFilters } from './components/store-filters';
import { Suspense, use } from 'react';
import { getProductsAction } from '@/app/api/store/get-products';

import FallbackFileSVG from '@/public/file.svg';

// Helper function to format category display
function formatCategory(category: string): string {
  // Remove curly braces if present (e.g., "{kit}" -> "kit")
  const cleaned = category.replace(/[{}]/g, '').toLowerCase();
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Helper function to format price
function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

// Filter and sort products based on search params
function filterAndSortProducts(
  products: Product[],
  searchParams: {
    search?: string | null;
    category?: string | null;
    sort?: string | null;
    exclusive?: string | null;
  },
): Product[] {
  let filtered = [...products];

  // Apply search filter - using optional chaining and nullish coalescing for safety
  const searchQuery = searchParams?.search?.trim();
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }

  // Apply category filter
  if (searchParams.category && searchParams.category !== 'all') {
    filtered = filtered.filter((product) => {
      const productCategory = product.category.replace(/[{}]/g, '').toLowerCase();
      return productCategory === searchParams.category?.toLowerCase();
    });
  }

  // Apply exclusive filter
  if (searchParams.exclusive === 'true') {
    filtered = filtered.filter((product) => product.is_exclusive === true);
  }

  // Apply sorting
  const sort = searchParams.sort || 'newest';
  switch (sort) {
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'newest':
    default:
      // Already sorted by created_at in the query, or keep original order
      break;
  }

  return filtered;
}

// Type for search params (can be a Promise in Next.js 15)
type SearchParams =
  | {
      search?: string;
      category?: string;
      sort?: string;
      exclusive?: string;
    }
  | Promise<{
      search?: string;
      category?: string;
      sort?: string;
      exclusive?: string;
    }>;

/**
 * Products list component that uses React's use() API
 * Must be wrapped in Suspense boundary to handle Suspense exceptions
 */
function ProductsList({
  resolvedSearchParams,
}: {
  resolvedSearchParams: {
    search?: string | null;
    category?: string | null;
    sort?: string | null;
    exclusive?: string | null;
  };
}) {
  // Use React's use() API for products promise

  const productsPromise = getProductsAction();
  const { products: allProducts, error } = use(productsPromise);
  const filteredProducts = filterAndSortProducts(allProducts, resolvedSearchParams);

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
      {!error && filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-lg mb-4">
            {allProducts.length === 0
              ? 'No products available at the moment.'
              : 'No products match your filters.'}
          </p>
          <p className="text-muted-foreground text-sm">
            {allProducts.length === 0
              ? 'Check back soon for new releases!'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : !error ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="flex flex-col hover:shadow-lg transition-shadow bg-gray-900 border-gray-800"
              >
                <CardHeader className="p-0">
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gray-800 rounded-t-xl overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
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
                      {formatCategory(product.category)}
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
                        {product.tags.slice(0, 3).map((tag, index) => (
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

          {/* Footer Stats */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-center text-muted-foreground text-sm">
              Showing {filteredProducts.length} of {allProducts.length}{' '}
              {allProducts.length === 1 ? 'product' : 'products'}
              {filteredProducts.length !== allProducts.length && ' (filtered)'}
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}

/**
 * Store content component that handles searchParams and products
 */
function StoreContent({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = use(
    searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams),
  );

  return (
    <>
      {/* Filters */}
      <Suspense fallback={<div className="mb-8 h-32 bg-gray-900 rounded animate-pulse" />}>
        <StoreFilters />
      </Suspense>

      {/* Products List - Wrapped in Suspense to handle use() Suspense exceptions */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-muted-foreground text-lg mb-4">Loading products...</div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-900 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <ProductsList resolvedSearchParams={resolvedSearchParams} />
      </Suspense>
    </>
  );
}

/**
 * Store page component that displays products with filtering and sorting
 */
export default function Store({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Store</h1>
        <p className="text-muted-foreground text-lg">
          Browse our collection of beats, kits, packs, and merchandise
        </p>
      </div>

      {/* Store Content - Wrapped in Suspense to handle searchParams use() call */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-muted-foreground text-lg mb-4">Loading store...</div>
          </div>
        }
      >
        <StoreContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
