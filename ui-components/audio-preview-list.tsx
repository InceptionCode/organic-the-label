"use client";

import type { ProductPreviewUrls } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { trackActivity } from "@/utils/helpers/activity/tracking";

export default function AudioPreviewList({
  previews,
  title,
}: {
  previews: ProductPreviewUrls;
  title?: string;
}) {
  if (!previews.length) return null;
  const gridCols = previews.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1';

  const handlePlay = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    trackActivity({
      eventType: "audio_preview_played",
      eventProperties: {
        audio_preview_name: e.currentTarget.title,
        source: "audio_preview_list" // for analytics purposes later - track the trigger of the audio preview played event
      },
    });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="text-2xl opacity-80">
        {title ? `${title} Previews` : "Previews"}
      </div>

      <div className={cn("grid gap-4", gridCols)}>
        {previews.map((preview, index) => (
          <div
            key={`${preview.preview_title}-${index}`}
            className="flex flex-col gap-4 align-baseline"
          >
            <div className="font-bold opacity-75 text-lg">
              Preview {preview.preview_title}
            </div>
            <audio controls preload="none" title={`${preview.preview_title} preview`} className="w-full" onPlay={handlePlay}>
              <source src={preview.preview_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        ))}
      </div>
    </div>
  );
}