"use client";

import { useRouter } from "next/navigation";

export default function HistoryBackButton({
  label = "← Back",
}: {
  label?: string;
}) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()}>
      {label}
    </button>
  );
}
