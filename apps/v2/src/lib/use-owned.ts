import { useQuery } from '@tanstack/react-query'
import { accountQueries } from '~/queries/account'
import type { OwnedProduct } from '~/server/account/owned-products'
import { accessRequestHref, accessRequestSearch, type ContactPrefill } from './contact-prefill'
import { useSession } from './use-session'

const EMPTY: ReadonlySet<string> = new Set()
const EMPTY_MAP: ReadonlyMap<string, OwnedProduct> = new Map()

/**
 * Product ids the signed-in user owns (active entitlements), for the "Owned" state on cards and the
 * product page. Anonymous visitors make no request and always get the empty set, so the SSR render
 * stays the anonymous default. Shares the /account library's cache entry; sign-out drops it with
 * the rest of the `['account']` queries.
 */
export function useOwnedProductIds(): ReadonlySet<string> {
  const session = useSession()
  const { data } = useQuery({
    ...accountQueries.ownedProducts(),
    enabled: !!session,
    staleTime: 10 * 60_000,
    select: (items) => new Set(items.map((item) => item.product.id)),
  })
  return session && data ? data : EMPTY
}

/**
 * The signed-in user's owned products by product id (same cache entry and rules as
 * `useOwnedProductIds`), for surfaces that need the entry itself: the "Request access" link needs
 * the title and order id.
 */
export function useOwnedProducts(): ReadonlyMap<string, OwnedProduct> {
  const session = useSession()
  const { data } = useQuery({
    ...accountQueries.ownedProducts(),
    enabled: !!session,
    staleTime: 10 * 60_000,
    select: (items) => new Map(items.map((item) => [item.product.id, item])),
  })
  return session && data ? data : EMPTY_MAP
}

/** Library row anchor for an owned product ("View in your library"). */
export function ownedLibraryHash(handle: string) {
  return `owned-${handle}`
}

export type OwnedAccess =
  | { kind: 'direct'; href: string; label: 'Access' }
  | { kind: 'contact'; href: string; search: ContactPrefill; label: 'Request access' }

type AccessInput = Pick<OwnedProduct, 'orderId'> & {
  product: Pick<OwnedProduct['product'], 'title'>
  /** A real per-product download URL. No data source provides one today (pages/account.md). */
  accessUrl?: string | null
}

/**
 * Where "Access" goes for an owned paid product. A direct https URL wins when the data carries one;
 * otherwise (every product today: paid files are delivered by Shopify) a /contact access request
 * prefilled with the category, subject, message, and the order id when known.
 */
export function resolveOwnedAccess(owned: AccessInput): OwnedAccess {
  const url = owned.accessUrl?.trim()
  if (url && /^https:\/\//.test(url)) return { kind: 'direct', href: url, label: 'Access' }
  return {
    kind: 'contact',
    href: accessRequestHref(owned.product.title, owned.orderId),
    search: accessRequestSearch(owned.product.title, owned.orderId),
    label: 'Request access',
  }
}

/** Free resources keep their direct download route (a server route that 302s to the file). */
export function freeResourceDownloadHref(downloadId: string) {
  return `/free/download/${downloadId}`
}
