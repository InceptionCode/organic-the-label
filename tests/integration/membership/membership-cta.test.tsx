import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/render'
import { MembershipCtaHero } from '@/app/components/membership-cta-hero'

// MembershipCtaHero is a pure presentational component — it always renders the
// CTA content and delegates visibility to its parent server component (which
// reads the dismissed cookie via checkMembershipCtaVisibility).
// These tests verify the rendered content is correct and complete.

// MembershipCtaHero contains a Link (next/link) and DismissMembershipCtaButton
// which uses useRouter internally.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(''),
}))

// DismissMembershipCtaButton calls a server action — mock at the hook level
// to avoid an unresolvable server-action import in jsdom.
vi.mock('@/app/components/dismiss-membership-cta-button', () => ({
  DismissMembershipCtaButton: () => (
    <button type="button" aria-label="Dismiss membership offer">
      No thanks
    </button>
  ),
}))

describe('MembershipCtaHero — rendering', () => {
  // The heading is the primary conversion message — it must always be rendered
  // so members-to-be can understand what they are signing up for.
  it('renders the membership CTA heading', () => {
    render(<MembershipCtaHero />)
    expect(
      screen.getByRole('heading', { name: /unlock member pricing/i })
    ).toBeInTheDocument()
  })

  // The section must have an accessible landmark label so screen-reader users
  // can navigate to and past it with region navigation.
  it('renders as a section with an accessible heading reference', () => {
    render(<MembershipCtaHero />)
    // Heading id="membership-cta-heading" is referenced by aria-labelledby on the section
    const heading = screen.getByRole('heading', { name: /unlock member pricing/i })
    expect(heading).toHaveAttribute('id', 'membership-cta-heading')
  })

  // The Sign Up link is the primary CTA — it must be present and point to /signup.
  // A broken link would prevent acquisition entirely.
  it('renders a Sign up link pointing to /signup', () => {
    render(<MembershipCtaHero />)
    const signUpLink = screen.getByRole('link', { name: /sign up/i })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute('href', '/signup')
  })

  // The dismiss button lets users hide the CTA without signing up.
  // Missing it would leave no way to close the banner.
  it('renders the dismiss button', () => {
    render(<MembershipCtaHero />)
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })

  // The CTA must mention the key benefit ("exclusive") to drive sign-ups.
  it('renders copy referencing exclusive benefits', () => {
    render(<MembershipCtaHero />)
    expect(screen.getByText(/exclusive/i)).toBeInTheDocument()
  })
})
