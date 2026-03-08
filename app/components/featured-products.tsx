import { Section } from '@/ui-components';
import { Container } from '@/ui-components';
import { ProductGrid } from '@/app/store/components/product-grid';
import type { Product } from '@/lib/schemas';

type FeaturedProductsProps = {
  products: Product[];
  title?: string;
};

export function FeaturedProducts({ products, title = 'Featured' }: FeaturedProductsProps) {
  if (!products.length) return null;

  return (
    <Section variant="standard">
      <Container>
        <h2 className="text-h2 text-primary mb-8">{title}</h2>
        <ProductGrid products={products} />
      </Container>
    </Section>
  );
}
