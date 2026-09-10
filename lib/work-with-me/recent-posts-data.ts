import { cacheLife } from "next/cache";
import { getLatestChannelVideos, type YouTubeVideo } from "@/lib/youtube/channel";
import { getLatestInstagramMedia } from "@/lib/instagram/media";
import { YOUTUBE_HANDLE } from "./content";

const TAG = "[work-with-me/recent-posts]";

export type InstagramPost = {
  id: string;
  url: string;
  caption: string;
  postedAt: string;
  imageUrl: string | null;
  /** The post is a video or Reel (whether or not we can stream it on-page). */
  isVideoPost: boolean;
  videoUrl: string | null;
};

export type RecentPostsData = {
  youtube: YouTubeVideo[];
  instagram: InstagramPost[];
};

export async function getRecentPosts(): Promise<RecentPostsData> {
  "use cache";
  cacheLife("hours");

  const [youtube, instagram] = await Promise.all([
    YOUTUBE_HANDLE ? getLatestChannelVideos(YOUTUBE_HANDLE, 6) : Promise.resolve([]),
    getInstagram(6),
  ]);

  console.info(`${TAG} loaded`, { youtube: youtube.length, instagram: instagram.length });
  return { youtube, instagram };
}

async function getInstagram(limit: number): Promise<InstagramPost[]> {
  const media = await getLatestInstagramMedia(limit);
  return media.map((m) => ({
    id: m.id,
    url: m.permalink,
    caption: m.caption,
    postedAt: m.timestamp,
    imageUrl: m.imageUrl,
    isVideoPost: m.isVideoPost,
    videoUrl: m.videoStreamable ? `/api/instagram/video/${encodeURIComponent(m.id)}` : null,
  }));
}
