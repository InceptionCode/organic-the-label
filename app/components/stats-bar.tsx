"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

type Stat = {
  value: number;
  suffix: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 1000, suffix: "+", label: "Sounds" },
  { value: 500, suffix: "+", label: "Presets" },
  { value: 4.9, suffix: "★", label: "Rating" },
  { value: 100, suffix: "%", label: "Instant Download" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    const isDecimal = value % 1 !== 0;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parseFloat((eased * value).toFixed(isDecimal ? 1 : 0)));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {value % 1 !== 0 ? display.toFixed(1) : display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: "#111111",
        borderTop: "1px solid rgba(224,61,42,0.18)",
        borderBottom: "1px solid rgba(224,61,42,0.18)",
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      <div className="content-container py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-6 px-4 text-center relative"
              style={{
                borderRight:
                  i < STATS.length - 1
                    ? "1px solid rgba(224,61,42,0.14)"
                    : "none",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                  color: "var(--accent-primary)",
                }}
              >
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(212,196,168,0.7)",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
