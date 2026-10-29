import { Link } from '@tanstack/react-router'
import { track } from '~/lib/track'
import type { OwnedAccess } from '~/lib/use-owned'
import { buttonClasses, type ButtonStyleProps } from '~/ui/button'

export function OwnedAccessLink({
  access,
  title,
  product,
  surface,
  className,
  ...style
}: {
  access: OwnedAccess
  title: string
  product: { id: string; handle: string }
  surface: 'card' | 'product' | 'library'
} & ButtonStyleProps) {
  const classes = buttonClasses({ ...style, className })
  if (access.kind === 'direct') {
    return (
      <a href={access.href} target="_blank" rel="noopener noreferrer" aria-label={`Access ${title}`} className={classes}>
        {access.label}
      </a>
    )
  }
  return (
    <Link
      to="/contact"
      search={access.search}
      onClick={() => track('access_requested', { productId: product.id, handle: product.handle, surface })}
      aria-label={`Request access to ${title}`}
      className={classes}
    >
      {access.label}
    </Link>
  )
}
