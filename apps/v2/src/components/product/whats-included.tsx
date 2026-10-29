import type { Product } from '~/server/shopify/types'

const CATEGORY_LABEL: Record<string, string> = {
  beat: 'Beat',
  kit: 'Kit',
  pack: 'Pack',
  bank: 'Bank',
  plugin: 'Plugin',
  suite: 'Suite',
  free: 'Free',
  merch: 'Merch',
}

/** Label column ("What's included" + the category breakdown label), then hairline rows of items. */
export function WhatsIncluded({ items, category }: { items: Product['whatsIncluded']; category: string }) {
  if (items.length === 0) return null
  const label = `${CATEGORY_LABEL[category] ?? 'Kit'} breakdown`

  return (
    <section aria-labelledby="whats-included-heading" className="section-y-standard hairline-t">
      <div className="content-container grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-3">
          <h2 id="whats-included-heading" className="text-h1 text-primary">
            WHAT&apos;S INCLUDED
          </h2>
          <p className="mt-3 text-label">{label}</p>
        </div>

        <ul className="border-b border-[color:var(--border-subtle)] lg:col-span-9">
          {items.map((item, i) => (
            <li
              key={`${item.label}-${i}`}
              className="grid gap-1 border-t border-[color:var(--border-subtle)] py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-baseline md:gap-8"
            >
              <p className="text-h4 text-primary">{item.label}</p>
              {item.description && <p className="text-body-m text-muted">{item.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
