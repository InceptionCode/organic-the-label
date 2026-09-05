import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/render'
import { ProductCard } from '@/app/store/components/product-card'
import { mockProduct, mockExclusiveProduct, mockFreeProduct } from '../../fixtures/products'

// ProductCard renders next/image, which requires a real loader in jsdom.
// Replace with a plain <img> so the component renders without loader errors.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}))

// AudioPreviewList has audio playback that does not work in jsdom.
// Replaced with null to keep these tests focused on product card rendering.
vi.mock('@/ui-components/audio-preview-list', () => ({
  default: () => null,
}))

// ProductCard contains a Link component from next/link, which needs useRouter.
// The mock provides the minimum needed to render links without errors.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/store',
  useSearchParams: () => new URLSearchParams(''),
}))

// AddToCartButton (inside ProductCard) calls useCartStore to get addToCart.
// Mocking useCartStore prevents real network calls to /api/store/cart/add
// during these rendering-focused tests, which are concerned with the card's
// visual output — not the cart mutation behaviour.
// Note: AddToCartButton no longer reads isLoading from the store; it manages
// its own local isPending state so only the clicked button shows "Adding...".
vi.mock('@/store/cart-context', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/store/cart-context')>()
  return {
    ...mod,
    useCartStore: vi.fn((selector: (s: unknown) => unknown) =>
      selector({ addToCart: vi.fn() } as never)
    ),
  }
})

describe('ProductCard — rendering', () => {
  // ProductCard is the primary conversion surface — every store page consists
  // of a grid of these. Missing critical data (name, price, category) would
  // be invisible without automated tests.

  it('renders the product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Sample Drum Kit')).toBeInTheDocument()
  })

  // formatPrice uses toFixed(2), so 29.99 → "$29.99".
  // A wrong price display would cause user confusion or lost sales.
  it('renders the formatted price', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  // The category label appears in the card's glass overlay.
  it('renders the category label', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('kit')).toBeInTheDocument()
  })

  // Tags are shown as small pills — they communicate genre/mood to the shopper.
  it('renders product tags', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('trap')).toBeInTheDocument()
    expect(screen.getByText('hiphop')).toBeInTheDocument()
  })

  // The "Exclusive" badge communicates membership-gated content.
  // If the badge is missing, members may not realise they have access to it.
  it('renders the Exclusive badge for exclusive products', () => {
    render(<ProductCard product={mockExclusiveProduct} />)
    expect(screen.getByText('Exclusive')).toBeInTheDocument()
  })

  it('does not render the Exclusive badge for non-exclusive products', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.queryByText('Exclusive')).not.toBeInTheDocument()
  })

  // Free products are a key acquisition hook. Showing the wrong price would
  // either confuse users or break the perceived value proposition.
  it('renders $0.00 for free products', () => {
    render(<ProductCard product={mockFreeProduct} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  // The Add to Cart button must be present. Without it, the user cannot
  // initiate a purchase from the store listing.
  it('renders an Add to cart button', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })
})

describe('ProductCard — links', () => {
  // Product links must point to the correct detail page URL. A broken link
  // would prevent users from viewing product details or completing a purchase.

  it('the product image link points to /store/:handle', () => {
    render(<ProductCard product={mockProduct} />)
    // The product name is rendered inside the image link area
    const links = screen.getAllByRole('link')
    const productLinks = links.filter((l) => l.getAttribute('href') === '/store/sample-drum-kit')
    expect(productLinks.length).toBeGreaterThan(0)
  })

  it('the View link points to /store/:handle', () => {
    render(<ProductCard product={mockProduct} />)
    const viewLink = screen.getByRole('link', { name: /view/i })
    expect(viewLink).toHaveAttribute('href', '/store/sample-drum-kit')
  })
})
