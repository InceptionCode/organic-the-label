import Image from "next/image";
import { PLACEMENTS } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";

export function PlacementsGrid() {
  if (PLACEMENTS.length === 0) return null;

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-placements-title">
      <SectionHeading
        id="wwm-placements-title"
        eyebrow="Selected work"
        title="Major placements & credits"
      />

      <ul className="mt-7 grid gap-4 sm:grid-cols-2">
        {PLACEMENTS.map((placement) => {
          const inner = (
            <div className="card-base card-hover card-padding-sm flex items-center gap-4">
              <div
                className="relative shrink-0 overflow-hidden"
                style={{ width: "64px", height: "64px", borderRadius: "var(--radius-md)" }}
              >
                <Image
                  src={placement.artworkUrl}
                  alt={`${placement.track} cover art`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-h5 text-primary truncate">
                  {placement.artist} · {placement.track}
                </p>
                <p className="meta mt-0.5">{placement.role}</p>
              </div>
            </div>
          );

          return (
            <li key={`${placement.artist}-${placement.track}`}>
              {placement.href ? (
                <a
                  href={placement.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
