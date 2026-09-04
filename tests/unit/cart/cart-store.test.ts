import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/mocks/server'
import { createCartStore } from '@/lib/store/cart-store'
import { mockCart, emptyCart } from '@/tests/fixtures/cart'

// These tests use MSW to mock the network layer (fetch) rather than mocking
// jsonFetch directly. MSW intercepts the real fetch calls that jsonFetch makes,
// returning controlled responses without hitting real Shopify endpoints.
//
// The default MSW handlers (tests/mocks/handlers.ts) return:
//   GET  /api/store/cart/get    → { ok: true, cart: mockCart }
//   POST /api/store/cart/add    → { ok: true, cart: mockCart }
//   POST /api/store/cart/update → { ok: true, cart: mockCart }
//   POST /api/store/cart/remove → { ok: true, cart: emptyCart }
//
// Per-test overrides using server.use() are reset automatically by afterEach.

describe('cart store — open/close/toggle state', () => {
  // These test the three synchronous drawer actions. No network involved.
  // They establish the pattern and verify the most basic state management works.

  it('open() sets isOpen to true', () => {
    const store = createCartStore()
    store.getState().open()
    expect(store.getState().isOpen).toBe(true)
  })

  it('close() sets isOpen to false', () => {
    const store = createCartStore()
    store.getState().open()
    store.getState().close()
    expect(store.getState().isOpen).toBe(false)
  })

  it('toggle() flips isOpen', () => {
    const store = createCartStore()
    store.getState().toggle()
    expect(store.getState().isOpen).toBe(true)
    store.getState().toggle()
    expect(store.getState().isOpen).toBe(false)
  })
})

describe('cart store — addToCart', () => {
  let store: ReturnType<typeof createCartStore>

  beforeEach(() => {
    store = createCartStore()
  })

  // isLoading must flip to true synchronously before the first await.
  // If it doesn't, the UI has no way to show a loading state during the request.
  it('sets isLoading: true while request is in flight', () => {
    // Use a never-resolving override so we can snapshot the mid-flight state.
    server.use(
      http.post('/api/store/cart/add', () => new Promise(() => {}))
    )
    store.getState().addToCart('var-1')
    expect(store.getState().isLoading).toBe(true)
  })

  // On success the cart state should be populated with the server response,
  // and isLoading cleared. If cart stays null, the drawer would show empty.
  it('populates cart and clears isLoading on success', async () => {
    await store.getState().addToCart('var-1', 2)
    const { cart, isLoading, error } = store.getState()
    expect(cart).toEqual(mockCart)
    expect(isLoading).toBe(false)
    expect(error).toBeNull()
  })

  // On failure the error message should be captured. If isLoading stayed true
  // the UI would be stuck showing a spinner indefinitely.
  it('sets error and clears isLoading on fetch failure', async () => {
    server.use(
      http.post('/api/store/cart/add', () =>
        HttpResponse.json({ error: 'Add to cart failed' }, { status: 500 })
      )
    )
    await store.getState().addToCart('var-1')
    const { cart, isLoading, error } = store.getState()
    expect(cart).toBeNull()
    expect(isLoading).toBe(false)
    expect(error).toBe('Add to cart failed')
  })

  // The openDrawer option controls whether the cart drawer slides open after
  // a successful add. If broken, the drawer never opens after "Add to cart".
  it('opens the cart drawer when openDrawer: true is passed', async () => {
    await store.getState().addToCart('var-1', 1, { openDrawer: true })
    expect(store.getState().isOpen).toBe(true)
  })

  it('does not open the drawer when openDrawer is not passed', async () => {
    await store.getState().addToCart('var-1')
    expect(store.getState().isOpen).toBe(false)
  })
})

describe('cart store — refreshCart', () => {
  let store: ReturnType<typeof createCartStore>

  beforeEach(() => {
    store = createCartStore()
  })

  it('populates cart from a successful response', async () => {
    await store.getState().refreshCart()
    expect(store.getState().cart).toEqual(mockCart)
    expect(store.getState().isLoading).toBe(false)
  })

  // A null cart response (no active cart session) is valid. The store must
  // accept it without throwing and clear isLoading so the UI can render
  // the empty-cart state.
  it('sets cart to null when server returns { cart: null }', async () => {
    server.use(
      http.get('/api/store/cart/get', () =>
        HttpResponse.json({ ok: true, cart: null })
      )
    )
    await store.getState().refreshCart()
    expect(store.getState().cart).toBeNull()
    expect(store.getState().isLoading).toBe(false)
  })

  it('sets error and clears isLoading on failure', async () => {
    server.use(
      http.get('/api/store/cart/get', () =>
        HttpResponse.json({ error: 'Failed to load cart' }, { status: 500 })
      )
    )
    await store.getState().refreshCart()
    expect(store.getState().isLoading).toBe(false)
    expect(store.getState().error).toBe('Failed to load cart')
  })
})

describe('cart store — setQty', () => {
  let store: ReturnType<typeof createCartStore>

  beforeEach(() => {
    store = createCartStore()
  })

  // setQty(0) is the "remove by decrementing to zero" UX path. The store must
  // delegate to removeLine rather than calling the update endpoint. We verify
  // this by checking the resulting cart state: remove → emptyCart, update → mockCart.
  it('routes to removeLine when quantity is 0', async () => {
    await store.getState().setQty('line-1', 0)
    // The remove handler returns emptyCart. If update was called instead, cart would be mockCart.
    expect(store.getState().cart).toEqual(emptyCart)
  })

  // Negative quantities must be clamped to 0 and trigger removal.
  // Without this, a UI bug sending qty=-1 would silently do nothing.
  it('routes to removeLine for negative quantities (clamped to 0)', async () => {
    await store.getState().setQty('line-1', -5)
    expect(store.getState().cart).toEqual(emptyCart)
  })

  // A positive quantity should call the update endpoint (not remove).
  it('routes to the update endpoint for positive quantities', async () => {
    await store.getState().setQty('line-1', 3)
    // update handler returns mockCart; remove handler returns emptyCart
    expect(store.getState().cart).toEqual(mockCart)
  })

  // Math.floor ensures fractional quantities (e.g. from a buggy UI) become
  // whole numbers. 2.9 → 2, which is positive, so update (not remove) is called.
  // We capture the request to verify the exact quantity sent to Shopify.
  it('floors decimal quantities before sending to the API (2.9 → 2)', async () => {
    let sentBody: Record<string, unknown> = {}
    server.use(
      http.post('/api/store/cart/update', async ({ request }) => {
        sentBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ ok: true, cart: mockCart })
      })
    )
    await store.getState().setQty('line-1', 2.9)
    expect(sentBody.quantity).toBe(2)
  })

  it('sets error on update failure', async () => {
    server.use(
      http.post('/api/store/cart/update', () =>
        HttpResponse.json({ error: 'Update quantity failed' }, { status: 500 })
      )
    )
    await store.getState().setQty('line-1', 3)
    expect(store.getState().error).toBe('Update quantity failed')
    expect(store.getState().isLoading).toBe(false)
  })
})

describe('cart store — removeLine', () => {
  let store: ReturnType<typeof createCartStore>

  beforeEach(() => {
    store = createCartStore()
  })

  it('updates cart state from the remove response', async () => {
    await store.getState().removeLine(['line-1'])
    expect(store.getState().cart).toEqual(emptyCart)
    expect(store.getState().isLoading).toBe(false)
  })

  it('sets error and clears isLoading on remove failure', async () => {
    server.use(
      http.post('/api/store/cart/remove', () =>
        HttpResponse.json({ error: 'Remove item failed' }, { status: 500 })
      )
    )
    await store.getState().removeLine(['line-1'])
    expect(store.getState().isLoading).toBe(false)
    expect(store.getState().error).toBe('Remove item failed')
  })
})

describe('cart store — clearError', () => {
  // clearError is called by the UI to dismiss error banners. Without it,
  // a previous error would persist across subsequent actions.

  it('clears the error state', () => {
    const store = createCartStore()
    store.setState({ error: 'Something went wrong' })
    store.getState().clearError()
    expect(store.getState().error).toBeNull()
  })
})
