import { createFileRoute } from '@tanstack/react-router'
import { instagram, INSTAGRAM_MEDIA_ID } from '~/server/social/instagram'

// Streams an Instagram video through our origin (v1 app/api/instagram/video/[id]/route.ts).
// Instagram's CDN rejects cross-origin media requests, and media_url is a signed URL that expires
// within hours, so it is resolved fresh at playback time. Range is forwarded so the player seeks.

const PASS_THROUGH = ['content-length', 'content-range', 'etag', 'last-modified'] as const

function json(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
}

export const Route = createFileRoute('/api/instagram/video/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { id } = params
        if (!INSTAGRAM_MEDIA_ID.test(id)) return json(400, 'Invalid media id.')

        const videoUrl = await instagram.getVideoUrl(id)
        if (!videoUrl) return json(404, 'No video for this post.')

        const range = request.headers.get('range')
        let upstream: Response
        try {
          upstream = await fetch(videoUrl, { headers: range ? { Range: range } : undefined, redirect: 'follow' })
        } catch (error) {
          console.error('[api/instagram/video] upstream fetch threw', error instanceof Error ? error.message : error)
          return json(502, 'Video source unavailable.')
        }
        if (!upstream.ok || !upstream.body) {
          console.error('[api/instagram/video] upstream responded with HTTP', upstream.status)
          return json(502, 'Video source unavailable.')
        }

        const headers = new Headers({
          'Content-Type': upstream.headers.get('content-type') ?? 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, max-age=3600',
          'X-Robots-Tag': 'noindex',
        })
        for (const name of PASS_THROUGH) {
          const value = upstream.headers.get(name)
          if (value) headers.set(name, value)
        }
        return new Response(upstream.body, { status: upstream.status, headers })
      },
    },
  },
})
