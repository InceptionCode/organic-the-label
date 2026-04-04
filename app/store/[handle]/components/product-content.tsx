import { notFound } from 'next/navigation';
import { getCachedProductDetails } from '@/lib/Shopify/products-details-cache';
import { getCachedProducts } from '@/lib/Shopify/products-cache';
import { ProductGallery } from './product-gallery';
import { ProductInfo } from './product-info';
import { type LicenseOption } from './license-options';
import { ProductPurchaseClient } from './product-purchase-client';
import { RelatedProducts } from './related-products';
import { parseAudioPreviewUrls } from '@/utils/helpers/parse-preview-urls';
import { parseWhatsIncluded } from '@/utils/helpers/parse-whats-included';
import AudioPreviewList from '@/ui-components/audio-preview-list';
import { WaveformPlayer } from '@/app/components/waveform-player';
import { WhatsIncluded } from './whats-included';
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

  // Parse audio previews from aliased metafield
  const previews = parseAudioPreviewUrls(
    (product as typeof product & { audioPreviewMetafield?: { value?: string | null } | null })
      .audioPreviewMetafield?.value
  );

  // Parse what's included from aliased metafield
  const whatsIncludedItems = parseWhatsIncluded(
    (product as typeof product & { whatsIncludedMetafield?: { value?: string | null } | null })
      .whatsIncludedMetafield?.value
  );

  const variants = (product as ProductVariants).variants?.edges ?? [];
  const licenseOptions: LicenseOption[] = variants.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title || product.name,
    price: edge.node.price?.amount ?? '0',
    currencyCode: edge.node.price?.currencyCode ?? 'USD',
    availableForSale: edge.node.availableForSale ?? true,
  }));

  const { products: relatedProducts } = await getCachedProducts(
    { sort: 'newest', category: product.category },
    process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products',
  );

  // Star track = first preview; remaining list shown below the grid
  const starPreview = previews[0] ?? null;
  const remainingPreviews = previews.slice(1);

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

          {/* Right: Info + Waveform + Purchase (sticky on large screens) */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <ProductInfo
              name={product.name}
              description={product.description}
              descriptionHtml={(product as ProductVariants & { descriptionHtml?: string }).descriptionHtml}
              price={product.price}
              category={product.category}
              tags={product.tags}
            />

            {/* Star waveform player — shown before Add to Cart if a preview exists */}
            {starPreview && (
              <WaveformPlayer
                src={starPreview.preview_url}
                title={starPreview.preview_title}
              />
            )}

            <ProductPurchaseClient
              variantId={product.variantId}
              availableForSale={(product as ProductVariants & { availableForSale?: boolean }).availableForSale !== false}
              licenseOptions={licenseOptions}
            />

            {/* Red gradient divider */}
            <div
              style={{
                height: '1px',
                background:
                  'linear-gradient(to right, var(--accent-primary), rgba(224,61,42,0.15), transparent)',
                opacity: 0.5,
              }}
            />

            {/* Trust badges — styled pill chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: '⚡', label: 'Instant Download' },
                { icon: '🔒', label: 'Secure Checkout' },
                { icon: '📧', label: 'Email Delivery' },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(224,61,42,0.18)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span aria-hidden style={{ fontSize: '0.8rem' }}>{badge.icon}</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(212,196,168,0.8)',
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Previews — always shown below grid if remaining tracks exist */}
        {remainingPreviews.length > 0 && (
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
              <AudioPreviewList previews={remainingPreviews} />
            </div>
          </div>
        )}

        {/* What's Included — only if metafield data exists */}
        <WhatsIncluded items={whatsIncludedItems} category={product.category} />

      </div>
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <RelatedProducts products={relatedProducts} currentHandle={handle} />
      </div>
    </div>
  );
}
