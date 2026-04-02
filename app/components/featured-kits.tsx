import Image from 'next/image';
import Link from 'next/link';
import { getCachedProducts } from '@/lib/Shopify/products-cache';
import { formatPrice } from '@/utils/helpers/product-helpers';
import { Button } from '@/ui-components/button';

export async function FeaturedKits() {
  const productTable =
    process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products';

  const { products } = await getCachedProducts({ sort: 'newest' }, productTable);
  const featured = products.slice(0, 8);

  if (!featured.length) return null;

  return (
    <div className="section-y-standard">
      {/* Header */}
      <div className="content-container flex items-end justify-between mb-8">
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

      {/* Horizontal scroll carousel */}
      <div
        className="relative"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)',
        }}
      >
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '1.5rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {featured.map((product) => (
            <Link
              key={product.id}
              href={`/store/${product.handle}`}
              className="group relative flex-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] card-glass"
              style={{
                width: '260px',
                borderRadius: '14px',
                scrollSnapAlign: 'start',
              }}
            >
              {/* 3:4 image container */}
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '3/4' }}
              >
                {product.image?.url ? (
                  <Image
                    src={product.image.url}
                    alt={product.image.altText || product.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    sizes="260px"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                      No image
                    </span>
                  </div>
                )}

                {/* Glass info panel — bottom 45% */}
                <div
                  className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4"
                  style={{
                    height: '55%',
                    background:
                      'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 55%, transparent 100%)',
                    backdropFilter: 'blur(0px)',
                    transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
                    transform: 'translateY(0)',
                  }}
                >
                  <span
                    className="block mb-1"
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(212,196,168,0.7)',
                    }}
                  >
                    {product.category}
                  </span>
                  <p
                    className="line-clamp-2 leading-tight mb-2"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.05rem',
                      letterSpacing: '0.02em',
                      color: '#F8F7F2',
                    }}
                  >
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.1rem',
                        color: '#F8F7F2',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {formatPrice(product.price)}
                    </span>
                    {/* Quick View — fades in on hover */}
                    <span
                      className="opacity-0 group-hover:opacity-100"
                      style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        transition: 'opacity 200ms ease',
                      }}
                    >
                      Quick View →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile "view all" */}
      <div className="mt-4 px-6 sm:hidden">
        <Link href="/store" className="link text-body-s">
          View all products →
        </Link>
      </div>
    </div>
  );
}
