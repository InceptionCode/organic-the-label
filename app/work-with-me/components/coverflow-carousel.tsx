"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export type CoverflowSlide = {
  src: string;
  alt: string;
  title?: string;
  meta?: unknown;
};

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  onActivate?: (slide: CoverflowSlide, index: number) => void;
  rotate?: number;
  depth?: number;
  perspective?: number;
  falloff?: number;
  fade?: number;
  cardWidth?: string;
  gap?: number;
  loop?: boolean;
  label?: string;
  className?: string;
}

export function CoverflowCarousel({
  slides,
  onActivate,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(168px, 24vw, 300px)",
  gap = 0.06,
  loop = true,
  label = "Recent posts",
  className,
}: CoverflowCarouselProps) {
  const reduce = useReducedMotion();
  const count = slides.length;

  const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const posRef = React.useRef(0);
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
    captured: boolean;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);

  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((cardEl, index) => {
      if (!cardEl) return;
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      cardEl.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      cardEl.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      cardEl.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      if (reduce) {
        posRef.current = target;
        paint();
        rafRef.current = null;
        return;
      }
      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint, reduce],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  const DRAG_THRESHOLD = 6;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      captured: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    if (!drag.captured) {
      if (Math.abs(event.clientX - drag.x) < DRAG_THRESHOLD) return; // still a click
      drag.captured = true;
      drag.x = event.clientX; // re-anchor so the grab doesn't jump
      drag.pos = posRef.current;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* no-op */
      }
    }

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;
    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;
    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.captured) return; // was a tap — let the card's onClick run
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* no-op */
    }
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const cardEl = cardRefs.current[0];
      if (!cardEl) return;
      widthRef.current = cardEl.offsetWidth;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const active = slides[selected];

  return (
    <div
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          className="cursor-grab overflow-hidden py-10 outline-none active:cursor-grabbing"
          style={{ perspective: `calc(var(--cf-card) * ${perspective})`, touchAction: "pan-y" }}
        >
          <div
            className="relative select-none"
            style={{ height: "var(--cf-card)", transformStyle: "preserve-3d" }}
          >
            {slides.map((slide, index) => {
              const isCentre = index === selected;
              return (
                <button
                  key={index}
                  type="button"
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  aria-roledescription="slide"
                  aria-label={`${slide.title ?? slide.alt} — ${index + 1} of ${count}`}
                  data-centered={isCentre ? "true" : undefined}
                  onClick={() => (isCentre ? onActivate?.(slide, index) : goTo(index))}
                  className="absolute left-1/2 top-0 aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-2 shadow-lg-premium will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                  style={{ width: "var(--cf-card)", border: "1px solid rgba(224,61,42,0.16)" }}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    draggable={false}
                    sizes="(min-width: 768px) 24vw, 60vw"
                    className="pointer-events-none select-none object-cover"
                  />
                  {isCentre && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)" }}
                    >
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-full"
                        style={{ background: "var(--accent-primary)", boxShadow: "var(--shadow-glow)" }}
                      >
                        <Play className="h-6 w-6" style={{ color: "#fff", marginLeft: 3 }} />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Previous"
          onClick={() => nudge(-1)}
          className="absolute left-2 top-1/2 z-[200] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          style={{ borderColor: "rgba(224,61,42,0.22)", background: "var(--surface-1)" }}
        >
          <ChevronLeft className="h-5 w-5 text-secondary" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => nudge(1)}
          className="absolute right-2 top-1/2 z-[200] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          style={{ borderColor: "rgba(224,61,42,0.22)", background: "var(--surface-1)" }}
        >
          <ChevronRight className="h-5 w-5 text-secondary" />
        </button>
      </div>

      {active?.title && (
        <p
          key={selected}
          className="mx-auto mt-3 line-clamp-1 max-w-md px-6 text-center text-body-s text-secondary"
        >
          {active.title}
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to ${index + 1}`}
            aria-current={index === selected}
            onClick={() => goTo(index)}
            className="h-2 w-2 rounded-full transition-opacity"
            style={{
              background: "var(--accent-secondary)",
              opacity: index === selected ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
