import { PreviewTracklist } from '~/components/audio/preview-tracklist'
import type { AudioPreview } from '~/server/shopify/types'
import { cn } from '~/ui/cn'

/** Every preview of the product as one tracklist (single waveform for the current track). */
export function AudioPreviews({ previews, className }: { previews: AudioPreview[]; className?: string }) {
  if (previews.length === 0) return null
  return (
    <section aria-labelledby="audio-previews-heading" className={cn('scroll-mt-24', className)}>
      <PreviewTracklist previews={previews} headingId="audio-previews-heading" />
    </section>
  )
}
