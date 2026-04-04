"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
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
      <div
        className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '1/1', borderRadius: '18px', background: 'rgba(255,255,255,0.04)' }}
      >
        <span className="text-muted text-body-m">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '1 / 1', borderRadius: '18px', background: '#111' }}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.altText ?? title}
          fill
          priority
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.5) 0%, transparent 100%)' }}
        />

        {/* Grain overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            borderRadius: '18px',
          }}
        />
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {allImages.slice(0, 6).map((img, i) =>
            img?.url ? (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative flex-none overflow-hidden transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]',
                  activeIndex === i ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                )}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  background: '#111',
                  border: activeIndex === i
                    ? '2px solid var(--accent-primary)'
                    : '2px solid transparent',
                  minWidth: '64px',
                }}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {/* Play icon for video thumbnails (future) */}
                {img.altText?.includes('video') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play size={16} className="text-white" />
                  </div>
                )}
              </button>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
