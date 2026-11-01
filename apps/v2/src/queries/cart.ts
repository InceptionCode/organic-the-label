import { mutationOptions, queryOptions, type MutationState, type QueryClient } from '@tanstack/react-query'
import { addToCartFn, getCartFn, removeCartLinesFn, updateCartLineFn } from '~/fns/cart.fn'
import { CART_UNAVAILABLE_MESSAGE, type Cart, type CartResult } from '~/server/shopify/types'

// The cart is per-visitor: never prefetched in loaders, so anonymous HTML stays CDN-cacheable.
// Components read it with useQuery after hydration.
export const cartQueries = {
  current: () =>
    queryOptions({
      queryKey: ['cart'],
      queryFn: () => getCartFn(),
      staleTime: 0,
      // Returning from Shopify checkout (same tab) or another tab picks up a completed or changed cart.
      refetchOnWindowFocus: 'always',
    }),
}

/** Every cart mutation shares this key prefix; `useIsMutating({ mutationKey: cartMutationKey })` drives disabled states. */
export const cartMutationKey = ['cart'] as const

function writeCart(queryClient: QueryClient, cart: Cart | null) {
  // userErrors belong to the mutation, not to the cached cart.
  queryClient.setQueryData<CartResult>(cartQueries.current().queryKey, { cart, userErrors: [] })
}

export function addToCartMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...cartMutationKey, 'add'],
    mutationFn: (input: { variantId: string; quantity: number }) => addToCartFn({ data: input }),
    onSuccess: (result: CartResult) => {
      if (result.cart) writeCart(queryClient, result.cart)
    },
  })
}

export function updateCartLineMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...cartMutationKey, 'update'],
    mutationFn: (input: { lineId: string; quantity: number }) => updateCartLineFn({ data: input }),
    // A null cart means it expired or was completed: show the empty drawer.
    onSuccess: (result: CartResult) => writeCart(queryClient, result.cart),
  })
}

export function removeCartLinesMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...cartMutationKey, 'remove'],
    mutationFn: (input: { lineIds: string[] }) => removeCartLinesFn({ data: input }),
    onSuccess: (result: CartResult) => writeCart(queryClient, result.cart),
  })
}

type CartMutationSnapshot = Pick<MutationState<unknown, Error | null>, 'status' | 'data'>

/**
 * The message to show for a settled cart mutation, or null when it succeeded cleanly or is still running.
 * Thrown errors always map to one fixed message: the adapter already sends exactly this text, and a
 * gateway or network failure must never surface a raw response body.
 */
export function cartMutationMessage(state: CartMutationSnapshot): string | null {
  if (state.status === 'error') return CART_UNAVAILABLE_MESSAGE
  if (state.status !== 'success') return null
  const result = state.data as CartResult | undefined
  return result?.userErrors[0]?.message ?? null
}

/** True when an add-to-cart result should read as a failure to the shopper. */
export function isFailedAdd(result: CartResult): boolean {
  return !result.cart || result.userErrors.length > 0
}
