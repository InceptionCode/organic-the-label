import type { ReactNode } from 'react'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { RouterContext } from '~/router'
import appCss from '~/styles/app.css?url'
import interLatinWoff2 from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import bebasLatinWoff2 from '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2?url'

const SITE_DESCRIPTION =
  'Premium beats, drum kits, sample packs, and sound design for modern producers.'

// Runs before first paint: dark is the default; a stored "light" preference swaps the class.
const THEME_SCRIPT = `try{if(localStorage.getItem('theme')==='light'){var d=document.documentElement;d.classList.remove('dark');d.classList.add('light')}}catch(e){}`

const fontPreload = (href: string) => ({
  rel: 'preload',
  href,
  as: 'font',
  type: 'font/woff2',
  crossOrigin: 'anonymous' as const,
})

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#171717' },
      { title: 'Organic Sonics' },
      { name: 'description', content: SITE_DESCRIPTION },
    ],
    links: [
      fontPreload(interLatinWoff2),
      fontPreload(bebasLatinWoff2),
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', href: '/brand-assets/organic-sonics-logo.png' },
      { rel: 'apple-touch-icon', href: '/brand-assets/organic-sonics-logo.png' },
    ],
  }),
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
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Outlet />
    </main>
  )
}
