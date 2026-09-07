import type { Metadata } from "next";
import { WorkWithMeClient } from "./work-with-me-client";

export const metadata: Metadata = {
  title: "Work With Me – Organic Sonics",
  description:
    "Work directly with JUICEMAN — custom production, beats, mixing and mastering, and collaboration for Hip-Hop, Trap, and R&B. Powered by Organic Sonics.",
};

export default function WorkWithMePage() {
  return <WorkWithMeClient />;
}
