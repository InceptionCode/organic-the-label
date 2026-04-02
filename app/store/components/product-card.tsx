import Image from 'next/image';
import Link from 'next/link';

import AddToCartButton from '@/app/components/add-to-cart';
import FallbackFileSVG from '@/public/file.svg';
import { formatPrice } from '@/utils/helpers/product-helpers';
import type { Product } from '@/lib/schemas';
import AudioPreviewList from '@/ui-components/audio-preview-list';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const hasImage = Boolean(product.image?.url);
  const tags = product.tags?.slice(0, 3) ?? [];
  const hasAudio = Boolean(product.audio_preview?.preview_url);

  return (
    <div
      className="group relative flex flex-col w-full h-full card-glass"
      style={{ borderRadius: '14px', overflow: 'hidden' }}
    >
      {/* 3:4 image area */}
      <Link
        href={`/store/${product.handle}`}
        className="relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
        style={{ aspectRatio: '3/4' }}
      >
        {hasImage ? (
          <Image
            src={product.image!.url as string}
            alt={product.image?.altText || product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Image src={FallbackFileSVG} alt={product.name} fill className="object-contain" />
          </div>
        )}

        {/* Glass info panel — bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 transition-transform duration-300 ease-out group-hover:-translate-y-1"
          style={{
            height: '55%',
            background:
              'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.72) 50%, transparent 100%)',
          }}
        >
          {/* Category + tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {product.category && (
              <span
                style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  opacity: 0.9,
                }}
              >
                {product.category}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.55rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(212,196,168,0.55)',
                  background: 'rgba(255,255,255,0.07)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p
            className="line-clamp-2 leading-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.05rem',
              letterSpacing: '0.02em',
              color: '#F8F7F2',
            }}
          >
            {product.name}
          </p>
        </div>

        {/* Exclusive badge */}
        {product.is_exclusive && (
          <div className="absolute top-3 left-3">
            <span
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'rgba(224,61,42,0.15)',
                color: 'var(--accent-primary)',
                padding: '3px 9px',
                borderRadius: '999px',
                border: '1px solid rgba(224,61,42,0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Exclusive
            </span>
          </div>
        )}
      </Link>

      {/* Bottom section — price + actions + audio preview */}
      <div
        className="flex flex-col mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Price + action row */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.1rem',
              letterSpacing: '0.02em',
              color: '#F8F7F2',
            }}
          >
            {formatPrice(product.price)}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/store/${product.handle}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(212,196,168,0.7)',
                textDecoration: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'border-color 150ms ease, color 150ms ease',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              View
            </Link>
            <AddToCartButton variantId={product.variantId} />
          </div>
        </div>

        {/* Audio preview — full width at bottom */}
        {hasAudio && (
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '0 0 4px 0',
            }}
          >
            <AudioPreviewList previews={[product.audio_preview!]} title={product.name} />
          </div>
        )}
      </div>
    </div>
  );
}
