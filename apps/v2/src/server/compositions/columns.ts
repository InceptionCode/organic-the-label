import type { CompositionListItem } from '@organic/content-schema'

/** Public listing columns (pages/compositions.md). Never the download file URLs. */
export const COMPOSITION_LIST_COLUMNS =
  'id, slug, title, description, bpm, musical_key, tags, platform, embed_url, posted_at, preview_url, audio_file_url'

export type { CompositionListItem }
