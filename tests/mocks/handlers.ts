import { http, HttpResponse } from 'msw'
import { mockCart, emptyCart } from '../fixtures/cart'
import { supabaseSignedInUser } from '../fixtures/users'
import { GetUserActionState } from '@/app/api/auth/get-user'
import { mapSupabaseUser } from '@/store/auth-context'

/**
 * MSW request handlers for unit/integration tests.
 *
 * These intercept fetch calls made by the app under test so tests don't
 * hit real Shopify or Supabase endpoints.
 *
 * IMPORTANT: Response shapes here must match what the real API routes return.
 * All cart routes return { ok: true, cart: Cart } on success.
 * The jsonFetch utility uses failOnOkFalse: true, so { ok: true } is required.
 *
 * How to use:
 * - Import `server` from ./server — it is already wired up in vitest.setup.ts.
 * - Override per-test with server.use(http.post(...)) for specific edge cases.
 *   afterEach resets handlers automatically via server.resetHandlers().
 */
export const handlers = [
  // --- Cart API ---
  // Shapes match app/api/store/cart/get/route.ts response: { ok: true, cart }
  http.get('/api/store/cart/get', () => {
    return HttpResponse.json({ ok: true, cart: mockCart })
  }),

  // Shapes match app/api/store/cart/add/route.ts response: { ok: true, cart }
  http.post('/api/store/cart/add', () => {
    return HttpResponse.json({ ok: true, cart: mockCart })
  }),

  // Shapes match app/api/store/cart/update/route.ts response: { ok: true, cart }
  http.post('/api/store/cart/update', () => {
    return HttpResponse.json({ ok: true, cart: mockCart })
  }),

  // Shapes match app/api/store/cart/remove/route.ts response: { ok: true, cart }
  http.post('/api/store/cart/remove', () => {
    return HttpResponse.json({ ok: true, cart: emptyCart })
  }),

  // --- Auth API ---
  http.get('/api/auth/get-user', () => {
    return HttpResponse.json<GetUserActionState>({ user: mapSupabaseUser(supabaseSignedInUser), error: null })
  }),

  // --- Activity API ---
  // Silently absorb tracking calls so they don't cause unhandled request warnings
  http.post('/api/activity/track', () => {
    return HttpResponse.json({ ok: true })
  }),
]
