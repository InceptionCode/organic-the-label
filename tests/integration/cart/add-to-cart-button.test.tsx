import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '../../utils/render'
import AddToCartButton from '@/app/components/add-to-cart'

/**
 * Integration tests for AddToCartButton's per-button loading isolation.
 *
 * Key invariant: clicking one button must only flip THAT button to "Adding...".
 * All other AddToCartButton instances on the page must remain "Add to cart".
 *
 * Root cause of the previous bug: AddToCartButton read isLoading from the
 * global Zustand cart store. One button's in-flight request set store.isLoading
 * to true, causing every AddToCartButton to re-render as "Adding...".
 *
 * Fix: each button owns its own local isPending state (useState). The store's
 * isLoading is intentionally not read here — it only gates the CartDrawer's
 * quantity controls to prevent concurrent mutations on the Shopify cart object.
 */

vi.mock('@/store/cart-context', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/store/cart-context')>()
  return {
    ...mod,
    useCartStore: vi.fn(),
  }
})

import { useCartStore } from '@/store/cart-context'
import { CartStore } from '@/lib/store/cart-store'

// Builds a controlled addToCart mock that returns a pending promise.
// Call resolveAdd() to let the in-flight request complete.
function pendingAddToCart() {
  let resolve: () => void = () => { }
  const promise = new Promise<void>((res) => { resolve = res })
  const addToCart = vi.fn(() => promise)
  return { addToCart, resolveAdd: resolve }
}

describe('AddToCartButton — per-button loading isolation', () => {
  beforeEach(() => {
    vi.mocked(useCartStore).mockReset()
  })

  // THE primary regression test.
  // Before the fix, clicking one button set store.isLoading = true, which every
  // instance subscribed to — all buttons showed "Adding..." simultaneously.
  // After the fix, each button uses local useState, so only the clicked one changes.
  it('only the clicked button shows "Adding..." while its request is in flight', async () => {
    const { addToCart, resolveAdd } = pendingAddToCart()
    vi.mocked(useCartStore).mockImplementation((selector: (s: CartStore) => unknown) =>
      selector({ addToCart } as never)
    )

    render(
      <div>
        <AddToCartButton variantId="var-1" />
        <AddToCartButton variantId="var-2" />
        <AddToCartButton variantId="var-3" />
      </div>
    )

    const buttons = screen.getAllByTestId('add-to-cart-btn')
    expect(buttons).toHaveLength(3)

    // All buttons start idle
    buttons.forEach((btn) => expect(btn).toHaveTextContent('Add to cart'))

    // Click the middle button — it is the one that should go pending
    fireEvent.click(buttons[1])

    // Only button[1] changes state; [0] and [2] stay idle
    expect(buttons[1]).toHaveTextContent('Adding...')
    expect(buttons[0]).toHaveTextContent('Add to cart')
    expect(buttons[2]).toHaveTextContent('Add to cart')

    // Button[1] is disabled while pending; others are still enabled
    expect(buttons[1]).toBeDisabled()
    expect(buttons[0]).not.toBeDisabled()
    expect(buttons[2]).not.toBeDisabled()

    // Resolve the request and verify the button recovers
    act(() => { resolveAdd() })
    await waitFor(() => expect(buttons[1]).toHaveTextContent('Add to cart'))
    expect(buttons[1]).not.toBeDisabled()
  })

  // Rapid double-click guard: the if (isPending) return early-exit means the
  // second click while a request is in flight is a no-op. Without this,
  // a fast double-click would fire addToCart twice, adding duplicate items.
  it('prevents a double-click from firing addToCart more than once', async () => {
    const { addToCart, resolveAdd } = pendingAddToCart()
    vi.mocked(useCartStore).mockImplementation((selector: (s: CartStore) => unknown) =>
      selector({ addToCart } as never)
    )

    render(<AddToCartButton variantId="var-1" />)
    const button = screen.getByTestId('add-to-cart-btn')

    // First click starts the request; button becomes disabled
    fireEvent.click(button)
    expect(button).toBeDisabled()

    // Second click fires while the button is disabled — must be ignored
    fireEvent.click(button)

    act(() => { resolveAdd() })
    await waitFor(() => expect(button).not.toBeDisabled())

    // addToCart was called exactly once despite two clicks
    expect(addToCart).toHaveBeenCalledTimes(1)
  })

  // After a successful add the button must reset so the user can add again
  // (e.g. to increase quantity from the store grid before opening the drawer).
  it('returns to "Add to cart" after the request resolves', async () => {
    const { addToCart, resolveAdd } = pendingAddToCart()
    vi.mocked(useCartStore).mockImplementation((selector: (s: CartStore) => unknown) =>
      selector({ addToCart } as never)
    )

    render(<AddToCartButton variantId="var-1" />)
    const button = screen.getByTestId('add-to-cart-btn')

    fireEvent.click(button)
    expect(button).toHaveTextContent('Adding...')

    act(() => { resolveAdd() })
    await waitFor(() => expect(button).toHaveTextContent('Add to cart'))
    expect(button).not.toBeDisabled()
  })

  // Even if addToCart throws, the button must recover — not stay stuck on
  // "Adding..." forever, which would leave the user unable to retry.
  it('returns to "Add to cart" even when addToCart throws', async () => {
    const addToCart = vi.fn(() => Promise.reject(new Error('Network error')))
    vi.mocked(useCartStore).mockImplementation((selector: (s: CartStore) => unknown) =>
      selector({ addToCart } as never)
    )

    render(<AddToCartButton variantId="var-1" />)
    const button = screen.getByTestId('add-to-cart-btn')

    fireEvent.click(button)
    expect(button).toHaveTextContent('Adding...')

    await waitFor(() => expect(button).toHaveTextContent('Add to cart'))
    expect(button).not.toBeDisabled()
  })
})
