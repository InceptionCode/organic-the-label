import { useEffect, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '~/lib/format'
import { productQueries } from '~/queries/products'
import { cn } from '~/ui/cn'
import { ShopifyImage } from '~/ui/shopify-image'

const DISMISS_KEY = 'os:sticky-product-bar-dismissed'
const SHOW_AFTER = 300
const CYCLE_MS = 5000

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

const getScrolledPast = () => window.scrollY > SHOW_AFTER
const getServerScrolledPast = () => false

// Dismissal store: the in-memory flag covers blocked storage; sessionStorage persists it per tab.
let dismissedFlag = false
const dismissListeners = new Set<() => void>()

function subscribeDismissed(onChange: () => void) {
  dismissListeners.add(onChange)
  return () => {
    dismissListeners.delete(onChange)
  }
}

const getDismissed = () => dismissedFlag || readDismissed()
// Treated as dismissed on the server and during hydration, so nothing renders until the client takes over.
const getServerDismissed = () => true

function dismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // Storage blocked: dismissal lasts for this page view only.
  }
  dismissedFlag = true
  for (const listener of dismissListeners) listener()
}

export function StickyProductBar() {
  const { data: products = [] } = useQuery(productQueries.newest(5))
  const visible = useSyncExternalStore(subscribeScroll, getScrolledPast, getServerScrolledPast)
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissed, getServerDismissed)
  const [activeIndex, setActiveIndex] = useState(0)

  // Cycle every 5s; paused while hidden, while the tab is hidden, or with reduced motion.
  useEffect(() => {
    if (!visible || dismissed || products.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setActiveIndex((i) => (i + 1) % products.length)
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [visible, dismissed, products.length])

  if (dismissed || products.length === 0) return null

  const product = products[activeIndex % products.length]

  return (
    <aside
      aria-label="New in the store"
      data-testid="sticky-product-bar"
      data-visible={visible}
      inert={!visible}
      className={cn(
        'os-sticky-bar hidden sm:flex fixed bottom-6 left-6 z-40 w-[320px] flex-row items-center gap-3 py-3 pl-3.5 pr-3.5 rounded-md backdrop-blur-[16px]',
        'bg-[color:color-mix(in_srgb,var(--surface-1)_92%,transparent)] border border-default shadow-float',
      )}
    >
      <div key={product.id} className="os-fade-in relative size-[52px] shrink-0 overflow-hidden rounded-sm bg-surface-3">
        {product.image?.url ? (
          <ShopifyImage src={product.image.url} alt={product.title} width={52} height={52} sizes="52px" className="size-full object-cover" />
        ) : null}
      </div>

      <div key={`${product.id}-info`} className="os-slide-in flex-1 min-w-0">
        <p className="truncate font-heading text-[0.9rem] tracking-[0.02em] leading-[1.2] text-primary">{product.title}</p>
        {product.price ? (
          <p className="mt-0.5 text-[0.7rem] text-muted">
            {formatMoney(product.price.amount, product.price.currencyCode)}
          </p>
        ) : null}
      </div>

      <Link
        to="/store/$handle"
        params={{ handle: product.handle }}
        className="shrink-0 rounded-sm bg-[color:var(--accent-primary)] px-3 py-[7px] text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-primary-foreground no-underline transition-soft hover:bg-[color:var(--accent-primary-hover)] active:scale-[0.96] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-1)]"
      >
        Get It
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss product bar"
        className="absolute right-2 top-2 p-0.5 leading-none text-white/35 hover:text-white/80 hover:cursor-pointer active:scale-90 transition-soft rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)] after:absolute after:-inset-3 after:content-['']"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </aside>
  )
}
