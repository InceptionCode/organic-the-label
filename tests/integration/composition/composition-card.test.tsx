import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../utils/render'
import { CompositionCard } from '@/app/compositions/components/composition-card'
import {
  mockCompositionListItem,
  mockYouTubeComposition,
} from '../../fixtures/compositions'

// WaveformPlayer drives an <audio> element; swap it for a marker so these tests
// stay focused on the card's structure.
vi.mock('@/app/components/waveform-player', () => ({
  WaveformPlayer: ({ src }: { src: string }) => (
    <div data-testid="waveform-player" data-src={src} />
  ),
}))

describe('CompositionCard — rendering', () => {
  beforeEach(() => {
    render(<CompositionCard composition={mockCompositionListItem} />)
  })

  it('renders the loop title', () => {
    expect(screen.getByRole('heading', { name: 'Midnight Rhodes Loop' })).toBeInTheDocument()
  })

  it('renders the platform + posted date eyebrow', () => {
    expect(screen.getByText(/Instagram · Aug 20, 2026/)).toBeInTheDocument()
  })

  it('renders the BPM · key meta line', () => {
    expect(screen.getByText(/82 BPM/)).toBeInTheDocument()
    expect(screen.getByText(/F# minor/)).toBeInTheDocument()
  })

  it('renders the description', () => {
    expect(
      screen.getByText('Warm Rhodes chords with tape hiss and a slow vibrato.'),
    ).toBeInTheDocument()
  })

  it('renders each tag', () => {
    expect(screen.getByText('melodic')).toBeInTheDocument()
    expect(screen.getByText('vintage')).toBeInTheDocument()
  })

  it('renders the waveform preview fed by the audio file url', () => {
    expect(screen.getByTestId('waveform-player')).toHaveAttribute(
      'data-src',
      mockCompositionListItem.audio_file_url,
    )
  })

  it('renders the Download loop button and the more-options menu trigger', () => {
    expect(screen.getByRole('button', { name: /download loop/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /more options for midnight rhodes loop/i }),
    ).toBeInTheDocument()
  })
})

describe('CompositionCard — embed', () => {
  it('renders an Instagram /embed/ iframe for an instagram composition', () => {
    const { container } = render(<CompositionCard composition={mockCompositionListItem} />)
    const iframe = container.querySelector('iframe')
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.instagram.com/reel/CxAmpleReelId/embed/',
    )
  })

  it('renders a youtube-nocookie iframe for a youtube composition', () => {
    const listItem = {
      ...mockCompositionListItem,
      platform: mockYouTubeComposition.platform,
      embed_url: mockYouTubeComposition.embed_url,
    }
    const { container } = render(<CompositionCard composition={listItem} />)
    expect(container.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })
})

describe('CompositionCard — download action', () => {
  const createObjectURL = vi.fn(() => 'blob:mock')
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['zip']), { status: 200 })))
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    // The download builds a temp <a> and clicks it; jsdom can't navigate.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('requests /api/composition/download/<slug> when Download loop is clicked', async () => {
    render(<CompositionCard composition={mockCompositionListItem} />)
    fireEvent.click(screen.getByRole('button', { name: /download loop/i }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/composition/download/midnight-rhodes-loop'),
    )
  })
})
