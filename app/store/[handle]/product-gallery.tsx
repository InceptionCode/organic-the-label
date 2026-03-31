"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/schemas';
import { cn } from '@/lib/utils';

type ProductGalleryProps = {
  title: string;
  featuredImage: Product['image'] | null | undefined;
  images?: Product['image'][];
};

export function ProductGallery({ title, featuredImage, images = [] }: ProductGalleryProps) {
  const allImages = featuredImage
    ? [featuredImage, ...images.filter((img) => img?.url !== featuredImage?.url)]
    : images;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = allImages[activeIndex];

  if (!activeImage?.url) {
    return (
      <div className="relative w-full aspect-[4/3] bg-surface-2 rounded-lg overflow-hidden flex items-center justify-center">
        <span className="text-muted text-body-m">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-surface-2"
        style={{ aspectRatio: '1 / 1' }}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.altText ?? title}
          fill
          priority
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(23,23,23,0.35) 0%, transparent 100%)' }}
        />
      </div>

      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {allImages.slice(0, 5).map((img, i) =>
            img?.url ? (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative aspect-square rounded-md overflow-hidden bg-surface-2 transition-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]',
                  activeIndex === i
                    ? 'ring-2 ring-[color:var(--accent-primary)] opacity-100'
                    : 'opacity-60 hover:opacity-90',
                )}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
