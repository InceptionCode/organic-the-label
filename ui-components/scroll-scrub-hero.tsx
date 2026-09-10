"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-scrubbed frame-sequence hero. Wheel / trackpad / touch / arrow keys
 * scrub a preloaded WebP sequence (real footage of the studio); one deliberate
 * scroll past the last frame calls `onEnter`. Rendered inside `SessionSplash`'s
 * fixed overlay — the page is scroll-locked by that wrapper, so this component
 * owns all wheel/touch input while mounted.
 *
 * The footage is graded purple; the brand treatment (red soft-light glow +
 * vignette + grain) is composited as DOM layers over the canvas, not baked into
 * the pixels. Idiom (canvas + manual RAF + DPR cap + ResizeObserver + full
 * teardown) mirrors app/work-with-me/components/particle-portrait.tsx.
 */

const FRAME_COUNT = 153;
const DEFAULT_FRAME_PATH = (i: number) =>
  `/organic-sonics-hero/assets/hero/frame_${String(i).padStart(4, "0")}.webp`;

// Tight, responsive scrub: the frame tracks the scroll directly and STOPS when
// you stop. A little easing removes input noise; the per-tick cap stops a big
// fling from whip-panning.
const EASE = 0.2;
const MAX_STEP = 0.05; // max progress advance per frame (~7-8 frames)
const COMMIT_MARGIN = 0.16; // scroll this far past 1.0 to enter
const WHEEL_SENS = 1 / 2800;
const WHEEL_CLAMP = 50; // tame big trackpad flings
const TOUCH_SENS = 1 / 640;
const KEY_STEP = 0.05;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Beat = { start: number; end: number; mark: boolean; h1?: string; p?: string };

const BEATS: Beat[] = [
  { start: 0.0, end: 0.12, mark: false, h1: "The studio opens" },
  { start: 0.36, end: 0.56, mark: false, p: "Every session starts with one sound." },
  {
    start: 0.8,
    end: 1.0,
    mark: true,
    h1: "Organic Sonics",
    p: "Elevate your sound. Express what's real.",
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Non-production hook so screenshots / tests can drive progress without rAF. */
type ScrubHeroEl = HTMLDivElement & { __scrub?: (progress: number) => void };

export interface ScrollScrubHeroProps {
  onEnter: () => void;
  frameCount?: number;
  framePath?: (i: number) => string;
  className?: string;
}

export function ScrollScrubHero({
  onEnter,
  frameCount = FRAME_COUNT,
  framePath = DEFAULT_FRAME_PATH,
  className,
}: ScrollScrubHeroProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const onEnterRef = React.useRef(onEnter);
  onEnterRef.current = onEnter;

  const [loadedPct, setLoadedPct] = React.useState(0);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom / unsupported

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;
    let lastIdx = -1; // frame index currently on the canvas, or -1 if none
    let entered = false;
    let killed = false; // set on teardown — guards pending async image decodes
    let target = 0;
    let progress = 0;
    let loaded = 0;

    const images: HTMLImageElement[] = [];
    const ready: boolean[] = []; // frame i is loaded AND decoded (safe for drawImage)

    // Nearest decoded frame at or below `idx`, or -1 while nothing is ready.
    function readyIdxAtOrBelow(idx: number): number {
      for (let i = idx; i >= 0; i--) {
        if (ready[i]) return i;
      }
      return -1;
    }

    function drawCover(img: HTMLImageElement) {
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = W / H;
      let dw: number;
      let dh: number;
      let dx: number;
      let dy: number;
      if (ir > cr) {
        dh = H;
        dw = H * ir;
        dx = (W - dw) / 2;
        dy = 0;
      } else {
        dw = W;
        dh = W / ir;
        dx = 0;
        dy = (H - dh) / 2;
      }
      ctx!.drawImage(img, dx, dy, dw, dh);
    }

    const beatEls = Array.from(wrap.querySelectorAll<HTMLElement>("[data-beat]"));
    const scrollHint = wrap.querySelector<HTMLElement>('[data-hint="scroll"]');
    const enterHint = wrap.querySelector<HTMLElement>('[data-hint="enter"]');

    function paint(p: number) {
      const idx = Math.round(clamp(p, 0, 1) * (frameCount - 1));
      // Redraw only when the frame changes, or while nothing is on the canvas
      // yet (so frame 0 appears the instant it decodes, no scroll).
      if (idx !== lastIdx || lastIdx < 0) {
        const li = readyIdxAtOrBelow(idx);
        if (li >= 0 && W > 0 && H > 0) {
          ctx!.fillStyle = "#171717";
          ctx!.fillRect(0, 0, W, H);
          drawCover(images[li]);
          lastIdx = idx;
        } else if (W > 0 && H > 0) {
          ctx!.fillStyle = "#171717";
          ctx!.fillRect(0, 0, W, H);
        }
      }
      for (const el of beatEls) {
        const s = Number(el.dataset.start);
        const e = Number(el.dataset.end);
        const isMark = el.dataset.mark === "1";
        const fade = (e - s) * 0.18 || 0.02;
        let op = 0;
        if (p >= s - fade && p <= e + fade) {
          if (p < s + fade) op = (p - s) / fade;
          else if (!isMark && p > e - fade) op = (e - p) / fade;
          else op = 1;
        }
        if (isMark && p >= e - fade) op = Math.min(1, (p - s) / fade);
        el.style.opacity = String(clamp(op, 0, 1));
      }
      if (scrollHint) scrollHint.style.opacity = String(clamp(1 - p / 0.14, 0, 1));
      if (enterHint) enterHint.style.opacity = String(clamp((p - 0.86) / 0.1, 0, 1));
      wrap!.dataset.progress = p.toFixed(3);
    }

    function resize() {
      W = wrap!.clientWidth;
      H = wrap!.clientHeight;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastIdx = -1;
      paint(progress);
    }

    // ── preload the sequence, in order (frame 0 first) ──
    // Decode each frame before marking it ready — a freshly-loaded, undecoded
    // image drawn via drawImage() can paint nothing in Chrome, which showed up
    // as a blank canvas until the first scroll.
    for (let i = 0; i < frameCount; i++) {
      const im = new Image();
      const markReady = () => {
        if (killed || ready[i]) return;
        ready[i] = true;
        loaded += 1;
        setLoadedPct(Math.round((loaded / frameCount) * 100));
        // Repaint if nothing is on the canvas yet, or a frame we're showing
        // (or past) just became available and can be upgraded.
        if (lastIdx < 0 || i <= lastIdx) {
          lastIdx = -1;
          paint(progress);
        }
      };
      im.onload = () => {
        if (killed) return;
        (im.decode ? im.decode() : Promise.resolve()).then(markReady, markReady);
      };
      im.src = framePath(i);
      images[i] = im;
    }

    function tick() {
      if (killed) return;
      if (target > 1 + COMMIT_MARGIN && !entered) {
        entered = true;
        raf = 0;
        onEnterRef.current();
        return;
      }
      const ct = Math.min(target, 1);
      const step = clamp((ct - progress) * EASE, -MAX_STEP, MAX_STEP);
      progress += step;
      if (Math.abs(ct - progress) < 0.0004) progress = ct;
      paint(progress);
      raf = requestAnimationFrame(tick);
    }

    const bump = (d: number) => {
      target = clamp(target + d, 0, 1 + COMMIT_MARGIN + 0.05);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      bump(clamp(e.deltaY, -WHEEL_CLAMP, WHEEL_CLAMP) * WHEEL_SENS);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? touchY;
      bump((touchY - y) * TOUCH_SENS);
      touchY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        bump(KEY_STEP);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        bump(-KEY_STEP);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    raf = requestAnimationFrame(tick);

    if (process.env.NODE_ENV !== "production") {
      (wrap as ScrubHeroEl).__scrub = (v: number) => {
        target = clamp(v, 0, 1 + COMMIT_MARGIN + 0.05);
        progress = clamp(v, 0, 1);
        lastIdx = -1;
        paint(progress);
        if (target > 1 + COMMIT_MARGIN && !entered) {
          entered = true;
          onEnterRef.current();
        }
      };
    }

    return () => {
      killed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      if (process.env.NODE_ENV !== "production") delete (wrap as ScrubHeroEl).__scrub;
      images.length = 0;
    };
  }, [frameCount, framePath]);

  return (
    <div
      ref={wrapRef}
      data-scrub-hero=""
      className={cn("absolute inset-0 select-none overflow-hidden", className)}
      style={{ background: "#171717", touchAction: "none", cursor: "ns-resize" }}
    >
      <style>{`@keyframes scrub-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}.scrub-bob{animation:scrub-bob 1.6s ease-in-out infinite}`}</style>

      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* brand treatment — DOM layers, not baked into the frames.
          Warm-dark multiply + red hue re-tint pull the purple footage onto the
          Organic Sonics red/beige/black palette; glow + counter-glow + vignette
          shape it; grain finishes it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "#2a0f09", mixBlendMode: "multiply", opacity: 0.52 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--accent-primary)", mixBlendMode: "color", opacity: 0.26 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 95% at 15% 4%, var(--accent-primary), transparent 52%)",
          mixBlendMode: "overlay",
          opacity: 0.6,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(95% 85% at 90% 98%, var(--accent-secondary), transparent 58%)",
          mixBlendMode: "soft-light",
          opacity: 0.2,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 74% 74% at 50% 47%, transparent 34%, rgba(0,0,0,0.74) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px", opacity: 0.09, mixBlendMode: "overlay" }}
      />

      {/* text beats */}
      {BEATS.map((b, i) => (
        <div
          key={i}
          data-beat
          data-start={b.start}
          data-end={b.end}
          data-mark={b.mark ? "1" : "0"}
          className="pointer-events-none absolute left-1/2 top-1/2 w-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ opacity: 0 }}
        >
          {b.h1 && (
            <h1
              className="m-0"
              style={{
                fontFamily: "var(--font-heading)",
                textTransform: "uppercase",
                letterSpacing: b.mark ? "0.07em" : "0.03em",
                lineHeight: 1.02,
                fontSize: b.mark ? "clamp(2rem, 7vw, 4rem)" : "clamp(2.1rem, 6vw, 4.2rem)",
                color: "#F8F7F2",
                textShadow: "0 6px 34px rgba(0,0,0,0.55)",
              }}
            >
              {b.h1}
            </h1>
          )}
          {b.p && (
            <p
              className="mx-0 mb-0 mt-3"
              style={{
                fontSize: "clamp(1rem, 2vw, 1.3rem)",
                color: "var(--accent-secondary)",
                textShadow: "0 2px 18px rgba(0,0,0,0.65)",
              }}
            >
              {b.p}
            </p>
          )}
        </div>
      ))}

      {/* loading bar */}
      {loadedPct < 100 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <div
            className="h-full transition-[width] duration-200 ease-out"
            style={{ width: `${loadedPct}%`, background: "var(--accent-primary)" }}
          />
        </div>
      )}

      {/* scroll / enter hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-9 flex flex-col items-center"
        style={{
          color: "var(--accent-secondary)",
          fontFamily: "var(--font-heading)",
          letterSpacing: "0.3em",
          fontSize: "0.72rem",
        }}
      >
        <span className="grid">
          <span data-hint="scroll" style={{ gridArea: "1 / 1", opacity: 1 }}>
            SCROLL
          </span>
          <span data-hint="enter" style={{ gridArea: "1 / 1", opacity: 0 }}>
            ENTER
          </span>
        </span>
        <span className="scrub-bob mt-2 block">&#8595;</span>
      </div>
    </div>
  );
}
