import { createMiddleware } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { isProductionEnv, xRobotsTag } from '~/server/seo/robots'

// Every non-production host (previews, local dev) sends X-Robots-Tag: noindex, nofollow on every
// response: HTML, XML, server routes and server fns. It does not depend on head() running.
export const robotsHeader = createMiddleware().server(async ({ next }) => {
  const value = xRobotsTag(isProductionEnv())
  if (value) setResponseHeader('X-Robots-Tag', value)
  return next()
})
