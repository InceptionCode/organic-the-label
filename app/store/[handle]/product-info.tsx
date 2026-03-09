import { PriceDisplay } from '@/app/components/price-display';

type ProductInfoProps = {
  name: string;
  description?: string | null;
  descriptionHtml?: string | null;
  price: number;
  currencyCode?: string;
};

export function ProductInfo({ name, description, descriptionHtml, price, currencyCode = 'USD' }: ProductInfoProps) {
  const amount = price.toFixed(2);

  return (
    <div className="space-y-4">
      <h1 className="text-display-m md:text-display-l text-primary">{name}</h1>
      <div className="price-text text-primary">
        <PriceDisplay amount={amount} currencyCode={currencyCode} />
      </div>
      {descriptionHtml ? (
        <div
          className="text-body-m text-secondary [&_p]:mb-3"
          dangerouslySetInnerHTML={descriptionHtml ? { __html: descriptionHtml } : undefined}
        />
      ) : (
        <div className="text-body-m text-secondary [&_p]:mb-3">
          {description && description}
        </div>
      )}
    </div>
  );
}
