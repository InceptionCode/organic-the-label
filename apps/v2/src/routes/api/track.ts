import { createFileRoute } from '@tanstack/react-router'
import { handleTrackRequest } from '~/server/activity/track-request'

// POST only, no component (phase 06.3). The client queue (lib/track.ts) beacons batches here. The
// global CSRF middleware runs first; the service repeats the same-origin check, drops bots with a
// 204, validates the batch, then attributes it to the signed-in user or a lazily created visitor.
export const Route = createFileRoute('/api/track')({
  server: {
    handlers: {
      POST: ({ request, context }) =>
        handleTrackRequest(request, {
          userId: context.claims?.sub ?? null,
          secureCookies: new URL(request.url).protocol === 'https:',
        }),
    },
  },
})
