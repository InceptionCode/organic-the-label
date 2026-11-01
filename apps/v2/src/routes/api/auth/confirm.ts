import { createFileRoute } from '@tanstack/react-router'
import { legacyRedirect } from '~/server/http/legacy-redirect'

// Phase 08.1: v1's email confirmation path. Already-sent signup, magic link and recovery emails
// point here; 308 to /auth/confirm with token_hash, type and next preserved.
export const Route = createFileRoute('/api/auth/confirm')({
  server: {
    handlers: {
      GET: ({ request }) => legacyRedirect('/auth/confirm', request),
    },
  },
})
