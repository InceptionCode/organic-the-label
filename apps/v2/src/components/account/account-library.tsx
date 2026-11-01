import { Link } from '@tanstack/react-router'
import { OwnedAccessLink } from '~/components/product/owned-access-link'
import { freeResourceDownloadHref, ownedLibraryHash, resolveOwnedAccess } from '~/lib/use-owned'
import type { OwnedProduct } from '~/server/account/owned-products'
import type { OwnedResource } from '~/server/account/owned-resources'
import { ButtonLink, buttonClasses } from '~/ui/button'
import { ShopifyImage } from '~/ui/shopify-image'
import { AccountCard } from './account-card'
import { categoryLabel, formatShortDate } from './format'

export function AccountLibrary({ items, resources }: { items: OwnedProduct[]; resources: OwnedResource[] }) {
  const total = items.length + resources.length
  return (
    <AccountCard
      title="Your library"
      action={total > 0 ? <span className="text-label tabular-nums">{total === 1 ? '1 item' : `${total} items`}</span> : null}
    >
      {total === 0 ? (
        <div className="flex flex-col items-start gap-5 border-t border-[color:var(--border-subtle)] pt-6">
          <p className="text-h3 text-primary">No purchases yet.</p>
          <ButtonLink to="/store" variant="outline">
            Browse the store
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {items.length > 0 ? (
            <ul className="flex flex-col border-b border-[color:var(--border-subtle)]" data-testid="account-library">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  id={ownedLibraryHash(item.product.handle)}
                  className="scroll-mt-28 border-t border-[color:var(--border-subtle)] target:border-l-2 target:border-l-[color:var(--accent-primary)] target:pl-4"
                >
                  <LibraryRow item={item} />
                </li>
              ))}
            </ul>
          ) : null}
          {resources.length > 0 ? (
            <section aria-labelledby="library-free-resources" className="flex flex-col gap-4">
              <h3 id="library-free-resources" className="text-h4 text-primary">
                Free resources
              </h3>
              <ul className="flex flex-col border-b border-[color:var(--border-subtle)]" data-testid="account-resources">
                {resources.map((resource) => (
                  <li key={resource.slug} className="border-t border-[color:var(--border-subtle)]">
                    <ResourceRow resource={resource} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </AccountCard>
  )
}

function ResourceRow({ resource }: { resource: OwnedResource }) {
  const date = formatShortDate(resource.requestedAt)
  return (
    <div className="flex min-h-11 items-center gap-4 py-4">
      <div className="flex size-16 shrink-0 items-center justify-center bg-surface-2">
        <img src="/file.svg" alt="" width={64} height={64} className="size-full object-contain p-3 opacity-60" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <Link
          to="/free/$slug"
          params={{ slug: resource.slug }}
          className="line-clamp-2 rounded-sm font-medium text-body-m text-primary underline-offset-[6px] decoration-1 hover:underline active:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
        >
          {resource.name}
        </Link>
        {date ? <p className="text-label">Requested {date}</p> : null}
      </div>
      {/* A plain anchor: /free/download/{id} is a server route that 302s to the file. */}
      <a href={freeResourceDownloadHref(resource.downloadId)} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
        Download
      </a>
    </div>
  )
}

function LibraryRow({ item }: { item: OwnedProduct }) {
  const { product } = item
  const category = categoryLabel(product.category)
  const date = formatShortDate(item.grantedAt)
  // The product link and the access action are siblings (a link can't contain a link).
  return (
    <div className="flex items-center gap-4">
      <Link
        to="/store/$handle"
        params={{ handle: product.handle }}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-4 rounded-sm py-4 active:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]"
      >
        <div className="size-16 shrink-0 overflow-hidden bg-surface-2">
          {product.image?.url ? (
            <ShopifyImage
              src={product.image.url}
              alt={product.image.altText || product.title}
              width={64}
              height={64}
              sizes="64px"
              className="size-full object-cover transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          ) : (
            <img src="/file.svg" alt="" width={64} height={64} className="size-full object-contain p-3 opacity-60" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 font-medium text-body-m text-primary transition-colors duration-150 group-hover:text-[color:var(--text-secondary)]">{product.title}</p>
          {category ? <p className="text-label">{category}</p> : null}
          {date ? (
            <p className="text-label">
              {item.source === 'order' ? 'Purchased' : 'Added'} {date}
            </p>
          ) : null}
        </div>
      </Link>
      <OwnedAccessLink
        access={resolveOwnedAccess(item)}
        title={product.title}
        product={product}
        surface="library"
        variant="link"
        size="sm"
        className="shrink-0"
      />
    </div>
  )
}
