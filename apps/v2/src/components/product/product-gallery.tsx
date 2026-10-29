import { useState } from 'react'
import type { ShopifyImage as ShopifyImageData } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { ShopifyImage } from '~/ui/shopify-image'

type ProductGalleryProps = { title: string; featuredImage: ShopifyImageData | null; images: ShopifyImageData[] }

const ratioOf = (img: ShopifyImageData) => (img.width && img.height ? img.width / img.height : 1)

/**
 * The artwork at its real aspect ratio (never cropped), square corners, no frame. Thumbnails are a
 * flat strip; the active one carries a 2px red bar. Swapped-in images cross-fade (opacity only).
 */
export function ProductGallery({ title, featuredImage, images }: ProductGalleryProps) {
  const all = featuredImage ? [featuredImage, ...images.filter((img) => img.url !== featuredImage.url)] : images
  const [activeIndex, setActiveIndex] = useState(0)
  const active = all[activeIndex] ?? all[0]

  if (!active?.url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-surface-1">
        <span className="text-label">No image</span>
      </div>
    )
  }

  const ratio = ratioOf(active)

  return (
    <div>
      {/* Capped at 80svh so tall art never pushes the buy column's partner content far below the fold. */}
      <div className="relative w-full overflow-hidden bg-surface-1" style={{ aspectRatio: ratio, maxWidth: `min(100%, calc(80svh * ${ratio}))` }}>
        <ShopifyImage
          key={active.url}
          src={active.url}
          alt={active.altText ?? title}
          width={active.width ?? 1200}
          height={active.height ?? 1200}
          sizes="(max-width: 1023px) 100vw, 58vw"
          // The first image is the LCP element; swapped-in images load on demand.
          priority={activeIndex === 0}
          className={cn('absolute inset-0 size-full object-contain', activeIndex !== 0 && 'os-fade-in')}
        />
      </div>

      {all.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto p-1">
          {all.slice(0, 6).map((img, i) => {
            const selected = activeIndex === i
            return (
              <button
                key={img.url}
                type="button"
                aria-label={`View image ${i + 1}`}
                aria-pressed={selected}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'group/thumb relative flex-none pb-2 outline-none hover:cursor-pointer active:scale-[0.96] touch-manipulation focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] transition-transform duration-150',
                )}
              >
                <span className={cn('block size-16 overflow-hidden bg-surface-1 transition-opacity duration-150', selected ? 'opacity-100' : 'opacity-50 group-hover/thumb:opacity-80')}>
                  <ShopifyImage src={img.url} alt="" width={64} height={64} sizes="64px" className="size-full object-cover" />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[color:var(--accent-primary)] transition-transform duration-200 ease-[var(--ease-spring)]',
                    selected ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
