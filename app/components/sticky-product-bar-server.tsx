import type { Product } from '@/lib/schemas';
import { getCachedProducts } from '@/lib/Shopify/products-cache';
import { StickyProductBar } from './sticky-product-bar';

export async function StickyProductBarServer() {
  let featured: Product[] = [];
  try {
    const productTable =
      process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products';
    const { products } = await getCachedProducts({ sort: 'newest' }, productTable);
    featured = products.slice(0, 5);
  } catch {
    return null;
  }
  if (!featured.length) return null;
  return <StickyProductBar products={featured} />;
}
