import { createFileRoute } from '@tanstack/react-router'
import { legacyRedirect } from '~/server/http/legacy-redirect'

// Phase 08.1: v1's emailed free resource download link. 308 to /free/download/$id, query preserved.
export const Route = createFileRoute('/api/resources/download/$id')({
  server: {
    handlers: {
      GET: ({ request, params }) => legacyRedirect('/free/download', request, params.id),
    },
  },
})
