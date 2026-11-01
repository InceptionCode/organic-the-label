import { createFileRoute } from '@tanstack/react-router'
import { handleFreeDownload } from '~/server/free-resources/download'

// GET only, no component (pages/free.md). The emailed /free/download/{id} link: 404 for a malformed,
// unknown, or inactive id; otherwise the first hit stamps downloaded_at and the response is a
// no-store, noindex 302 to the file. Legacy /api/resources/download/:id 308s here at cutover.
export const Route = createFileRoute('/free/download/$id')({
  server: {
    handlers: {
      GET: ({ params }) => handleFreeDownload(params.id),
    },
  },
})
