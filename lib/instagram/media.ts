import { getInstagramToken } from "./token";

const TAG = "[instagram/media]";
const API_BASE = "https://graph.instagram.com";
const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}";
/** A few extra so filtering out media with no usable thumbnail still fills `limit`. */
const FETCH_WINDOW = 12;

export type IgMedia = {
  id: string;
  permalink: string;
  caption: string;
  timestamp: string;
  imageUrl: string | null;
  /** The post is a video/Reel (or a carousel whose lead slide is video). */
  isVideoPost: boolean;
  videoStreamable: boolean;
};

type RawChild = {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url?: string;
  thumbnail_url?: string;
};

type RawMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS" | "AD" | "STORY";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data?: RawChild[] };
};

/** The still frame to show before playback, whatever the media shape. */
function posterFor(m: RawMedia): string | null {
  if (m.media_type === "VIDEO") return m.thumbnail_url ?? null;
  if (m.media_type === "IMAGE") return m.media_url ?? m.thumbnail_url ?? null;
  // CAROUSEL_ALBUM: parent has no media_url — use the first child's frame.
  const first = m.children?.data?.[0];
  if (!first) return null;
  return first.media_type === "VIDEO"
    ? first.thumbnail_url ?? null
    : first.media_url ?? first.thumbnail_url ?? null;
}

/** This post is a video/Reel, or a carousel whose lead slide is a video. */
function isVideoPost(m: RawMedia): boolean {
  if (m.media_type === "VIDEO") return true;
  if (m.media_type === "CAROUSEL_ALBUM") return m.children?.data?.[0]?.media_type === "VIDEO";
  return false;
}

/** Whether we have a `media_url` we can stream on-page (Instagram omits it for Reels). */
function videoStreamable(m: RawMedia): boolean {
  if (m.media_type === "VIDEO") return Boolean(m.media_url);
  if (m.media_type === "CAROUSEL_ALBUM") {
    return m.children?.data?.[0]?.media_type === "VIDEO" && Boolean(m.children.data[0].media_url);
  }
  return false;
}

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

    const raw = json.data ?? [];
    const media = raw
      .map<IgMedia>((m) => ({
        id: m.id,
        permalink: m.permalink,
        caption: m.caption ?? "",
        timestamp: m.timestamp,
        imageUrl: posterFor(m),
        isVideoPost: isVideoPost(m),
        videoStreamable: videoStreamable(m),
      }))
      .filter((m) => m.permalink && m.imageUrl)
      .slice(0, limit);

    console.info(`${TAG} resolved media`, {
      count: media.length,
      streamable: media.filter((m) => m.videoStreamable).length,
      videoPosts: media.filter((m) => m.isVideoPost).length,
      types: raw.slice(0, limit).map((m) => m.media_product_type ?? m.media_type),
    });
    return media;
  } catch (err) {
    console.error(`${TAG} fetch threw`, err);
    return [];
  }
}

export async function getInstagramVideoUrl(mediaId: string): Promise<string | null> {
  const token = await getInstagramToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `${API_BASE}/${mediaId}?fields=media_type,media_url,children{media_type,media_url}&access_token=${token}`,
    );
    const json = (await res.json()) as RawMedia & { error?: { message: string } };
    if (!res.ok || json.error) {
      console.error(`${TAG} video-url lookup failed`, json.error?.message ?? `HTTP ${res.status}`);
      return null;
    }

    if (json.media_type === "VIDEO") return json.media_url ?? null;
    if (json.media_type === "CAROUSEL_ALBUM") {
      const first = json.children?.data?.[0];
      return first?.media_type === "VIDEO" ? first.media_url ?? null : null;
    }
    return null;
  } catch (err) {
    console.error(`${TAG} video-url lookup threw`, err);
    return null;
  }
}
