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

export type ProductHandleParam = { handle: string };

export default async function ProductContent({ params }: { params: Promise<ProductHandleParam> }) {
  const { handle } = await params;
  const { product, error } = await getCachedProductDetails(handle);
  const previews = parseAudioPreviewUrls(product.metafield?.value);

  if (!product) return notFound();

  const variants = (product as any).variants?.edges ?? [];
  const licenseOptions: LicenseOption[] = variants.map((e: any) => ({
    id: e.node.id,
    title: e.node.title || 'Default',
    price: e.node.price?.amount ?? '0',
    currencyCode: e.node.price?.currencyCode ?? 'USD',
    availableForSale: e.node.availableForSale ?? true,
  }));

  const { products: relatedProducts } = await getCachedProducts(
    { sort: 'newest', category: product.category },
    process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products',
  );

  return (
    <main className="content-container py-8 md:py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          title={product.name}
          featuredImage={product.image}
          images={product.images}
        />
        <div className="space-y-8">
          <ProductInfo
            name={product.name}
            description={product.description}
            descriptionHtml={(product as any).descriptionHtml}
            price={product.price}
          />
          <ProductPurchaseClient
            variantId={product.variantId}
            availableForSale={(product as any).availableForSale !== false}
            licenseOptions={licenseOptions}
          />
        </div>
      </div>
      <div className="p-8">
        {
          previews.length > 0 ? (
            <AudioPreviewList previews={previews} title={product.name} />
          ) : null
        }
      </div>
      <RelatedProducts products={relatedProducts} currentHandle={handle} />
    </main>
  );
}
