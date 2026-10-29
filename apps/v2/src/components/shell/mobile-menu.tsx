import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { cn } from '~/ui/cn'
import { useScrollLock } from '~/ui/use-scroll-lock'
import { navLinks } from './nav-links'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const itemClasses = cn(
  'font-heading text-[2.5rem] leading-none tracking-[0.02em] min-h-16 flex items-center justify-between border-b border-subtle transition-soft active:opacity-70',
  focusRing,
)

const iconButton = cn(
  'min-w-11 min-h-11 flex items-center justify-center rounded-sm text-primary hover:bg-[color:color-mix(in_srgb,var(--text-primary)_6%,transparent)] active:scale-[0.94] transition-soft hover:cursor-pointer',
  focusRing,
)

export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = useLocation({ select: (l) => l.pathname })
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    return router.subscribe('onBeforeNavigate', () => setOpen(false))
  }, [open, router])

  useEffect(() => {
    if (open) closeRef.current?.focus()
    else if (wasOpen.current) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Keep Tab inside the panel.
  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const items = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const close = () => setOpen(false)
  const itemState = (active: boolean) => (active ? 'text-primary' : 'text-secondary hover:text-primary')
  const marker = (active: boolean) =>
    active ? <span aria-hidden className="size-2 rounded-sm bg-[color:var(--accent-text)]" /> : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(iconButton, 'lg:hidden text-secondary hover:text-primary')}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="mobile-menu-trigger"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5M3.75 15h16.5" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" onKeyDown={trapTab}>
            <div
              ref={panelRef}
              data-testid="mobile-menu"
              className="os-menu-panel fixed inset-0 min-h-dvh overflow-y-auto overscroll-contain bg-canvas flex flex-col pb-[env(safe-area-inset-bottom)]"
            >
              <div className="content-container">
                <div className="flex h-16 md:h-[72px] items-center justify-between">
                  <span className="text-label">Menu</span>
                  <button ref={closeRef} type="button" onClick={close} className={iconButton} aria-label="Close menu">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <nav className="content-container flex flex-col pt-6 border-t border-subtle" aria-label="Mobile">
                {navLinks.map((link) => {
                  const active = pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to as never}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={cn(itemClasses, itemState(active))}
                    >
                      {link.name}
                      {marker(active)}
                    </Link>
                  )
                })}
                <Link
                  to="/search"
                  onClick={close}
                  aria-current={pathname === '/search' ? 'page' : undefined}
                  className={cn(itemClasses, itemState(pathname === '/search'))}
                >
                  Search
                  {marker(pathname === '/search')}
                </Link>
              </nav>
              <div className="content-container mt-auto py-8 flex items-center justify-between gap-4">
                <Link
                  to={signedIn ? '/account' : '/login'}
                  onClick={close}
                  className={cn('text-body-m font-medium text-primary link-underline min-h-11 inline-flex items-center rounded-sm', focusRing)}
                >
                  {signedIn ? 'Account' : 'Login'}
                </Link>
                <span className="text-label">Organic Sonics</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
