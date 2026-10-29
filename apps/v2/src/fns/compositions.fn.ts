import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { COMPOSITION_RANGES, COMPOSITION_SEARCH_MAX, COMPOSITION_TAGS } from '~/lib/composition-search'
import { listCompositions } from '~/server/compositions/list'
import { toSafeError } from './errors'

const listInputSchema = z.object({
  search: z.string().trim().min(1).max(COMPOSITION_SEARCH_MAX).optional(),
  range: z.enum(COMPOSITION_RANGES).optional(),
  sort: z.literal('oldest').optional(),
  tags: z.array(z.enum(COMPOSITION_TAGS)).max(COMPOSITION_TAGS.length).optional(),
})

/** Public read: the /compositions list (pages/compositions.md). */
export const getCompositionsFn = createServerFn({ method: 'GET' })
  .validator(listInputSchema)
  .handler(async ({ data }) => {
    try {
      return await listCompositions(data)
    } catch (error) {
      throw toSafeError('compositions.list', 'Could not load loops.', error)
    }
  })
