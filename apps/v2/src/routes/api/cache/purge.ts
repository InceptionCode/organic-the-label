import { createFileRoute } from '@tanstack/react-router'
import { handlePurgeRequest } from '~/server/cache/purge'
import { invalidateTags, purgeAvailable } from '~/server/cache/vercel-purge'
import { env } from '~/server/env'

// POST only, no component (phase 07.8). apps/api signs the request after a webhook busts a Redis
// family; the handler verifies the HMAC and invalidates the matching Vercel CDN cache tags. src/start.ts
// exempts exactly this path from the same-origin CSRF check; cache-guard never lets /api be shared.
export const Route = createFileRoute('/api/cache/purge')({
  server: {
    handlers: {
      POST: ({ request }) =>
        handlePurgeRequest(request, {
          secret: env.CACHE_PURGE_SECRET,
          available: purgeAvailable,
          invalidate: invalidateTags,
        }),
    },
  },
})
