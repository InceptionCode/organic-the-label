import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { CartStoreProvider } from '@/store/cart-context'

/**
 * Custom render function that wraps components with the app's providers.
 *
 * CartStoreProvider is always included because many components (ProductCard,
 * AddToCartButton, CartDrawer) access the cart store via useCartStore.
 * Tests that need to control cart state should mock useCartStore directly
 * instead of relying on the real provider.
 *
 * Auth state: Navbar and auth-aware components use useSafeParseUser from
 * @/utils/hooks/use-safe-parse-user — mock that hook per-test rather than
 * adding AuthStoreProvider here, to avoid the Supabase client being
 * instantiated in every test.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <CartStoreProvider>{children}</CartStoreProvider>
}

const customRender = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options })

// Re-export everything from testing-library so tests only need to import from here
export * from '@testing-library/react'
export { customRender as render }
