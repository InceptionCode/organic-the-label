'use client';

import { useState, type UIEvent } from 'react';
import type { ProductPreviewUrls } from '@/lib/schemas';
import { AudioPlayer } from '@/ui-components/audio-player';
import { useTrackingReady } from '@/store/activity-hydrator';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { cn } from '@/lib/utils';

/** Rows shown before the list scrolls. */
const VISIBLE_ROWS = 5;
/**
 * Height of VISIBLE_ROWS players: each row is a 2rem button + 1.25rem padding
 * + 2px border (see AudioPlayer), separated by the 0.5rem gap.
 */
const LIST_MAX_HEIGHT = `calc(${VISIBLE_ROWS} * (3.25rem + 2px) + ${VISIBLE_ROWS - 1} * 0.5rem)`;
/** Soft edges where rows continue: top once scrolled, bottom until the end. */
function fadeMask(fadeTop: boolean, fadeBottom: boolean): string | undefined {
  if (!fadeTop && !fadeBottom) return undefined;
  const top = fadeTop ? 'transparent, #000 1.5rem' : '#000';
  const bottom = fadeBottom ? '#000 calc(100% - 3rem), transparent' : '#000';
  return `linear-gradient(to bottom, ${top}, ${bottom})`;
}

export default function AudioPreviewList({
  previews,
  title,
}: {
  previews: ProductPreviewUrls;
  title?: string;
}) {
  const isTrackingReady = useTrackingReady();
  const [scrollEdges, setScrollEdges] = useState({ atStart: true, atEnd: false });

  if (!previews.length) return null;

  const scrolls = previews.length > VISIBLE_ROWS;

  const makeOnPlay = (previewTitle: string) => () => {
    if (isTrackingReady) {
      trackActivity({
        eventType: 'audio_preview_played',
        eventProperties: {
          audio_preview_name: previewTitle,
          source: 'audio_preview_list',
        },
      });
    }
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    setScrollEdges({
      atStart: el.scrollTop <= 4,
      atEnd: el.scrollTop + el.clientHeight >= el.scrollHeight - 4,
    });
  };

  return (
    <div className="space-y-3 w-full">
      {title && (
        <p
          className="eyebrow"
          style={{ color: 'var(--accent-secondary)', letterSpacing: '0.12em' }}
        >
          {title} previews
        </p>
      )}
      {/* The focus ring sits on this wrapper: the list's fade mask would clip it. */}
      <div
        className={cn(
          scrolls &&
            'rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--accent-primary)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[color:var(--bg-canvas)]',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-2',
            scrolls &&
              'overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] focus-visible:outline-none',
          )}
          style={
            scrolls
              ? {
                  maxHeight: LIST_MAX_HEIGHT,
                  maskImage: fadeMask(!scrollEdges.atStart, !scrollEdges.atEnd),
                  WebkitMaskImage: fadeMask(!scrollEdges.atStart, !scrollEdges.atEnd),
                }
              : undefined
          }
          onScroll={scrolls ? handleScroll : undefined}
          tabIndex={scrolls ? 0 : undefined}
          role={scrolls ? 'region' : undefined}
          aria-label={scrolls ? `${previews.length} audio previews, scrollable` : undefined}
        >
          {previews.map((preview, index) => (
            <AudioPlayer
              key={`${preview.preview_title}-${index}`}
              src={preview.preview_url}
              title={preview.preview_title}
              onPlay={makeOnPlay(preview.preview_title)}
              className="shrink-0"
            />
          ))}
        </div>
      </div>
      {scrolls && (
        <p className="text-caption text-muted">
          {previews.length} previews. Scroll the list to hear the rest.
        </p>
      )}
    </div>
  );
}
