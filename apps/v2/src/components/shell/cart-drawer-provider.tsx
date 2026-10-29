import { createContext, lazy, Suspense, use, useState, type ReactNode } from 'react'

type CartDrawerContextValue = {
  open: boolean
  openCart: () => void
  closeCart: () => void
  preloadCart: () => void
}

/** id of the cart <dialog>, for the cart button's aria-controls. */
export const CART_DRAWER_ID = 'cart-drawer'

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

const loadCartDrawer = () => import('./cart-drawer')
const CartDrawer = lazy(() => loadCartDrawer().then((m) => ({ default: m.CartDrawer })))

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const openCart = () => {
    setMounted(true)
    setOpen(true)
  }
  const closeCart = () => setOpen(false)
  const preloadCart = () => void loadCartDrawer()
  const value = { open, openCart, closeCart, preloadCart }

  return (
    <CartDrawerContext value={value}>
      {children}
      {mounted ? (
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      ) : null}
    </CartDrawerContext>
  )
}

export function useCartDrawer() {
  const ctx = use(CartDrawerContext)
  if (!ctx) throw new Error('useCartDrawer must be used inside <CartDrawerProvider>')
  return ctx
}
