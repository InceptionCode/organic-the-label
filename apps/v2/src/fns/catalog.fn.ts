import { createServerFn } from '@tanstack/react-start'
import * as catalog from '~/server/catalog/products'
import {
  getNewestProductsInputSchema,
  getProductInputSchema,
  listProductsInputSchema,
} from '~/server/shopify/input-schemas'
import { toSafeError } from './errors'

async function run<T>(scope: string, fn: () => Promise<T>, publicMessage: string = 'Could not load products.'): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw toSafeError(`catalog.${scope}`, publicMessage, error)
  }
}

export const getProductFn = createServerFn({ method: 'GET' })
  .validator(getProductInputSchema)
  .handler(({ data }) =>
    run('getProduct', () => catalog.getProduct(data.handle)),
  )

export const getNewestProductsFn = createServerFn({ method: 'GET' })
  .validator(getNewestProductsInputSchema)
  .handler(({ data }) =>
    run('getNewestProducts', () => catalog.getNewestProducts(data.n)),
  )

export const listProductsFn = createServerFn({ method: 'GET' })
  .validator(listProductsInputSchema)
  .handler(({ data }) =>
    run('listProducts', () => catalog.listProducts(data)),
  )

