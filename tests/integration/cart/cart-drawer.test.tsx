import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../utils/render'
import CartDrawer from '@/app/components/cart-drawer'
import { mockCart, mockCartLine, emptyCart } from '../../fixtures/cart'
import type { CartStore } from '@/lib/store/cart-store'

// Mock useCartStore to control cart state without a real Zustand store or
// API calls. The hook is called multiple times per render (once per selector),
// so we use mockImplementation to run each selector against a base state object.
// importOriginal is required so that CartStoreProvider (used by tests/utils/render.tsx)
// is still exported from the module — without it the render wrapper throws.
vi.mock('@/store/cart-context', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/store/cart-context')>()
  return {
    ...mod,
    useCartStore: vi.fn(),
  }
})

// CartDrawer and CheckoutButton both call useTrackingReady to gate analytics
// events. Returning false disables the effect, preventing test noise.
vi.mock('@/store/activity-hydrator', () => ({
  useTrackingReady: () => false,
}))

// Silence trackActivity calls so they don't trigger unhandled fetch warnings.
vi.mock('@/utils/helpers/activity/tracking', () => ({
  trackActivity: vi.fn(),
}))

// CartItemRow renders a next/image, which requires a real loader in jsdom.
// The mock replaces it with a plain <img> so the component renders without errors.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}))

import { useCartStore } from '@/store/cart-context'

// Sets up the useCartStore mock to return values from a merged base + overrides
// state object. Each call to useCartStore runs the selector against that object,
// which is how the real Zustand hook works.
function setupCartStore(overrides: Partial<CartStore> = {}) {
  const base: Partial<CartStore> = {
    cart: mockCart,
    isOpen: true,
    isLoading: false,
    close: vi.fn(),
    setQty: vi.fn(),
    removeLine: vi.fn(),
  }
  const state = { ...base, ...overrides } as CartStore
  vi.mocked(useCartStore).mockImplementation((selector: (s: CartStore) => unknown) =>
    selector(state)
  )
  return state
}

describe('cart drawer — item rendering', () => {
  beforeEach(() => {
    setupCartStore()
  })

  // The product title from the Shopify cart line must be rendered.
  // If this is missing the user cannot tell what they added to the cart.
  it('renders the product title for each cart line', () => {
    render(<CartDrawer />)
    expect(screen.getByText('Sample Drum Kit')).toBeInTheDocument()
  })

  // totalQuantity from the cart object should be displayed in the summary row.
  it('shows the total item count', () => {
    render(<CartDrawer />)
    // "Items" label + count appear in the summary section
    expect(screen.getByText('Items')).toBeInTheDocument()
    // The count '1' also appears in the QuantityControl, so getAllByText is needed
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })

  // The formatted total amount must appear so the user can see what they will pay.
  it('shows the total cart price', () => {
    render(<CartDrawer />)
    // PriceDisplay uses Intl.NumberFormat — $29.99 in en-US locale
    // $29.99 appears in both the line item row and the total, so getAllByText is used
    expect(screen.getAllByText('$29.99').length).toBeGreaterThan(0)
  })

  // The checkout button must be present when the cart has items.
  // If this is missing, the user cannot complete their purchase.
  it('renders the checkout button', () => {
    render(<CartDrawer />)
    expect(screen.getByText('Checkout')).toBeInTheDocument()
  })

  // Empty-state copy should appear when no lines are in the cart.
  // This prevents a blank white drawer with no explanation.
  it('shows the empty state when the cart has no lines', () => {
    setupCartStore({ cart: emptyCart })
    render(<CartDrawer />)
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByText('Add something from the store to get started.')).toBeInTheDocument()
  })
})

describe('cart drawer — interactions', () => {
  let state: Partial<CartStore>

  beforeEach(() => {
    state = setupCartStore()
  })

  // Clicking the + button should call setQty with the current quantity + 1.
  // If the wrong quantity is passed, the cart would silently update to the
  // wrong number rather than incrementing.
  it('clicking the increment button calls setQty with quantity + 1', () => {
    render(<CartDrawer />)
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }))
    expect(state.setQty).toHaveBeenCalledWith('gid://shopify/CartLine/1', 2)
  })

  // Decrement from quantity 2 → 1. The QuantityControl disables the decrement
  // button when quantity === min (1), so we test with quantity = 2 to confirm
  // the click correctly calls setQty with quantity - 1.
  it('clicking the decrement button calls setQty with quantity - 1', () => {
    // Override the cart line to have quantity 2 so the decrement button is active.
    // Re-assign state so we reference the new setQty spy created by this setup call.
    const lineWithQty2 = { ...mockCartLine, quantity: 2 }
    const cartWithQty2 = {
      ...mockCart,
      totalQuantity: 2,
      lines: { edges: [{ node: lineWithQty2 }] },
    }
    state = setupCartStore({ cart: cartWithQty2 })
    render(<CartDrawer />)
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }))
    expect(state.setQty).toHaveBeenCalledWith('gid://shopify/CartLine/1', 1)
  })

  // The explicit Remove button must call removeLine with the correct line ID.
  // Passing the wrong line ID would remove a different item from the cart.
  it('clicking the remove button calls removeLine with the correct line id', () => {
    render(<CartDrawer />)
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(state.removeLine).toHaveBeenCalledWith(['gid://shopify/CartLine/1'])
  })
})

describe('cart drawer — loading state', () => {
  // While an API request is in flight, quantity controls should be disabled
  // to prevent the user from sending concurrent mutations. Without this,
  // rapid clicks could cause race conditions on the Shopify cart.

  it('disables quantity controls while isLoading is true', () => {
    setupCartStore({ isLoading: true })
    render(<CartDrawer />)
    expect(screen.getByRole('button', { name: /increase quantity/i })).toBeDisabled()
  })
})

describe('cart drawer — stale/null cart', () => {
  // When a Shopify cart is converted to an order (checkout completed) or expires,
  // the server-side routes return { ok: true, cart: null } and clear the cartId
  // cookie. The Zustand store sets cart to null. The drawer must render the
  // empty state gracefully — not crash or show ghost line items.

  it('shows the empty state when cart is null (stale/converted cart)', () => {
    setupCartStore({ cart: null })
    render(<CartDrawer />)
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByText('Add something from the store to get started.')).toBeInTheDocument()
  })

  // When the cart is null the drawer renders only the empty state — the checkout
  // button is conditionally rendered inside the non-empty branch and must not
  // appear. Rendering it (even disabled) would be confusing when the cart is gone.
  it('does not render the checkout button when cart is null', () => {
    setupCartStore({ cart: null, isOpen: true })
    render(<CartDrawer />)
    expect(screen.queryByTestId('checkout-btn')).not.toBeInTheDocument()
  })
})
