import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pause, Play } from 'lucide-react'
import { claimPlayback, releasePlayback } from '~/components/audio/exclusive-playback'
import { formatMoney } from '~/lib/format'
import { TAG_OPTIONS } from '~/lib/store-search'
import { resolveOwnedAccess, useOwnedProducts } from '~/lib/use-owned'
import type { AudioPreview, ProductSummary } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { ShopifyImage } from '~/ui/shopify-image'
import { AddToCartButton } from './add-to-cart-button'
import { OwnedAccessLink } from './owned-access-link'

const CARD_SIZES = '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1535px) 25vw, 20vw'
const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

// Shopify tags are lowercase ("hiphop"); show the same labels as the store's tag filter ("Hip-Hop").
const TAG_LABELS = new Map<string, string>(TAG_OPTIONS.map((o) => [o.value, o.label]))
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const tagLabel = (tag: string) => TAG_LABELS.get(tag.toLowerCase()) ?? capitalize(tag)

type ProductCardProps = {
  product: ProductSummary
  /** Only the store's first card when it is the LCP element. */
  priority?: boolean
}

/**
 * Borderless product: 3:4 art (radius 0) with a preview play button on its bottom-left corner,
 * then title and price, a meta line and a compact add-to-cart. The title is the card's link; the
 * art links too but is skipped by keyboard and screen readers so there is one tab stop per product.
 * Products the signed-in user owns show a sand "Owned" label (in place of "Exclusive") and an
 * access action instead of add-to-cart: "Access" for a direct download, otherwise "Request access"
 * (a prefilled /contact request; no paid product has a direct source today).
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const ownedEntry = useOwnedProducts().get(product.id)
  const owned = !!ownedEntry
  const tags = product.tags.filter((t) => t !== 'exclusive').slice(0, 2).map(tagLabel)
  const preview = product.audioPreview?.preview_url ? product.audioPreview : null
  const meta = [product.category && capitalize(product.category), ...tags].filter(Boolean)

  return (
    <article data-testid="product-card" className="group relative flex h-full w-full flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-1">
        <Link to="/store/$handle" params={{ handle: product.handle }} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          {product.image?.url ? (
            <ShopifyImage
              src={product.image.url}
              alt=""
              width={600}
              height={800}
              sizes={CARD_SIZES}
              priority={priority}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              <img src="/file.svg" alt="" width={56} height={56} className="size-14 object-contain opacity-50" />
            </span>
          )}
        </Link>

        {owned ? (
          <OwnedBadge className="pointer-events-none absolute left-3 top-3" />
        ) : (
          product.isExclusive && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-[2px] bg-[color:var(--accent-primary)] px-2 py-1 text-[0.75rem] font-medium leading-none text-[color:var(--accent-contrast)]">
              Exclusive
            </span>
          )
        )}

        {preview && <CardPreview preview={preview} product={product} />}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <Link
          to="/store/$handle"
          params={{ handle: product.handle }}
          data-testid="product-card-link"
          className={cn('min-w-0 rounded-sm text-body-m font-medium leading-snug text-primary transition-colors duration-150 hover:text-[color:var(--text-secondary)] active:opacity-70', focusRing)}
        >
          <span className="line-clamp-2">{product.title}</span>
        </Link>
        {product.price && (
          <p className="shrink-0 pt-px text-body-s tabular-nums text-secondary">
            {formatMoney(product.price.amount, product.price.currencyCode)}
          </p>
        )}
      </div>
      {meta.length > 0 && <p className="mt-1 truncate text-label">{meta.join(' · ')}</p>}

      <div className="mt-auto pt-4">
        {ownedEntry ? (
          <OwnedAccessLink
            access={resolveOwnedAccess(ownedEntry)}
            title={product.title}
            product={product}
            surface="card"
            variant="outline"
            size="sm"
            className="w-full flex-none md:w-auto"
          />
        ) : (
          <AddToCartButton
            variant="outline"
            size="sm"
            variantId={product.variantId}
            disabled={!product.availableForSale}
            productName={product.title}
            className="w-full flex-none md:w-auto"
          />
        )}
      </div>
    </article>
  )
}

/** Sand label for products the signed-in user owns (cards and the product page). */
export function OwnedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-[2px] bg-[color:var(--band-sand-bg)] px-2 py-1 text-[0.75rem] font-medium leading-none text-[color:var(--band-sand-fg)]',
        className,
      )}
    >
      Owned
    </span>
  )
}

/**
 * Play/pause on the art plus a 2px progress line along its bottom edge (scaleX, not width).
 * One preview plays at a time across the page; the audio stops when the card unmounts.
 */
function CardPreview({ preview, product }: { preview: AudioPreview; product: ProductSummary }) {
  const title = product.title
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = audioRef.current
    return () => {
      if (!el) return
      el.pause()
      releasePlayback(el)
    }
  }, [])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (!el.paused) {
      el.pause()
      return
    }
    claimPlayback(el, { surface: 'card', title: preview.preview_title, handle: product.handle, productId: product.id })
    el.play().catch(() => setPlaying(false))
  }

  const onTimeUpdate = () => {
    const el = audioRef.current
    if (el && Number.isFinite(el.duration) && el.duration > 0) setProgress(el.currentTime / el.duration)
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={`${playing ? 'Pause' : 'Play'} ${title} preview`}
        className={cn(
          "absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-[2px] border text-[color:var(--text-primary)] transition-[background-color,border-color,transform] duration-150 hover:cursor-pointer active:scale-[0.94] touch-manipulation after:absolute after:-inset-1 after:content-['']",
          playing
            ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]'
            : 'border-[color:var(--border-strong)] bg-[color:color-mix(in_srgb,var(--bg-canvas)_70%,transparent)] hover:border-[color:var(--text-primary)]',
          focusRing,
        )}
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
      </button>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[color:var(--accent-primary)] transition-[transform,opacity] duration-300 ease-linear',
          progress > 0 ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transform: `scaleX(${progress})` }}
      />
      <audio
        ref={audioRef}
        src={preview.preview_url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setProgress(0)}
        onTimeUpdate={onTimeUpdate}
        className="hidden"
      />
    </>
  )
}
