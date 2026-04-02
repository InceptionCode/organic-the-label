import { getCachedProducts } from '@/lib/Shopify/products-cache';
import { StickyProductBar } from './sticky-product-bar';

export async function StickyProductBarServer() {
  try {
    const productTable =
      process.env.NODE_ENV === 'development' ? 'dev_products' : 'prod_products';
    const { products } = await getCachedProducts({ sort: 'newest' }, productTable);
    const featured = products.slice(0, 5);
    if (!featured.length) return null;
    return <StickyProductBar products={featured} />;
  } catch {
    return null;
  }
}
