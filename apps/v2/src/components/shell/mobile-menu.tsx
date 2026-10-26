import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { cn } from '~/ui/cn'
import { useScrollLock } from '~/ui/use-scroll-lock'
import { navLinks } from './nav-links'

const itemClasses =
  'text-body-m font-medium py-3 px-3 min-h-11 flex items-center rounded-md transition-soft active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]'

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
  const itemState = (active: boolean) =>
    active ? 'text-primary bg-surface-3' : 'text-secondary hover:text-primary hover:bg-surface-3'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-2 active:scale-[0.94] transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center hover:cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="mobile-menu-trigger"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="relative z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Menu" onKeyDown={trapTab}>
            <div className="os-menu-overlay fixed inset-0 bg-[color-mix(in_srgb,var(--bg-overlay)_90%,transparent)]" aria-hidden="true" onClick={close} />
            <div className="pointer-events-none fixed inset-0 flex justify-end">
              <div
                ref={panelRef}
                data-testid="mobile-menu"
                className="os-menu-panel pointer-events-auto w-full max-w-[280px] min-h-dvh overflow-y-auto overscroll-contain bg-surface-2 border-l border-subtle shadow-lg-premium flex flex-col pb-[env(safe-area-inset-bottom)]"
              >
                <div className="flex items-center justify-between p-4 border-b border-subtle">
                  <span className="text-h5 text-primary">Menu</span>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    className="p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-3 active:scale-[0.94] transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center hover:cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="flex flex-col p-4 gap-1" aria-label="Mobile">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to as never}
                      onClick={close}
                      aria-current={pathname === link.to ? 'page' : undefined}
                      className={cn(itemClasses, itemState(pathname === link.to))}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link
                    to={'/search' as never}
                    onClick={close}
                    aria-current={pathname === '/search' ? 'page' : undefined}
                    className={cn(itemClasses, itemState(pathname === '/search'))}
                  >
                    Search
                  </Link>
                  <Link
                    to={signedIn ? ('/account' as never) : '/login'}
                    onClick={close}
                    className={cn(itemClasses, itemState(false), 'mt-2')}
                  >
                    {signedIn ? 'Account' : 'Login'}
                  </Link>
                </nav>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
