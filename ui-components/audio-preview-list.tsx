"use client";

import type { ProductPreviewUrls } from "@/lib/schemas";
import { AudioPlayer } from "@/ui-components/audio-player";
import { useTrackingReady } from "@/store/activity-hydrator";
import { trackActivity } from "@/utils/helpers/activity/tracking";

export default function AudioPreviewList({
  previews,
  title,
}: {
  previews: ProductPreviewUrls;
  title?: string;
}) {
  const isTrackingReady = useTrackingReady();

  if (!previews.length) return null;

  const makeOnPlay = (previewTitle: string) => () => {
    if (isTrackingReady) {
      trackActivity({
        eventType: "audio_preview_played",
        eventProperties: {
          audio_preview_name: previewTitle,
          source: "audio_preview_list",
        },
      });
    }
  };

  return (
    <div className="space-y-3 w-full">
      {title && (
        <p
          className="eyebrow"
          style={{ color: "var(--accent-secondary)", letterSpacing: "0.12em" }}
        >
          {title} — Previews
        </p>
      )}
      <div className="flex flex-col gap-2">
        {previews.map((preview, index) => (
          <AudioPlayer
            key={`${preview.preview_title}-${index}`}
            src={preview.preview_url}
            title={preview.preview_title}
            onPlay={makeOnPlay(preview.preview_title)}
          />
        ))}
      </div>
    </div>
  );
}
