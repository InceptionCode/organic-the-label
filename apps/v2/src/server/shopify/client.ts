import { env } from '~/server/env'

export class ShopifyError extends Error {
  readonly status: number | null
  readonly graphqlErrors: { message: string }[]

  constructor(message: string, opts: { status?: number | null; graphqlErrors?: { message: string }[]; cause?: unknown } = {}) {
    super(message, { cause: opts.cause })
    this.name = 'ShopifyError'
    this.status = opts.status ?? null
    this.graphqlErrors = opts.graphqlErrors ?? []
  }
}

export type ShopifyClientConfig = {
  storeDomain: string
  accessToken: string
  apiVersion: string
  timeoutMs?: number
}

export type ShopifyQueryOptions = { buyerIp?: string }

type GraphQLResponse<TData> = { data?: TData | null; errors?: { message: string }[] }

export function createShopifyClient(config: ShopifyClientConfig) {
  // The env value may carry a scheme or trailing slash (v1's SDK accepted both).
  const domain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const endpoint = `https://${domain}/api/${config.apiVersion}/graphql.json`
  const timeoutMs = config.timeoutMs ?? 8000

  return async function shopifyQuery<TData, TVars extends Record<string, unknown> = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts: ShopifyQueryOptions = {},
  ): Promise<TData> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Shopify-Storefront-Private-Token': config.accessToken,
    }
    if (opts.buyerIp) headers['Shopify-Storefront-Buyer-IP'] = opts.buyerIp

    let res: Response
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: document, variables: variables ?? {} }),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (cause) {
      throw new ShopifyError('Shopify request failed', { cause })
    }

    if (!res.ok) {
      throw new ShopifyError(`Shopify responded with HTTP ${res.status}`, { status: res.status })
    }

    const body = (await res.json()) as GraphQLResponse<TData>
    if (body.errors && body.errors.length > 0) {
      throw new ShopifyError(`Shopify GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`, {
        status: res.status,
        graphqlErrors: body.errors,
      })
    }
    if (body.data == null) {
      throw new ShopifyError('Shopify returned no data', { status: res.status })
    }
    return body.data
  }
}

export const shopifyQuery = createShopifyClient({
  storeDomain: env.SHOPIFY_DEV_STORE_DOMAIN,
  accessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION,
})
