import { notFound } from 'next/navigation';
import { getCachedProductDetails } from '@/lib/Shopify/products-details-cache';
import { getCachedProducts } from '@/lib/Shopify/products-cache';
import { ProductGallery } from './product-gallery';
import { ProductInfo } from './product-info';
import { type LicenseOption } from './license-options';
import { ProductPurchaseClient } from './product-purchase-client';
import { RelatedProducts } from './related-products';
import { parseAudioPreviewUrls } from '@/utils/helpers/parse-preview-urls';
import AudioPreviewList from '@/ui-components/audio-preview-list';
import ProductViewTracker from './product-view-tracker';

export type ProductHandleParam = { handle: string };

type ProductVariants = {
  variants?: {
    edges: {
      node: {
        id: string;
        title?: string | null;
        price?: {
          amount: string;
          currencyCode: string;
        };
        availableForSale?: boolean | null;
      };
    }[];
  };
};

export default async function ProductContent({ params }: { params: Promise<ProductHandleParam> }) {
  const { handle } = await params;
  const { product } = await getCachedProductDetails(handle);

  if (!product) return notFound();

  const previews = parseAudioPreviewUrls(product.metafield?.value);
  const variants = (product as ProductVariants).variants?.edges ?? [];
  const licenseOptions: LicenseOption[] = variants.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title || 'Default',
    price: edge.node.price?.amount ?? '0',
    currencyCode: edge.node.price?.currencyCode ?? 'USD',
    availableForSale: edge.node.availableForSale ?? true,
  }));

  const { products: relatedProducts } = await getCachedProducts(
    { sort: 'newest', category: product.category },
    process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products',
  );

  return (
    <div>
      <ProductViewTracker handle={handle} tags={product.tags ?? []} category={product.category} />
      <div className="content-container py-8 md:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px] lg:gap-14 xl:gap-20">

          {/* Left: Gallery */}
          <ProductGallery
            title={product.name}
            featuredImage={product.image}
            images={product.images}
          />

          {/* Right: Info + Purchase (sticky on large screens) */}
          <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
            <ProductInfo
              name={product.name}
              description={product.description}
              descriptionHtml={(product as ProductVariants & { descriptionHtml?: string }).descriptionHtml}
              price={product.price}
              category={product.category}
              tags={product.tags}
            />
            <ProductPurchaseClient
              variantId={product.variantId}
              availableForSale={(product as ProductVariants & { availableForSale?: boolean }).availableForSale !== false}
              licenseOptions={licenseOptions}
            />

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: '⚡', label: 'Instant Download' },
                { icon: '🔒', label: 'Secure Checkout' },
                { icon: '📧', label: 'Email Delivery' },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
                >
                  <span aria-hidden>{badge.icon}</span>
                  <span className="text-caption text-muted">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {previews.length > 0 && (
          <div
            className="mt-14 pt-10"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <div className="mb-6">
              <p className="eyebrow mb-2" style={{ color: 'var(--accent-secondary)' }}>
                Listen before you buy
              </p>
              <h2
                className="text-primary"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                }}
              >
                AUDIO PREVIEWS
              </h2>
            </div>
            <div className="max-w-2xl">
              <AudioPreviewList previews={previews} />
            </div>
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <RelatedProducts products={relatedProducts} currentHandle={handle} />
      </div>
    </div>
  );
}
