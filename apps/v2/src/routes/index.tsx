import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~/seo/head'

// Placeholder until the home page is built in phase 05.
export const Route = createFileRoute('/')({
  head: () =>
    seo({
      title: 'Premium Sounds for Modern Producers',
      description:
        'Premium beats, drum kits, sample packs, sound banks, and presets for modern producers. Instant downloads, new drops weekly, and free resources to start.',
      path: '/',
    }),
  component: () => <h1>Organic Sonics v2</h1>,
})
