import { Section } from '@/ui-components';
import { Container } from '@/ui-components';
import { ProductGrid } from '@/app/store/components/product-grid';
import type { Product } from '@/lib/schemas';

type RelatedProductsProps = {
  products: Product[];
  currentHandle?: string;
};

export function RelatedProducts({ products, currentHandle }: RelatedProductsProps) {
  const filtered = currentHandle ? products.filter((p) => p.handle !== currentHandle) : products;
  const slice = filtered.slice(0, 4);
  if (slice.length === 0) return null;

  return (
    <Section variant="compact">
      <Container>
        <h2 className="text-h2 text-primary mb-6">You might also like</h2>
        <ProductGrid products={slice} />
      </Container>
    </Section>
  );
}
