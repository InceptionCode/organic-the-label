"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NextIntentLink({
  href,
  label = "Next →",
}: {
  href: string | null;
  label?: string;
}) {
  const router = useRouter();

  if (!href) return <span style={{ opacity: 0.5 }}>{label}</span>;

  const prefetch = () => router.prefetch(href);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
    >
      {label}
    </Link>
  );
}