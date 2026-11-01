import type { FreeResourcePublic } from '~/server/free-resources/get'

export const DEFAULT_HEADLINE = 'FREE STARTER KIT'
export const DEFAULT_DESCRIPTION =
  'A curated pack of drum hits, loops, and textures, at zero cost and zero strings. Drop your email and the link is yours.'

/** Headline and intro for SplitFormPage (`null` is the default starter kit copy). */
export function freeResourceHeadline(resource: FreeResourcePublic | null) {
  return resource?.name ? resource.name.toUpperCase() : DEFAULT_HEADLINE
}

export function freeResourceIntro(resource: FreeResourcePublic | null) {
  return resource?.description || DEFAULT_DESCRIPTION
}
