import { keys } from '~/server/cache/keys'
import { redis } from '~/server/cache/redis'

/**
 * Drops the user's cached scores (saved preferences change them). Never throws: the save already
 * succeeded, and the entry expires by itself within 3 hours.
 */
export async function deleteAffinity(userId: string, store: { del(key: string): Promise<number> } | null = redis): Promise<void> {
  if (!store) return
  try {
    await store.del(keys.personalizationAffinity(userId))
  } catch (error) {
    console.error('[personalization] could not delete cached scores', error instanceof Error ? error.message : error)
  }
}
