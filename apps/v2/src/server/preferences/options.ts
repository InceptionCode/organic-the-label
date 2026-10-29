import { z } from 'zod'
import { CATEGORY_OPTIONS, TAG_OPTIONS, type StoreCategory, type StoreTag } from '~/lib/store-search'

// Fixed option lists for user_preferences (phase 06.6), derived from the Store's own filters so a
// saved preference always names something the catalog can be filtered by. Genres are the Store tag
// labels without "Free" (a price, not a sound); product types are the Store categories without "All".
// Zod only, no server imports: the account form imports this for its options and client checks.

export type GenreValue = Exclude<StoreTag, 'free'>
export type ProductTypeValue = StoreCategory

export const GENRE_OPTIONS = TAG_OPTIONS.filter((o): o is { value: GenreValue; label: string } => o.value !== 'free')
export const PRODUCT_TYPE_OPTIONS = CATEGORY_OPTIONS.filter(
  (o): o is { value: ProductTypeValue; label: string } => o.value !== 'all',
)

const GENRE_VALUES = GENRE_OPTIONS.map((o) => o.value) as [GenreValue, ...GenreValue[]]
const PRODUCT_TYPE_VALUES = PRODUCT_TYPE_OPTIONS.map((o) => o.value) as [ProductTypeValue, ...ProductTypeValue[]]

export const PREFERENCES_MESSAGES = {
  invalid: 'Some choices are not available anymore. Reload the page and try again.',
  generic: 'Could not save your preferences. Try again.',
  saved: 'Preferences saved.',
  savedSubscribed: "Preferences saved. You're on the newsletter.",
  savedNewsletterFailed: 'Preferences saved, but the newsletter signup did not go through. Try again from the',
  savedNewsletterFailedLink: 'newsletter page',
  savedUnverified: 'Preferences saved. Confirm your email to join the newsletter.',
  savedUnsubscribed: "Preferences saved. You're unsubscribed from the newsletter.",
  savedUnsubscribeFailed: "Preferences saved, but we couldn't unsubscribe you. Try again, or use the unsubscribe link in any email.",
  newsletterHelp: 'Newsletter emails about new drops and offers. Uncheck to unsubscribe.',
  newsletterUnverified: 'Confirm your email to manage newsletter emails.',
} as const

const unique = <T>(values: T[]) => [...new Set(values)]

export const PreferencesSchema = z.object({
  favoriteGenres: z.array(z.enum(GENRE_VALUES)).max(GENRE_VALUES.length * 2).transform(unique),
  favoriteProductTypes: z.array(z.enum(PRODUCT_TYPE_VALUES)).max(PRODUCT_TYPE_VALUES.length * 2).transform(unique),
  marketingOptIn: z.boolean(),
  personalizationOptIn: z.boolean(),
})

export type PreferencesInput = z.input<typeof PreferencesSchema>
export type Preferences = z.output<typeof PreferencesSchema>

export const DEFAULT_PREFERENCES: Preferences = {
  favoriteGenres: [],
  favoriteProductTypes: [],
  marketingOptIn: false,
  personalizationOptIn: false,
}

/** Stored values that are no longer options (a Store filter was renamed or removed) are dropped. */
export function knownGenres(values: readonly string[] | null | undefined): GenreValue[] {
  return unique((values ?? []).filter((v): v is GenreValue => (GENRE_VALUES as string[]).includes(v)))
}

export function knownProductTypes(values: readonly string[] | null | undefined): ProductTypeValue[] {
  return unique((values ?? []).filter((v): v is ProductTypeValue => (PRODUCT_TYPE_VALUES as string[]).includes(v)))
}
