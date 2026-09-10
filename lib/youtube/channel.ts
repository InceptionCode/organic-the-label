/**
 * Read-only YouTube Data API v3 access for the Work With Me page — pulls the
 * latest uploads from a channel by @handle. Uses an API key (no OAuth). Every
 * failure path returns an empty list so the section simply hides.
 */

const TAG = "[youtube/channel]";
const API_BASE = "https://www.googleapis.com/youtube/v3";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  url: string;
};

function apiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.warn(`${TAG} missing YOUTUBE_API_KEY`);
    return null;
  }
  return key;
}

async function ytGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`${TAG} GET ${path.split("&key=")[0]} failed`, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`${TAG} GET threw`, err);
    return null;
  }
}

export async function getLatestChannelVideos(
  handle: string,
  max = 6,
): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key || !handle) return [];

  console.info(`${TAG} resolving channel`, { handle });
  const channel = await ytGet<{
    items: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
  }>(`/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${key}`);

  const uploads = channel?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    console.warn(`${TAG} no uploads playlist for handle`, { handle });
    return [];
  }

  console.info(`${TAG} fetching uploads`, { uploads, max });
  const playlist = await ytGet<{
    items: {
      snippet: {
        title: string;
        publishedAt: string;
        resourceId: { videoId: string };
        thumbnails: Record<string, { url: string; width: number }>;
      };
    }[];
  }>(`/playlistItems?part=snippet&playlistId=${uploads}&maxResults=${max}&key=${key}`);

  if (!playlist?.items) return [];

  const videos = playlist.items
    .filter((item) => item.snippet?.resourceId?.videoId)
    .map((item) => {
      const thumbs = item.snippet.thumbnails ?? {};
      const best =
        Object.values(thumbs).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;
      return {
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnailUrl: best,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      };
    });

  console.info(`${TAG} resolved videos`, { count: videos.length });
  return videos;
}
