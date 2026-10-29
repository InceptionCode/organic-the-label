import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeader, getRequestIP, setCookie, setResponseStatus } from '@tanstack/react-start/server'
import { z } from 'zod'
import { env } from '~/server/env'
import { getFeaturedFreeResource, getFreeResourceBySlug } from '~/server/free-resources/get'
import { requestFreeResource } from '~/server/free-resources/request'
import {
  FREE_REQUEST_MESSAGES,
  FREE_RESOURCE_SLUG_PATTERN,
  FreeResourceRequestSchema,
  type FreeResourceRequestResult,
} from '~/server/free-resources/request-schema'
import { ensureVisitor } from '~/server/identity/visitor'
import { toSafeError } from './errors'
import { supabaseSession } from './middleware/session'

/** Public read: the resource shown at /free (featured, else starter kit, else null). */
export const getFeaturedFreeResourceFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await getFeaturedFreeResource()
  } catch (error) {
    throw toSafeError('freeResources.featured', 'Could not load the free resource.', error)
  }
})

/** Public read: one active resource by slug, public columns only (null when missing). */
export const getFreeResourceFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().max(120) }))
  .handler(async ({ data }) => {
    if (!FREE_RESOURCE_SLUG_PATTERN.test(data.slug)) return null
    try {
      return await getFreeResourceBySlug(data.slug)
    } catch (error) {
      throw toSafeError('freeResources.bySlug', 'Could not load the free resource.', error)
    }
  })

/**
 * The request form (pages/free.md). Anonymous by design; the hCaptcha token is verified on the
 * server before any write (inside requestFreeResource). The CSRF request middleware already limits
 * server fn calls to same-origin requests.
 */
export const requestFreeResourceFn = createServerFn({ method: 'POST' })
  .middleware([supabaseSession])
  .validator(FreeResourceRequestSchema)
  .handler(async ({ data, context }): Promise<FreeResourceRequestResult> => {
    try {
      const { status, result } = await requestFreeResource(data, {
        userId: context.claims?.sub,
        remoteIp: getRequestIP({ xForwardedFor: true }) ?? null,
        ensureVisitor: () =>
          ensureVisitor({
            getCookie,
            setCookie,
            userAgent: getRequestHeader('user-agent'),
            secure: !env.SITE_URL.startsWith('http://localhost'),
          }),
      })
      if (status !== 200) setResponseStatus(status)
      return result
    } catch (error) {
      console.error('[freeResources.request]', error instanceof Error ? error.message : error)
      setResponseStatus(500)
      return { ok: false, error: FREE_REQUEST_MESSAGES.generic }
    }
  })
