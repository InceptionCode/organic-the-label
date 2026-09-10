import { getInstagramToken } from "./token";

const TAG = "[instagram/media]";
const API_BASE = "https://graph.instagram.com";
const MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
/** A few extra so filtering out media with no usable thumbnail still fills `limit`. */
const FETCH_WINDOW = 12;

export type IgMedia = {
  id: string;
  permalink: string;
  caption: string;
  timestamp: string;
  imageUrl: string | null;
  videoUrl: string | null;
};

type RawMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

export async function getLatestInstagramMedia(limit = 6): Promise<IgMedia[]> {
  const token = await getInstagramToken();
  if (!token) {
    console.warn(`${TAG} no access token`);
    return [];
  }

  const userId = process.env.INSTAGRAM_USER_ID || "me";
  console.info(`${TAG} fetching media`, { userId, window: FETCH_WINDOW, want: limit });

  try {
    const res = await fetch(
      `${API_BASE}/${userId}/media?fields=${MEDIA_FIELDS}&limit=${FETCH_WINDOW}&access_token=${token}`,
    );

    const json = (await res.json()) as {
      data?: RawMedia[];
      error?: { message: string; code?: number };
    };

    if (!res.ok || json.error) {
      const msg = json.error?.message ?? `HTTP ${res.status}`;
      console.error(`${TAG} request failed`, msg);
      if (/expire|invalid|OAuth|session/i.test(msg)) {
        console.error(`${TAG} the access token looks expired or invalid — refresh it`);
      }
      return [];
    }

    const media = (json.data ?? [])
      .map<IgMedia>((m) => ({
        id: m.id,
        permalink: m.permalink,
        caption: m.caption ?? "",
        timestamp: m.timestamp,
        imageUrl:
          m.media_type === "VIDEO"
            ? m.thumbnail_url ?? null
            : m.media_url ?? m.thumbnail_url ?? null,
        videoUrl: m.media_type === "VIDEO" ? m.media_url ?? null : null,
      }))
      .filter((m) => m.permalink && m.imageUrl)
      .slice(0, limit);

    console.info(`${TAG} resolved media`, {
      count: media.length,
      playableInline: media.filter((m) => m.videoUrl).length,
    });
    return media;
  } catch (err) {
    console.error(`${TAG} fetch threw`, err);
    return [];
  }
}
