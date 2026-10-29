import type { ReactNode } from 'react'
import { cn } from '~/ui/cn'

type FlatHeadingProps = {
  title: string
  id?: string
  description?: ReactNode
  className?: string
}

/**
 * Flat section heading for the redesigned Work With Me sections: one-color Bebas, no eyebrow, no
 * drawn rule. Recent posts keeps the original SectionHeading (user decision 2026-10-28).
 */
export function FlatHeading({ title, id, description, className }: FlatHeadingProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <h2 id={id} className="text-display-m uppercase text-primary">
        {title}
      </h2>
      {description ? <p className="mt-5 max-w-[56ch] text-body-m text-secondary">{description}</p> : null}
    </div>
  )
}
