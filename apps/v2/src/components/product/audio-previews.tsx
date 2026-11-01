import { PreviewTracklist } from '~/components/audio/preview-tracklist'
import type { AudioPreview } from '~/server/shopify/types'
import { cn } from '~/ui/cn'

type AudioPreviewsProps = { previews: AudioPreview[]; handle: string; productId: string; className?: string }

/** Every preview of the product as one tracklist (single waveform for the current track). */
export function AudioPreviews({ previews, handle, productId, className }: AudioPreviewsProps) {
  if (previews.length === 0) return null
  return (
    <section aria-labelledby="audio-previews-heading" className={cn('scroll-mt-24', className)}>
      <PreviewTracklist previews={previews} headingId="audio-previews-heading" source={{ surface: 'product', handle, productId }} />
    </section>
  )
}
