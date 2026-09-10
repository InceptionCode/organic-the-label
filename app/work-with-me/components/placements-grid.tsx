"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  motion,
  LayoutGroup,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight, Music } from "lucide-react";
import type { EnrichedPlacement } from "@/lib/work-with-me/spotify-data";
import { SectionHeading } from "./section-heading";
import { MusoCredits } from "./muso-credits";

type PlacementsGridProps = {
  placements: EnrichedPlacement[];
};

const LAYOUT_SPRING = { type: "spring", stiffness: 120, damping: 22, mass: 0.9 } as const;
const keyOf = (p: EnrichedPlacement) => `${p.artist}-${p.track}`;

// ─────────────────────────────────────────────────────────────
// Card — cover art + role + title, with a pointer-tilt hover effect
// ─────────────────────────────────────────────────────────────

type CardProps = {
  placement: EnrichedPlacement;
  expanded: boolean;
  interactive: boolean;
  onToggle: () => void;
  gridRow?: number;
  gridColumn?: string;
};

function PlacementCard({ placement, expanded, interactive, onToggle, gridRow, gridColumn }: CardProps) {
  const reduce = useReducedMotion();
  const phase = useMemo(() => {
    const k = keyOf(placement);
    let h = 0;
    for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    return ((Math.abs(h) % 997) / 997) * Math.PI * 2;
  }, [placement]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 16 });
  const sy = useSpring(py, { stiffness: 140, damping: 16 });

  const idleRX = useMotionValue(0);
  const idleRY = useMotionValue(0);
  const idleIX = useMotionValue(0);
  const idleIY = useMotionValue(0);
  useAnimationFrame((t) => {
    if (reduce) return;
    const s = t / 1000;
    idleRX.set(Math.sin(s * 0.42 + phase) * 1.4);
    idleRY.set(Math.cos(s * 0.35 + phase * 1.3) * 1.6);
    idleIX.set(Math.sin(s * 0.3 + phase) * 5);
    idleIY.set(Math.cos(s * 0.26 + phase * 1.3) * 5);
  });

  // Pointer + idle, combined.
  const rotateX = useTransform([sy, idleRX], ([p, i]) => -5 * (p as number) + (i as number));
  const rotateY = useTransform([sx, idleRY], ([p, i]) => 5 * (p as number) + (i as number));
  const imgX = useTransform([sx, idleIX], ([p, i]) => 10 * (p as number) + (i as number));
  const imgY = useTransform([sy, idleIY], ([p, i]) => 10 * (p as number) + (i as number));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const resetTilt = () => {
    px.set(0);
    py.set(0);
  };

  const inner = (
    <motion.div
      layout="position"
      className="relative h-full w-full overflow-hidden rounded-[var(--radius-lg)]"
      style={{
        rotateX: reduce ? 0 : rotateX,
        rotateY: reduce ? 0 : rotateY,
        transformPerspective: 1000,
        border: "1px solid rgba(224,61,42,0.16)",
      }}
    >
      {placement.artworkUrl ? (
        <motion.div className="absolute inset-[-6%]" style={{ x: reduce ? 0 : imgX, y: reduce ? 0 : imgY }}>
          <Image
            src={placement.artworkUrl}
            alt={`${placement.artist} — ${placement.track}`}
            fill
            sizes="(min-width: 640px) 46vw, 92vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        </motion.div>
      ) : (
        <span className="flex h-full w-full items-center justify-center" style={{ background: "#000000" }}>
          <Music className="h-10 w-10" style={{ color: "rgba(212,196,168,0.45)" }} aria-hidden />
        </span>
      )}

      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(224,61,42,0.82) 0%, rgba(20,8,7,0.35) 46%, transparent 80%)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-[var(--radius-lg)] transition-shadow duration-500 group-hover:[box-shadow:var(--shadow-glow)]"
      />

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
        <span
          className="w-fit rounded-full px-2 py-0.5 text-caption uppercase"
          style={{ background: "rgba(0,0,0,0.4)", color: "#F8F7F2", letterSpacing: "0.08em" }}
        >
          {placement.role}
        </span>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: expanded ? "clamp(1.75rem, 3.5vw, 2.5rem)" : "1.35rem",
            letterSpacing: "0.02em",
            lineHeight: 1.05,
            color: "#FFFFFF",
          }}
        >
          {placement.artist} · {placement.track}
        </span>
      </span>
    </motion.div>
  );

  return (
    <motion.div
      layout
      layoutId={`placement-${keyOf(placement)}`}
      transition={{ layout: reduce ? { duration: 0 } : LAYOUT_SPRING }}
      style={gridRow ? { gridRow, gridColumn } : undefined}
      className={`wwm-tile group relative ${expanded ? "z-20" : "z-10"} ${interactive ? "min-h-[170px]" : "min-h-[240px]"}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${placement.artist} — ${placement.track}. ${expanded ? "Collapse" : "Expand"}`}
          className="block h-full w-full rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]"
        >
          {inner}
        </button>
      ) : placement.href ? (
        <a
          href={placement.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full w-full rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
        >
          {inner}
        </a>
      ) : (
        inner
      )}

      {placement.href && (
        <a
          href={placement.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open ${placement.track} on Spotify`}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────

export function PlacementsGrid({ placements }: PlacementsGridProps) {
  const shown = placements.slice(0, 3);
  const interactive = shown.length === 3;

  const ids = shown.map(keyOf);
  const [layout, setLayout] = useState(() => ({
    row1: ids.slice(0, 2),
    row2: ids.slice(2, 3),
  }));

  const reset = () => setLayout({ row1: ids.slice(0, 2), row2: ids.slice(2, 3) });

  const handleExpand = (id: string) => {
    const inRow1 = layout.row1.includes(id);
    const rowArr = inRow1 ? layout.row1 : layout.row2;

    if (rowArr.length === 1 && rowArr[0] === id) {
      reset();
      return;
    }

    const neighbor = rowArr.find((i) => i !== id);
    if (inRow1) {
      setLayout({
        row1: [id],
        row2: neighbor ? [neighbor, ...layout.row2.filter((i) => i !== neighbor)] : layout.row2,
      });
    } else {
      setLayout({
        row1: neighbor ? [neighbor, ...layout.row1.filter((i) => i !== neighbor)] : layout.row1,
        row2: [id],
      });
    }
  };

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-placements-title">
      <SectionHeading
        id="wwm-placements-title"
        eyebrow="Selected work"
        title="Placements & credits"
        description={
          shown.length > 0
            ? "Tap a record to open it up — then the full verified discography."
            : "The full verified discography, straight from Muso.ai."
        }
      />

      {shown.length > 0 && (
        <div className="mt-8">
          {interactive ? (
            <LayoutGroup id="wwm-placements">
              <motion.div
                layout
                className="grid grid-cols-2 grid-rows-2 gap-4 h-[380px] sm:h-[520px]"
              >
                {shown.map((p) => {
                  const id = keyOf(p);
                  const inRow1 = layout.row1.includes(id);
                  const rowArr = inRow1 ? layout.row1 : layout.row2;
                  const expanded = rowArr.length === 1 && rowArr[0] === id;
                  const gridRow = inRow1 ? 1 : 2;
                  const gridColumn = expanded
                    ? "1 / span 2"
                    : String(Math.max(0, rowArr.indexOf(id)) + 1);

                  return (
                    <PlacementCard
                      key={id}
                      placement={p}
                      interactive
                      expanded={expanded}
                      onToggle={() => handleExpand(id)}
                      gridRow={gridRow}
                      gridColumn={gridColumn}
                    />
                  );
                })}
              </motion.div>
            </LayoutGroup>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shown.map((p) => (
                <PlacementCard
                  key={keyOf(p)}
                  placement={p}
                  interactive={false}
                  expanded={false}
                  onToggle={() => { }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className={shown.length > 0 ? "mt-10" : "mt-8"}>
        {shown.length > 0 && (
          <p className="eyebrow mb-3" style={{ color: "var(--accent-secondary)" }}>
            Full discography
          </p>
        )}
        <MusoCredits />
      </div>
    </section>
  );
}
