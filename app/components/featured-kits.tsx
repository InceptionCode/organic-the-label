import Image from 'next/image';
import Link from 'next/link';
import { getCachedProducts } from '@/lib/Shopify/products-cache';
import { formatPrice } from '@/utils/helpers/product-helpers';
import { Button } from '@/ui-components/button';

export async function FeaturedKits() {
  const productTable =
    process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products';

  const { products } = await getCachedProducts({ sort: 'newest' }, productTable);
  const featured = products.slice(0, 5);

  if (!featured.length) return null;

  return (
    <div className="section-y-standard content-container">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow mb-8" style={{ color: 'var(--accent-primary)' }}>
            New Arrivals
          </p>
          <h2
            className="text-primary leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '0.02em',
            }}
          >
            FEATURED KITS
          </h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
          <Link href="/store">View all →</Link>
        </Button>
      </div>

      {/* Grid — 1 col mobile → 5 across desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {featured.map((product) => (
          <Link
            key={product.id}
            href={`/store/${product.handle}`}
            className="group card-base card-hover overflow-hidden flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          >
            {/* Image */}
            <div className="relative w-full aspect-square bg-surface-2 overflow-hidden">
              {product.image?.url ? (
                <Image
                  src={product.image.url}
                  alt={product.image.altText || product.name}
                  fill
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-3">
                  <span className="text-muted text-caption">No image</span>
                </div>
              )}
              {/* Red hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(to top, rgba(224,61,42,0.22) 0%, transparent 60%)' }}
              />
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-1 flex-1">
              <span className="eyebrow" style={{ color: 'var(--accent-secondary)' }}>
                {product.category}
              </span>
              <p
                className="text-primary line-clamp-2 leading-snug"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em', fontSize: '0.95rem' }}
              >
                {product.name}
              </p>
              <p className="price-text text-primary mt-auto" style={{ fontSize: '1rem' }}>
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile "view all" */}
      <div className="mt-6 sm:hidden">
        <Link href="/store" className="link text-body-s">
          View all products →
        </Link>
      </div>
    </div>
  );
}
