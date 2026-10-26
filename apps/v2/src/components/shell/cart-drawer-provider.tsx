import { createContext, lazy, Suspense, use, useCallback, useMemo, useState, type ReactNode } from 'react'

type CartDrawerContextValue = {
  open: boolean
  openCart: () => void
  closeCart: () => void
  preloadCart: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

const loadCartDrawer = () => import('./cart-drawer')
const CartDrawer = lazy(() => loadCartDrawer().then((m) => ({ default: m.CartDrawer })))

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const openCart = useCallback(() => {
    setMounted(true)
    setOpen(true)
  }, [])
  const closeCart = useCallback(() => setOpen(false), [])
  const preloadCart = useCallback(() => void loadCartDrawer(), [])
  const value = useMemo(() => ({ open, openCart, closeCart, preloadCart }), [open, openCart, closeCart, preloadCart])

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
