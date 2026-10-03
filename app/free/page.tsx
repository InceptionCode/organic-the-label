import { Suspense } from "react";
import FreeResourceView from "./components/free-resource-view";
import { getCachedFeaturedFreeResource } from "@/lib/free-resources/get-free-resource";

export const metadata = {
  title: "Free Download – Organic Sonics",
  description: "Free sounds from Organic Sonics, delivered straight to your inbox.",
};

async function FeaturedFreeResource() {
  const resource = await getCachedFeaturedFreeResource();
  return <FreeResourceView resource={resource} />;
}

export default function FreePage() {
  return (
    <Suspense fallback={<div className="page-shell" style={{ minHeight: "100vh", background: "var(--bg-canvas)" }} />}>
      <FeaturedFreeResource />
    </Suspense>
  );
}
