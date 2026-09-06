import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../utils/render'

/**
 * CompositionFilters derives its state from the URL. The regression it guards
 * against: local useState seeded once from searchParams goes stale after a
 * client-side navigation (Reset filters, back/forward), leaving the controls
 * showing filters that are no longer applied.
 */

const push = vi.fn()
let currentParams = new URLSearchParams('')

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, prefetch: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/compositions',
  useSearchParams: () => currentParams,
}))

import CompositionFilters from '@/app/compositions/components/composition-filters'

beforeEach(() => {
  push.mockClear()
  currentParams = new URLSearchParams('')
})

describe('CompositionFilters — initial state from the URL', () => {
  it('seeds the search box from ?search', () => {
    currentParams = new URLSearchParams('search=gunna')
    render(<CompositionFilters />)
    expect(screen.getByLabelText('Search loops')).toHaveValue('gunna')
  })

  it('reflects the active range and sort in the select triggers', () => {
    currentParams = new URLSearchParams('range=30d&sort=oldest')
    render(<CompositionFilters />)
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
    expect(screen.getByText('Oldest first')).toBeInTheDocument()
  })

  it('shows "Clear all" only when a filter is active', () => {
    render(<CompositionFilters />)
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()

    currentParams = new URLSearchParams('tags=melodic')
    render(<CompositionFilters />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })
})

describe('CompositionFilters — writing to the URL', () => {
  it('pushes /compositions?search=… when the user types', async () => {
    render(<CompositionFilters />)
    fireEvent.change(screen.getByLabelText('Search loops'), { target: { value: 'rhodes' } })
    await waitFor(() => expect(push).toHaveBeenCalledWith('/compositions?search=rhodes'))
  })

  it('drops the param entirely when the search box is cleared', async () => {
    currentParams = new URLSearchParams('search=rhodes')
    render(<CompositionFilters />)
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/compositions'))
  })

  it('always resets pagination (drops ?after) on a filter change', async () => {
    currentParams = new URLSearchParams('after=cursor123')
    render(<CompositionFilters />)
    fireEvent.change(screen.getByLabelText('Search loops'), { target: { value: 'x' } })
    await waitFor(() => {
      const url = push.mock.calls.at(-1)?.[0] as string
      expect(url).not.toContain('after')
      expect(url).toContain('search=x')
    })
  })

  it('"Clear all" navigates to a bare /compositions', async () => {
    currentParams = new URLSearchParams('search=gunna&range=30d&tags=melodic')
    render(<CompositionFilters />)
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/compositions'))
  })
})

describe('CompositionFilters — staying in sync with client-side navigation', () => {
  it('updates the search box when ?search changes from elsewhere (the regression)', () => {
    currentParams = new URLSearchParams('search=gunna')
    const { rerender } = render(<CompositionFilters />)
    expect(screen.getByLabelText('Search loops')).toHaveValue('gunna')

    // Simulate a Reset / back-button navigation: the URL no longer has ?search.
    currentParams = new URLSearchParams('')
    rerender(<CompositionFilters />)
    expect(screen.getByLabelText('Search loops')).toHaveValue('')
  })

  it('updates the range/sort triggers when the URL changes', () => {
    currentParams = new URLSearchParams('range=30d&sort=oldest')
    const { rerender } = render(<CompositionFilters />)
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()

    currentParams = new URLSearchParams('')
    rerender(<CompositionFilters />)
    expect(screen.getByText('All time')).toBeInTheDocument()
    expect(screen.getByText('Newest first')).toBeInTheDocument()
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument()
  })
})
