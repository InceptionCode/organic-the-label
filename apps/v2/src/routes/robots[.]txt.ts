import { createFileRoute } from '@tanstack/react-router'
import { buildRobotsTxt, isProductionEnv } from '~/server/seo/robots'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildRobotsTxt(isProductionEnv()), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }),
    },
  },
})
