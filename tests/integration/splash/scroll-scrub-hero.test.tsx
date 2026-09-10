import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../../utils/render'
import { ScrollScrubHero } from '@/ui-components/scroll-scrub-hero'

// jsdom has no real 2D context. Provide a stub so the RAF/scrub effect runs;
// drawing calls are no-ops.
function ctxStub() {
  return {
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '#000',
  }
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctxStub() as unknown as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ScrollScrubHero', () => {
  it('renders a canvas, the three text beats, and the scroll hint', () => {
    const { container } = render(<ScrollScrubHero onEnter={vi.fn()} />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-beat]')).toHaveLength(3)
    expect(screen.getByText(/the studio opens/i)).toBeInTheDocument()
    expect(screen.getByText(/every session starts with one sound/i)).toBeInTheDocument()
    expect(screen.getByText(/organic sonics/i)).toBeInTheDocument()
    expect(screen.getByText(/elevate your sound/i)).toBeInTheDocument()
    expect(screen.getByText('SCROLL')).toBeInTheDocument()
    expect(screen.getByText('ENTER')).toBeInTheDocument()
  })

  it('calls onEnter exactly once after scrolling well past the end', async () => {
    const onEnter = vi.fn()
    render(<ScrollScrubHero onEnter={onEnter} frameCount={10} />)

    // Each wheel adds ~90/2200 to the target; push far past 1 + COMMIT_MARGIN.
    for (let i = 0; i < 150; i++) {
      fireEvent.wheel(window, { deltaY: 90 })
    }

    await waitFor(() => expect(onEnter).toHaveBeenCalledTimes(1), { timeout: 2000 })

    // Further scrolling must not re-fire it.
    for (let i = 0; i < 20; i++) fireEvent.wheel(window, { deltaY: 90 })
    await new Promise((r) => setTimeout(r, 100))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })
})
