import type { SupabaseClient } from '@supabase/supabase-js'
import { getProductsByIds } from '~/server/catalog/products-by-ids'
import type { ProductSummary } from '~/server/shopify/types'

export type EntitlementRow = {
  product_gid: string
  source: string
  granted_at: string
  expires_at: string | null
  /** gid://shopify/Order/{id} for `source = 'order'` rows (set by the apps/api orders/paid webhook). */
  shopify_order_gid?: string | null
}

export type OwnedProduct = {
  product: Pick<ProductSummary, 'id' | 'handle' | 'title' | 'category' | 'image'>
  source: string
  grantedAt: string
  /** Shopify order id (numeric part of the order GID) for purchases; null for promo/manual grants. */
  orderId: string | null
}

/** `gid://shopify/Order/123` -> `123`. Anything else -> null. */
export function orderIdFromGid(gid: string | null | undefined): string | null {
  const match = /^gid:\/\/shopify\/Order\/(\d+)$/.exec(gid ?? '')
  return match ? match[1]! : null
}

/**
 * Active entitlements for the user, newest first. `client` must be the user-scoped client so
 * `entitlements_select_own` applies. Revoked and expired rows are filtered in the query.
 */
export async function getActiveEntitlements(client: SupabaseClient, userId: string, now: Date = new Date()): Promise<EntitlementRow[]> {
  const { data, error } = await client
    .from('entitlements')
    .select('product_gid, source, granted_at, expires_at, shopify_order_gid')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
    .order('granted_at', { ascending: false })
  if (error) throw new Error(`Failed to load entitlements: ${error.message}`)
  return (data ?? []) as EntitlementRow[]
}

/** Maps entitlements to products. Products Shopify no longer returns are skipped. */
export function joinOwnedProducts(rows: readonly EntitlementRow[], products: readonly ProductSummary[]): OwnedProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const seen = new Set<string>()
  const out: OwnedProduct[] = []
  for (const row of rows) {
    const p = byId.get(row.product_gid)
    if (!p || seen.has(p.id)) continue
    seen.add(p.id)
    out.push({
      product: { id: p.id, handle: p.handle, title: p.title, category: p.category, image: p.image },
      source: row.source,
      grantedAt: row.granted_at,
      orderId: orderIdFromGid(row.shopify_order_gid),
    })
  }
  return out
}

export async function getOwnedProducts(
  client: SupabaseClient,
  userId: string,
  loadProducts: (gids: string[]) => Promise<ProductSummary[]> = getProductsByIds,
): Promise<OwnedProduct[]> {
  const rows = await getActiveEntitlements(client, userId)
  if (rows.length === 0) return []
  const products = await loadProducts(rows.map((r) => r.product_gid))
  return joinOwnedProducts(rows, products)
}
