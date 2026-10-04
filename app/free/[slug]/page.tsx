import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FreeResourceView from "../components/free-resource-view";
import { getCachedFreeResource } from "@/lib/free-resources/get-free-resource";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getCachedFreeResource(slug);
  return {
    title: resource ? `${resource.name} – Organic Sonics` : "Free Download – Organic Sonics",
    description: resource?.description ?? "Free sounds from Organic Sonics, delivered straight to your inbox.",
  };
}

async function FreeResourceBySlug({ params }: Params) {
  const { slug } = await params;
  const resource = await getCachedFreeResource(slug);
  if (!resource) notFound();
  return <FreeResourceView resource={resource} />;
}

export default function FreeResourcePage({ params }: Params) {
  return (
    <Suspense fallback={<div className="page-shell" style={{ minHeight: "100vh", background: "var(--bg-canvas)" }} />}>
      <FreeResourceBySlug params={params} />
    </Suspense>
  );
}
