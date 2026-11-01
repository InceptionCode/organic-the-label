import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getRecentCompositions } from '~/server/compositions/recent'
import { listFreeResources } from '~/server/free-resources/list'
import { toSafeError } from './errors'

// Read-only adapters for the anonymous /explore default (pages/explore.md, SEO section).

export const getRecentCompositionsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ limit: z.number().int().min(1).max(24) }))
  .handler(async ({ data }) => {
    try {
      return await getRecentCompositions(data.limit)
    } catch (error) {
      throw toSafeError('compositions.recent', 'Could not load loops.', error)
    }
  })

export const listFreeResourcesFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await listFreeResources()
  } catch (error) {
    throw toSafeError('freeResources.list', 'Could not load free resources.', error)
  }
})
