import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../utils/render'
import { Navbar } from '@/app/components/navbar'
import { anonUser, signedInUser } from '../../fixtures/users'

// Navbar calls safeParseUser(defaultUserState) which internally calls useUser().
// Mocking the hook module lets tests control the user state without needing
// AuthStoreProvider (which would try to instantiate a real Supabase client).
vi.mock('@/utils/hooks/use-safe-parse-user', () => ({
  default: vi.fn(),
}))

// Navbar calls usePathname to determine the active nav link.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

// Navbar and ProfileDropdown render next/image for the logo and avatar.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}))

// CartIconButton (inside Navbar) calls useTrackingReady. Returning false
// prevents the analytics effect from running during tests.
vi.mock('@/store/activity-hydrator', () => ({
  useTrackingReady: () => false,
}))

// ProfileDropdown calls useSignOut which creates a Supabase client.
// Mock it to avoid real auth SDK initialization in tests.
vi.mock('@/utils/hooks/use-sign-out', () => ({
  default: () => ({ signOutHandler: vi.fn() }),
}))

import useSafeParseUser from '@/utils/hooks/use-safe-parse-user'

describe('Navbar — auth state', () => {
  beforeEach(() => {
    vi.mocked(useSafeParseUser).mockReset()
  })

  // An anonymous visitor should see a "Login" link so they can sign in.
  // Showing the ProfileDropdown to an anon user would be a security / UX bug.
  it('shows a Login link when the user is anonymous', () => {
    vi.mocked(useSafeParseUser).mockReturnValue(anonUser)
    render(<Navbar />)
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
  })

  // The ProfileDropdown should NOT render for anonymous users.
  it('does not show the ProfileDropdown when the user is anonymous', () => {
    vi.mocked(useSafeParseUser).mockReturnValue(anonUser)
    render(<Navbar />)
    // ProfileDropdown renders a MenuButton with sr-only text "Open user menu"
    expect(screen.queryByRole('button', { name: /open user menu/i })).not.toBeInTheDocument()
  })

  // A signed-in user should see the profile avatar/menu instead of the Login link.
  // Showing the Login link to a logged-in user would confuse them and could
  // trigger unnecessary re-login flows.
  it('shows the ProfileDropdown when the user is signed in', () => {
    vi.mocked(useSafeParseUser).mockReturnValue(signedInUser)
    render(<Navbar />)
    expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument()
  })

  it('does not show the Login link when the user is signed in', () => {
    vi.mocked(useSafeParseUser).mockReturnValue(signedInUser)
    render(<Navbar />)
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument()
  })

  // The brand name should always be present regardless of auth state.
  // This is a baseline render sanity check.
  it('renders the brand name', () => {
    vi.mocked(useSafeParseUser).mockReturnValue(anonUser)
    render(<Navbar />)
    expect(screen.getByText('ORGANIC SONICS')).toBeInTheDocument()
  })
})
