import Image from 'next/image';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import AddToCartButton from '@/app/components/add-to-cart';
import FallbackFileSVG from '@/public/file.svg';
import { formatPrice } from '@/utils/helpers/product-helpers';
import type { Product } from '@/lib/schemas';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const hasImage = Boolean(product.image?.url);

  return (
    <Card className="card-hover group overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative w-full aspect-[4/3] bg-surface-2 overflow-hidden">
          {hasImage ? (
            <Image
              src={product.image!.url as string}
              alt={product.image?.altText || product.name}
              placeholder="blur"
              blurDataURL={product.image!.url as string}
              fill
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-surface-3/40 text-muted">
              <Image src={FallbackFileSVG} alt={product.name} fill className="object-contain" />
            </div>
          )}

          {product.is_exclusive && (
            <div className="absolute top-3 right-3">
              <span className="eyebrow bg-[color:var(--accent-primary-soft)] text-[color:var(--accent-primary)] px-2 py-1 rounded-full">
                Exclusive
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-5 pb-4 flex flex-col gap-3">
        <div className="space-y-2">
          <span className="eyebrow text-secondary">
            {product.category}
          </span>
          <CardTitle className="text-h4 line-clamp-2 text-primary">
            {product.name}
          </CardTitle>
        </div>

        {product.description && (
          <CardDescription className="text-body-s line-clamp-2 text-muted mt-1">
            {product.description}
          </CardDescription>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {product.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="meta bg-surface-2/80 text-secondary px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-5 px-6 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="price-text text-primary">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <Link href={`/store/${product.handle}`}>View product</Link>
          </Button>
          <AddToCartButton variantId={product.variantId} />
        </div>
      </CardFooter>
    </Card>
  );
}

