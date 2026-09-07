import Image from "next/image";
import { PLACEMENTS } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";
import { MusoCredits } from "./muso-credits";

export function PlacementsGrid() {
  const highlights = PLACEMENTS;

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-placements-title">
      <SectionHeading
        id="wwm-placements-title"
        eyebrow="Selected work"
        title="Placements & credits"
        description={
          highlights.length > 0
            ? "Standout records, then the full verified discography."
            : "The full verified discography, straight from Muso.ai."
        }
      />

      {highlights.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((p, i) => {
            const featured = i === 0;
            return (
              <li
                key={`${p.artist}-${p.track}`}
                className={featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : undefined}
              >
                <a
                  href={p.href ?? undefined}
                  target={p.href ? "_blank" : undefined}
                  rel={p.href ? "noopener noreferrer" : undefined}
                  className="wwm-tile group relative block h-full overflow-hidden"
                >
                  <span
                    className="relative block w-full overflow-hidden"
                    style={{ aspectRatio: featured ? "1 / 1" : "4 / 3" }}
                  >
                    <Image
                      src={p.artworkUrl}
                      alt={`${p.artist} — ${p.track}`}
                      fill
                      sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                      className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.06]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(224,61,42,0.82) 0%, rgba(20,8,7,0.35) 45%, transparent 78%)",
                      }}
                    />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                    <span
                      className="w-fit rounded-full px-2 py-0.5 text-caption uppercase"
                      style={{ background: "rgba(0,0,0,0.35)", color: "#F8F7F2", letterSpacing: "0.08em" }}
                    >
                      {p.role}
                    </span>
                    <span
                      className="text-primary"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: featured ? "1.75rem" : "1.35rem",
                        letterSpacing: "0.02em",
                        lineHeight: 1.05,
                        color: "#FFFFFF",
                      }}
                    >
                      {p.artist} · {p.track}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <div className={highlights.length > 0 ? "mt-10" : "mt-8"}>
        {highlights.length > 0 && (
          <p className="eyebrow mb-3" style={{ color: "var(--accent-secondary)" }}>
            Full discography
          </p>
        )}
        <MusoCredits />
      </div>
    </section>
  );
}
