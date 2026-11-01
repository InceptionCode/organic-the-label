import { createFileRoute } from '@tanstack/react-router'
import { legacyRedirect } from '~/server/http/legacy-redirect'

// Phase 08.1: v1's composition download link. 308 to /compositions/download/$slug, query preserved.
export const Route = createFileRoute('/api/composition/download/$slug')({
  server: {
    handlers: {
      GET: ({ request, params }) => legacyRedirect('/compositions/download', request, params.slug),
    },
  },
})
