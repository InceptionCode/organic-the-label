import type { FormPagePoint } from '~/components/forms/split-form-page'
import type { FreeResourcePublic } from '~/server/free-resources/get'

export const DEFAULT_INCLUDES = [
  'Drum one-shots (kicks, snares, hi-hats, percs)',
  'Melodic loops and one-shots',
  'Analog Lab bank and Minifreak V preset',
  'Royalty-free, cleared for commercial use',
]

export const INCLUDES_NOTE = 'Delivered instantly to your inbox via email. No account required.'

/** "What's inside" rows for SplitFormPage: the resource's includes, or the starter kit defaults. */
export function freeResourcePoints(includes: FreeResourcePublic['includes'] | undefined): FormPagePoint[] {
  if (!includes?.length) return DEFAULT_INCLUDES.map((body) => ({ body }))
  return includes.map((item) => (item.description ? { title: item.label, body: item.description } : { body: item.label }))
}
