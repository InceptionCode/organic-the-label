import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '~/lib/format'
import type { ProductSummary } from '~/server/shopify/types'
import { ButtonLink } from '~/ui/button'
import { cn } from '~/ui/cn'
import { ShopifyImage } from '~/ui/shopify-image'

/**
 * The newest product as a split: the whole artwork at its real aspect ratio (never cropped, at most
 * 75svh tall), details beside it from lg. Below lg the artwork stacks full-bleed above the details.
 * Inside the content container so the pair stays together on wide screens.
 */
export function LatestDrop({ product }: { product: ProductSummary | undefined }) {
  if (!product) return null
  const isFree = product.price ? Number(product.price.amount) === 0 : false
  const image = product.image
  const ratio = image?.width && image.height ? image.width / image.height : 3 / 4

  return (
    <section aria-labelledby="latest-drop-heading" className="hairline-t hairline-b">
      <div className="content-container grid items-center gap-10 pb-14 md:pb-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <div className="-mx-6 md:-mx-10 lg:col-span-6 lg:mx-0">
          <div
            className="relative w-full overflow-hidden bg-surface-1 lg:max-w-(--art-max-w)"
            style={{ aspectRatio: ratio, '--art-max-w': `calc(75svh * ${ratio})` } as CSSProperties}
          >
            {image?.url ? (
              <ShopifyImage
                src={image.url}
                alt={image.altText || product.title}
                width={1200}
                height={Math.round(1200 / ratio)}
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-caption text-muted">No image</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 lg:pl-10 xl:col-span-5 xl:col-start-8 xl:pl-0">
          <p className="mb-6 text-label">Latest release</p>
          <h2 id="latest-drop-heading" className="text-display-l text-primary">
            {product.title}
          </h2>
          {product.category && <p className="mt-4 text-label capitalize">{product.category}</p>}

          <div className="mt-8 flex items-baseline gap-4">
            {product.price && (
              <span className="price-text text-primary">{formatMoney(product.price.amount, product.price.currencyCode)}</span>
            )}
            {isFree && <span className="text-label text-accent">Free</span>}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink to="/store/$handle" params={{ handle: product.handle }} size="lg">
              Get it now
            </ButtonLink>
            <Link
              to="/store/$handle"
              params={{ handle: product.handle }}
              className={cn(
                'link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]',
              )}
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
