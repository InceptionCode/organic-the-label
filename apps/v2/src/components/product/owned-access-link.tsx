import { Link } from '@tanstack/react-router'
import type { OwnedAccess } from '~/lib/use-owned'
import { buttonClasses, type ButtonStyleProps } from '~/ui/button'

/**
 * The action for an owned product: "Access" to a direct download when one exists, otherwise
 * "Request access", which opens /contact prefilled with an access request (client navigation).
 */
export function OwnedAccessLink({
  access,
  title,
  className,
  ...style
}: { access: OwnedAccess; title: string } & ButtonStyleProps) {
  const classes = buttonClasses({ ...style, className })
  if (access.kind === 'direct') {
    return (
      <a href={access.href} target="_blank" rel="noopener noreferrer" aria-label={`Access ${title}`} className={classes}>
        {access.label}
      </a>
    )
  }
  return (
    <Link to="/contact" search={access.search} aria-label={`Request access to ${title}`} className={classes}>
      {access.label}
    </Link>
  )
}
