"use client";

import { motion } from 'framer-motion';
import type { Product } from '@/lib/schemas';
import { ProductCard } from './product-card';

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="py-16 text-center text-muted">
        <p className="text-body-m">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          className="flex flex-col"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: (i % 4) * 0.05,
          }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}
