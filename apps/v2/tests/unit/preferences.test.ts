import { describe, expect, test } from 'bun:test'
import { DEFAULT_PREFERENCES, GENRE_OPTIONS, PRODUCT_TYPE_OPTIONS, PreferencesSchema } from '~/server/preferences/options'
import { getPreferences, updatePreferences } from '~/server/preferences/service'
import { fakeSupabase } from './fake-supabase'

describe('preference options', () => {
  test('come from the Store filters: tags without Free, categories without All', () => {
    expect(GENRE_OPTIONS.map((o) => o.label)).toContain('Hip-Hop')
    expect(GENRE_OPTIONS.some((o) => o.value === ('free' as string))).toBe(false)
    expect(PRODUCT_TYPE_OPTIONS.map((o) => o.value)).toEqual(['kit', 'pack', 'beat', 'merch', 'bank', 'suite', 'plugin'])
  })

  test('the schema dedupes and rejects values outside the lists', () => {
    const parsed = PreferencesSchema.parse({
      favoriteGenres: ['trap', 'trap', 'ambient'],
      favoriteProductTypes: ['kit'],
      marketingOptIn: true,
      personalizationOptIn: false,
    })
    expect(parsed.favoriteGenres).toEqual(['trap', 'ambient'])
    expect(PreferencesSchema.safeParse({ ...parsed, favoriteGenres: ['polka'] }).success).toBe(false)
    expect(PreferencesSchema.safeParse({ ...parsed, favoriteProductTypes: ['all'] }).success).toBe(false)
  })
})

describe('preferences service', () => {
  test('reads the caller row by user id and drops stored values that are no longer options', async () => {
    const { client, calls } = fakeSupabase(() => ({
      data: { favorite_genres: ['trap', 'polka'], favorite_product_types: ['kit'], marketing_opt_in: true, personalization_opt_in: null },
      error: null,
    }))
    const prefs = await getPreferences(client, 'u1')
    expect(calls[0]).toMatchObject({ table: 'user_preferences', op: 'select', filters: [['eq', 'user_id', 'u1']] })
    expect(prefs).toEqual({ favoriteGenres: ['trap'], favoriteProductTypes: ['kit'], marketingOptIn: true, personalizationOptIn: false })
  })

  test('a missing row reads as the defaults', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: null }))
    expect(await getPreferences(client, 'u1')).toEqual(DEFAULT_PREFERENCES)
  })

  test('update upserts the session user row and returns what was stored', async () => {
    const { client, calls } = fakeSupabase((call) => ({
      data: {
        favorite_genres: (call.payload as { favorite_genres: string[] }).favorite_genres,
        favorite_product_types: ['pack'],
        marketing_opt_in: false,
        personalization_opt_in: true,
      },
      error: null,
    }))
    const saved = await updatePreferences(client, 'u1', {
      favoriteGenres: ['rage'],
      favoriteProductTypes: ['pack'],
      marketingOptIn: false,
      personalizationOptIn: true,
    })
    expect(calls[0]).toMatchObject({ table: 'user_preferences', op: 'upsert' })
    expect(calls[0]!.payload).toEqual({
      user_id: 'u1',
      favorite_genres: ['rage'],
      favorite_product_types: ['pack'],
      marketing_opt_in: false,
      personalization_opt_in: true,
    })
    expect(saved.favoriteGenres).toEqual(['rage'])
  })

  test('errors throw', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: { message: 'denied' } }))
    await expect(getPreferences(client, 'u1')).rejects.toThrow('denied')
    await expect(updatePreferences(client, 'u1', DEFAULT_PREFERENCES)).rejects.toThrow('denied')
  })
})
