import { cacheLife } from "next/cache";
import { getCompositions } from "@/lib/composition/get-compositions";
import { getLatestChannelVideos, type YouTubeVideo } from "@/lib/youtube/channel";
import { instagramEmbedSrc } from "@/lib/composition/embed-url";
import { YOUTUBE_HANDLE } from "./content";

const TAG = "[work-with-me/recent-posts]";

export type InstagramPost = {
  id: string;
  url: string;
  caption: string;
  postedAt: string;
};

export type RecentPostsData = {
  youtube: YouTubeVideo[];
  instagram: InstagramPost[];
};

/**
 * Auto-pulled "recent posts" for the Work With Me page:
 *   • YouTube — latest uploads via the YouTube Data API
 *   • Instagram — newest instagram rows already in the /compositions table,
 *     reusing that feature's embed URLs and (proven) iframe rendering path.
 */
export async function getRecentPosts(): Promise<RecentPostsData> {
  "use cache";
  cacheLife("hours");

  const [youtube, instagram] = await Promise.all([
    YOUTUBE_HANDLE ? getLatestChannelVideos(YOUTUBE_HANDLE, 6) : Promise.resolve([]),
    getInstagramFromCompositions(6),
  ]);

  console.info(`${TAG} loaded`, { youtube: youtube.length, instagram: instagram.length });
  return { youtube, instagram };
}

async function getInstagramFromCompositions(limit: number): Promise<InstagramPost[]> {
  console.info(`${TAG} pulling instagram from compositions`);
  const { compositions, error } = await getCompositions(
    { range: "all", sort: "newest", search: undefined, tags: undefined },
    30,
  );

  if (error) {
    console.warn(`${TAG} compositions fetch error`, error);
    return [];
  }

  return compositions
    .filter((row) => row.platform === "instagram" && instagramEmbedSrc(row.embed_url))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      url: row.embed_url,
      caption: row.title,
      postedAt: row.posted_at,
    }));
}
