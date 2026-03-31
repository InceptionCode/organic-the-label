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
    <div className="space-y-4">
      {category && (
        <p className="eyebrow" style={{ color: 'var(--accent-secondary)' }}>
          {category}
        </p>
      )}

      <h1 className="text-display-m md:text-display-l text-primary leading-none">{name}</h1>

      <div className="price-text text-primary">
        <PriceDisplay amount={amount} currencyCode={currencyCode} />
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="meta px-2.5 py-1 rounded-full"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

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
