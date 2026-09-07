import type { Metadata } from "next";
import { getWorkWithMeSpotify } from "@/lib/work-with-me/spotify-data";
import { getRecentPosts } from "@/lib/work-with-me/recent-posts-data";
import { WorkWithMeClient } from "./work-with-me-client";

export const metadata: Metadata = {
  title: "Work With Me – Organic Sonics",
  description:
    "Work directly with JUICEMAN — custom production, beats, mixing and mastering, and collaboration for Hip-Hop, Trap, and R&B. Powered by Organic Sonics.",
};

export default async function WorkWithMePage() {
  console.info("[work-with-me/page] rendering");
  const [spotify, recentPosts] = await Promise.all([getWorkWithMeSpotify(), getRecentPosts()]);

  return <WorkWithMeClient spotify={spotify} recentPosts={recentPosts} />;
}
