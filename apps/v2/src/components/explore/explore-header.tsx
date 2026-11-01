import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '~/lib/use-session'
import { accountQueries } from '~/queries/account'

/**
 * Visible page header (the page's only h1). v1 had none in the shell; see pages/explore.md deviations.
 * Signed-in users see their name in the small label above the title (owner request 2026-10-28): the
 * profile's display_name first, then the session's display name, then the email's local part.
 * Crawlers and anonymous visitors get the unchanged "Organic Sonics" label.
 */
export function ExploreHeader() {
  const user = useSession()
  const { data: profile } = useQuery({ ...accountQueries.summary(), enabled: Boolean(user) })
  const name = user ? (profile?.displayName || user.displayName || user.email?.split('@')[0] || null) : null
  return (
    <header className="content-container pb-10 pt-12 md:pb-14 md:pt-20">
      <p className="os-hero-rise mb-5 break-words text-label" style={{ '--rise': '12px', '--dur': '0.6s' } as CSSProperties}>
        {name ? `Welcome back, ${name}` : 'Organic Sonics'}
      </p>
      <h1 className="os-hero-rise text-display-l text-primary" style={{ '--delay': '0.08s', '--rise': '32px', '--dur': '0.8s' } as CSSProperties}>
        EXPLORE
      </h1>
      <p
        className="os-hero-rise mt-6 max-w-[52ch] text-body-l text-secondary"
        style={{ '--delay': '0.2s', '--rise': '16px', '--dur': '0.6s' } as CSSProperties}
      >
        New kits and packs, free loops with their terms, and free resources for producers. Everything new on Organic Sonics
        in one place.
      </p>
    </header>
  )
}
