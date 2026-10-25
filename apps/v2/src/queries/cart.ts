import { queryOptions } from '@tanstack/react-query'
import { getCartFn } from '~/fns/cart.fn'

export const cartQueries = {
  current: () => queryOptions({ queryKey: ['cart'], queryFn: () => getCartFn(), staleTime: 0 }),
}
