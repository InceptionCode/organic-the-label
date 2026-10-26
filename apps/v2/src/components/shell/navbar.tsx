import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { useSession } from '~/lib/use-session'
import { cartQueries } from '~/queries/cart'
import { cn } from '~/ui/cn'
import { useCartDrawer } from './cart-drawer-provider'
import { MobileMenu } from './mobile-menu'
import { navLinks } from './nav-links'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const iconButton = cn(
  'relative p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-2 active:scale-[0.94] transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center hover:cursor-pointer',
  focusRing,
)

const utilityLabel = 'text-[0.7rem] tracking-[0.08em] uppercase font-medium'

export function Navbar() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const user = useSession()

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md"
      style={{ background: 'rgba(23, 23, 23, 0.88)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="content-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className={cn('shrink-0 flex items-center gap-2.5 rounded min-h-11', focusRing, 'active:opacity-80')} aria-label="Organic Sonics home">
            <img
              src="/brand-assets/organic-sonics-logo.png"
              alt="Organic Sonics"
              width={42}
              height={42}
              className="object-contain size-[42px]"
              fetchPriority="high"
            />
            <span className="text-primary hidden sm:block font-heading text-[1.5rem] tracking-[0.05em]">ORGANIC SONICS</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-8" aria-label="Main">
            {navLinks.map((link) => {
              const isActive = pathname === link.to
              return (
                <div key={link.to} className="relative flex flex-col items-center">
                  <Link
                    to={link.to as never}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      utilityLabel,
                      'transition-soft rounded-sm active:opacity-70',
                      focusRing,
                      isActive ? 'text-primary' : 'text-muted hover:text-primary',
                    )}
                  >
                    {link.name}
                  </Link>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 size-1 shrink-0 rounded-full bg-[color:var(--accent-primary)] shadow-[0_0_6px_2px_rgba(224,61,42,0.75)]"
                    />
                  )}
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <CartIconButton />
            <Link to={'/search' as never} className={cn(iconButton, 'p-2.5 text-muted')} aria-label="Search">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link
              to={user ? ('/account' as never) : '/login'}
              data-testid={user ? 'account-link' : 'sign-in-link'}
              className={cn(
                utilityLabel,
                'hidden sm:inline-flex text-muted hover:text-primary transition-soft px-3 py-2 rounded-md hover:bg-surface-2 active:scale-[0.97]',
                focusRing,
              )}
            >
              {user ? 'Account' : 'Login'}
            </Link>
            <MobileMenu signedIn={!!user} />
          </div>
        </div>
      </div>
    </header>
  )
}

function CartIconButton() {
  const { openCart, preloadCart } = useCartDrawer()
  const { data } = useQuery(cartQueries.current())
  const count = data?.cart?.totalQuantity ?? 0

  return (
    <button
      type="button"
      data-testid="cart-icon"
      className={iconButton}
      onClick={openCart}
      onPointerEnter={preloadCart}
      onFocus={preloadCart}
      aria-label={count > 0 ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart'}
    >
      <span className="text-white">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-caption px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium min-w-[1.25rem] text-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
    </button>
  )
}
