import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../utils/render'
import { SessionSplash } from '@/app/components/session-splash'

// The splash renders the canvas scroll-scrub hero (RAF loop, image preload,
// ResizeObserver). Stub it — these tests are about the session gate and the
// dismiss wiring, not the visual.
vi.mock('@/ui-components/scroll-scrub-hero', () => ({
  __esModule: true,
  ScrollScrubHero: () => <div data-testid="scroll-scrub-hero" />,
}))

function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  window.sessionStorage.clear()
  setReducedMotion(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SessionSplash — session gate', () => {
  // First visit of a session, motion allowed: the splash mounts and offers a
  // way in.
  it('shows on a fresh session and renders an "Enter site" action', async () => {
    render(<SessionSplash />)
    expect(await screen.findByTestId('scroll-scrub-hero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter site/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  // Clicking "Enter site" tears the overlay down and records that this session
  // has seen it, so it will not return on the next navigation.
  it('dismisses on "Enter site" and marks the session seen', async () => {
    render(<SessionSplash />)
    fireEvent.click(await screen.findByRole('button', { name: /enter site/i }))

    await waitFor(() =>
      expect(screen.queryByTestId('scroll-scrub-hero')).not.toBeInTheDocument(),
    )
    expect(window.sessionStorage.getItem('splashSeen')).toBe('true')
  })

  // "Skip" is an equivalent dismissal.
  it('dismisses on "Skip"', async () => {
    render(<SessionSplash />)
    fireEvent.click(await screen.findByRole('button', { name: /skip/i }))

    await waitFor(() =>
      expect(screen.queryByTestId('scroll-scrub-hero')).not.toBeInTheDocument(),
    )
    expect(window.sessionStorage.getItem('splashSeen')).toBe('true')
  })

  // A session that has already seen the splash never renders it again.
  it('renders nothing when the session is already marked seen', () => {
    window.sessionStorage.setItem('splashSeen', 'true')
    render(<SessionSplash />)
    expect(screen.queryByTestId('scroll-scrub-hero')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /enter site/i })).not.toBeInTheDocument()
  })

  // Motion-sensitive visitors never see the (motion-only) splash; the session
  // is marked seen silently so nothing pops in later either.
  it('never renders under prefers-reduced-motion and marks the session seen', async () => {
    setReducedMotion(true)
    render(<SessionSplash />)
    expect(screen.queryByTestId('scroll-scrub-hero')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(window.sessionStorage.getItem('splashSeen')).toBe('true'),
    )
  })
})
