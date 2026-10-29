import { lazy, Suspense, type ReactNode } from 'react'
import { noop } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation } from '@tanstack/react-router'
import type { RouterContext } from '~/router'
import { AuthSync } from '~/components/shell/auth-sync'
import { CartDrawerProvider } from '~/components/shell/cart-drawer-provider'
import { Footer } from '~/components/shell/footer'
import { Navbar } from '~/components/shell/navbar'
import { SkipLink } from '~/components/shell/skip-link'
import { ErrorPage } from '~/components/errors/error-page'
import { NotFoundPage } from '~/components/errors/not-found-page'
import { useMarkHydrated } from '~/lib/use-client-nav-focus'
import { productQueries } from '~/queries/products'
import { sessionQueryOptions } from '~/queries/session'
import { seo } from '~/seo/head'
import { organizationJsonLd, websiteJsonLd } from '~/seo/jsonld'
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, LOGO_PATH, SITE_NAME, absoluteUrl } from '~/seo/site'
import appCss from '~/styles/app.css?url'
import interLatinWoff2 from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import bebasLatinWoff2 from '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2?url'

const StickyProductBar = lazy(() =>
  import('~/components/shell/sticky-product-bar').then((m) => ({ default: m.StickyProductBar })),
)

// Hidden on the store and product pages: the grid already lists every product, and on a product page the
// bar repeats the product being viewed (and covers the tracklist). It shows on every other page.
const hidesStickyBar = (pathname: string) => pathname === '/store' || pathname.startsWith('/store/')

const NOT_FOUND_DESCRIPTION =
  'The page you were looking for could not be found. Head back to the Organic Sonics home page or browse the store for kits and packs.'

const THEME_SCRIPT = `try{if(localStorage.getItem('theme')==='light'){var d=document.documentElement;d.classList.remove('dark');d.classList.add('light')}}catch(e){}`

const fontPreload = (href: string) => ({
  rel: 'preload',
  href,
  as: 'font',
  type: 'font/woff2',
  crossOrigin: 'anonymous' as const,
})

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query(sessionQueryOptions())
    return { session }
  },

  loader: ({ context }) => {
    void context.queryClient.query(productQueries.newest(5)).catch(noop)
  },

  head: ({ matches }) => {
    const notFound = matches.some((m) => m.status === 'notFound' || m._notFound)
    const failed = !notFound && matches.some((m) => m.status === 'error')
    const ogImage = absoluteUrl(DEFAULT_OG_IMAGE.url)
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#070707' },
        { title: SITE_NAME },
        { name: 'description', content: DEFAULT_DESCRIPTION },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: ogImage },
        ...(notFound ? seo({ title: 'Page not found', description: NOT_FOUND_DESCRIPTION, path: '/', noindex: true }).meta : []),
        ...(failed ? seo({ title: 'Something went wrong', description: DEFAULT_DESCRIPTION, path: '/', noindex: true }).meta : []),
        organizationJsonLd(),
        websiteJsonLd(),
      ],
      links: [
        fontPreload(interLatinWoff2),
        fontPreload(bebasLatinWoff2),
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', type: 'image/png', href: LOGO_PATH },
        { rel: 'apple-touch-icon', href: LOGO_PATH },
      ],
    }
  },
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="min-h-dvh flex flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  useMarkHydrated()
  const showStickyBar = useLocation({ select: (l) => !hidesStickyBar(l.pathname) })
  return (
    <CartDrawerProvider>
      <SkipLink />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 w-full outline-none">
        <Outlet />
      </main>
      <Footer />
      {showStickyBar && (
        <Suspense fallback={null}>
          <StickyProductBar />
        </Suspense>
      )}
      <AuthSync />
    </CartDrawerProvider>
  )
}
