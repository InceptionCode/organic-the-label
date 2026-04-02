import { PriceDisplay } from '@/app/components/price-display';
import type { Product } from '@/lib/schemas';

type ProductInfoProps = {
  name: string;
  description?: string | null;
  descriptionHtml?: string | null;
  price: number;
  currencyCode?: string;
  category?: Product['category'];
  tags?: Product['tags'];
};

export function ProductInfo({
  name,
  description,
  descriptionHtml,
  price,
  currencyCode = 'USD',
  category,
  tags,
}: ProductInfoProps) {
  const amount = price.toFixed(2);

  return (
    <div className="space-y-5">
      {/* Eyebrow with decorative lines */}
      {category && (
        <div className="flex items-center gap-3">
          <span
            style={{
              display: 'block',
              height: '1px',
              width: '24px',
              background: 'var(--accent-primary)',
              opacity: 0.75,
            }}
          />
          <p
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--accent-secondary)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {category}
          </p>
          <span
            style={{
              display: 'block',
              height: '1px',
              width: '16px',
              background: 'var(--accent-primary)',
              opacity: 0.3,
            }}
          />
        </div>
      )}

      {/* Product name — Bebas Neue, large */}
      <h1
        className="text-primary leading-none"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {name}
      </h1>

      {/* Price row */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
          }}
        >
          <PriceDisplay amount={amount} currencyCode={currencyCode} />
        </span>
        {price === 0 && (
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'rgba(224,61,42,0.12)',
              color: 'var(--accent-primary)',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(224,61,42,0.25)',
            }}
          >
            Free
          </span>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'rgba(212,196,168,0.65)',
                background: 'rgba(255,255,255,0.06)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Red gradient divider */}
      <div
        style={{
          height: '1px',
          background:
            'linear-gradient(to right, var(--accent-primary), rgba(224,61,42,0.15), transparent)',
          opacity: 0.6,
        }}
      />

      {/* Description */}
      {descriptionHtml ? (
        <div
          className="text-body-m text-secondary [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : description ? (
        <p className="text-body-m text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
