import { createFileRoute } from '@tanstack/react-router'
import { handlePurgeRequest } from '~/server/cache/purge'
import { invalidateTags, purgeAvailable } from '~/server/cache/vercel-purge'
import { env } from '~/server/env'

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
