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

import AddToCartButton from '@/app/components/add-to-cart';
import FallbackFileSVG from '@/public/file.svg';
import { formatPrice } from '@/utils/helpers/product-helpers';
import type { Product } from '@/lib/schemas';
import { Button } from '@/ui-components/button';
import AudioPreviewList from '@/ui-components/audio-preview-list';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const hasImage = Boolean(product.image?.url);

  return (
    <Card className="card-hover group overflow-hidden w-full max-w-xl flex flex-col">
      <Link href={`/store/${product.handle}`}>
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[3/2] bg-surface-2 overflow-hidden">
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
      </Link>

      <CardContent className="flex-1 px-6 pt-4 pb-0">
        <div className="flex flex-col gap-2 flex-1">
          <span className="eyebrow text-secondary">
            {product.category}
          </span>
          <CardTitle className="text-2xl line-clamp-2 text-primary">
            {product.name}
          </CardTitle>
        </div>
        {product.description && (
          <CardDescription className="text-body-s line-clamp-2 text-muted">
            {product.description}
          </CardDescription>
        )}
        {product.audio_preview && product.audio_preview.preview_url && (
          <AudioPreviewList previews={[product.audio_preview]} title={product.name} />
        )}
      </CardContent>

      <CardFooter className="px-6 pb-5 pt-4 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2 flex-1">
          {product.tags && product.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
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
          <span className="price-text text-primary">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="flex flex-col items-end gap-3">
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
        </div>
      </CardFooter>
    </Card>
  );
}

