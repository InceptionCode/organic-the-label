import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { useSession } from '~/lib/use-session'
import { cartQueries } from '~/queries/cart'
import { cn } from '~/ui/cn'
import { CART_DRAWER_ID, useCartDrawer } from './cart-drawer-provider'
import { MobileMenu } from './mobile-menu'
import { navLinks } from './nav-links'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

// Search and cart are 44px icon targets at every width; Login/Account is a text link from lg.
const utilityItem = cn(
  'relative flex items-center justify-center min-w-11 min-h-11 rounded-sm text-sm font-medium text-muted hover:text-primary active:opacity-70 transition-soft hover:cursor-pointer',
  focusRing,
)

const navLinkClasses = cn(
  'text-sm font-medium transition-soft rounded-sm underline-offset-[6px] decoration-1 active:opacity-70',
  focusRing,
)

export function Navbar() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const user = useSession()

  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-[color:color-mix(in_srgb,var(--bg-canvas)_88%,transparent)] backdrop-blur-md">
      <div className="content-container">
        <div className="flex h-16 md:h-[72px] items-center justify-between gap-4">
          <div className="flex items-center gap-12">
            <Link
              to="/"
              className={cn('shrink-0 flex items-center gap-2.5 rounded-sm min-h-11 active:opacity-80', focusRing)}
              aria-label="Organic Sonics home"
            >
              <img
                src="/brand-assets/organic-sonics-logo.png"
                alt="Organic Sonics"
                width={40}
                height={40}
                className="object-contain size-10"
              />
              <span className="text-primary hidden sm:block font-heading text-[1.5rem] leading-none tracking-[0.05em] pt-0.5">
                ORGANIC SONICS
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
              {navLinks.map((link) => {
                const isActive = pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to as never}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(navLinkClasses, isActive ? 'text-primary underline' : 'text-muted hover:text-primary')}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1 lg:gap-2">
            <Link to="/search" className={cn(utilityItem, 'text-[color:var(--text-primary)]')} aria-label="Search">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <CartButton />
            <Link
              to={user ? '/account' : '/login'}
              data-testid={user ? 'account-link' : 'sign-in-link'}
              className={cn(utilityItem, 'hidden lg:flex lg:ml-4 lg:px-1')}
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

function CartButton() {
  const { open, openCart, preloadCart } = useCartDrawer()
  const { data } = useQuery(cartQueries.current())
  const count = data?.cart?.totalQuantity ?? 0
  const badge = count > 99 ? '99+' : String(count)

  return (
    <button
      type="button"
      data-testid="cart-icon"
      className={cn(utilityItem, 'text-[color:var(--text-primary)]')}
      onClick={openCart}
      onPointerEnter={preloadCart}
      onFocus={preloadCart}
      aria-label={count > 0 ? `Cart has ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart'}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={CART_DRAWER_ID}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1 min-w-4 h-4 px-1 rounded-sm bg-primary text-primary-foreground text-[0.625rem] leading-4 font-semibold text-center tabular-nums"
        >
          {badge}
        </span>
      )}
    </button>
  )
}
