import { createFileRoute } from '@tanstack/react-router'
import { handleFlushRequest } from '~/server/cache/flush'
import { redis } from '~/server/cache/redis'
import { invalidateTags, purgeAvailable } from '~/server/cache/vercel-purge'
import { env } from '~/server/env'

// Phase 08.0: signed post-deploy flush of every v2 Redis namespace and CDN tag family.
// Called by scripts/flush-caches.ts; see docs/internal-docs/ci-cd.md.
export const Route = createFileRoute('/api/cache/flush')({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleFlushRequest(request, {
          secret: env.CACHE_PURGE_SECRET,
          redis,
          available: purgeAvailable,
          invalidate: invalidateTags,
        }),
    },
  },
})
