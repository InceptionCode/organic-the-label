import { SITE_ORIGIN } from '~/seo/site'

// VERCEL_ENV is the only production signal: 'production' on the production deployment, 'preview'
// on previews, unset in local dev. Anything but 'production' is treated as non-production.
export function isProductionEnv(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv === 'production'
}

export const ROBOTS_DISALLOW = [
  '/account',
  '/auth',
  '/login',
  '/signup',
  '/search',
  '/free/download/',
  '/compositions/download/',
  '/api/',
] as const

export function buildRobotsTxt(production: boolean): string {
  if (!production) return ['User-agent: *', 'Disallow: /', ''].join('\n')
  return [
    'User-agent: *',
    ...ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n')
}

export const X_ROBOTS_TAG_NONPROD = 'noindex, nofollow'

/** Value for the X-Robots-Tag header, or null when the header must not be sent. */
export function xRobotsTag(production: boolean): string | null {
  return production ? null : X_ROBOTS_TAG_NONPROD
}
