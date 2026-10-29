import type { ReactNode } from 'react'
import { cn } from '~/ui/cn'

/**
 * One account section, flat: a hairline on top, the Bebas title (and an optional action) in a label
 * column on lg, the content beside it. Same pattern as Home's featured kits and Product's what's included.
 */
export function AccountCard({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  const id = `account-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section aria-labelledby={id} className={cn('hairline-t grid gap-6 py-10 md:py-14 lg:grid-cols-12 lg:gap-8', className)}>
      <div className="flex items-baseline justify-between gap-4 lg:col-span-4 lg:flex-col lg:justify-start lg:gap-3">
        <h2 id={id} className="text-h2 text-primary">
          {title}
        </h2>
        {action}
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  )
}
