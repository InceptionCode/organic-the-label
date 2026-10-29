import { createFileRoute } from '@tanstack/react-router'
import { handleCompositionDownload } from '~/server/compositions/download'

// GET only, no component (pages/compositions.md). Free loops: the service 404s unknown or inactive
// slugs, creates the visitor lazily, logs the download, then 302s to the bundle or streams a zip.
// Every response is private, no-store, and noindex; robots.txt disallows /compositions/download/.
export const Route = createFileRoute('/compositions/download/$slug')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleCompositionDownload(request, params.slug, {
          secureCookies: new URL(request.url).protocol === 'https:',
        }),
    },
  },
})
