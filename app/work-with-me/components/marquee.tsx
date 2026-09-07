type MarqueeProps = {
  items: string[];
};

/**
 * Infinite horizontal ticker — the page's one piece of continuous motion.
 * Two identical tracks scroll left; the animation is a 50% translate so the
 * loop is seamless. Pauses on hover, and stops entirely under reduced motion
 * (handled in globals.css).
 */
export function Marquee({ items }: MarqueeProps) {
  const run = items.map((item, i) => (
    <span key={`${item}-${i}`} className="flex items-center">
      <span
        className="px-6"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.75rem, 4vw, 3rem)",
          letterSpacing: "0.04em",
          lineHeight: 1,
          color: "var(--accent-contrast)",
        }}
      >
        {item}
      </span>
      <span
        aria-hidden
        className="text-accent"
        style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}
      >
        ✦
      </span>
    </span>
  ));

  return (
    <div
      className="wwm-marquee relative flex overflow-hidden border-y select-none"
      style={{
        borderColor: "rgba(224,61,42,0.35)",
        background:
          "linear-gradient(90deg, rgba(224,61,42,0.16) 0%, rgba(23,23,23,0.0) 30%, rgba(23,23,23,0.0) 70%, rgba(224,61,42,0.16) 100%), var(--surface-1)",
        paddingBlock: "0.9rem",
      }}
      role="presentation"
    >
      <div className="wwm-marquee-track" aria-hidden={false}>
        {run}
      </div>
      <div className="wwm-marquee-track" aria-hidden>
        {run}
      </div>
      {/* Edge fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-32 md:w-48"
        style={{ background: "linear-gradient(90deg, var(--bg-canvas) 15%, transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-32 md:w-48"
        style={{ background: "linear-gradient(270deg, var(--bg-canvas) 15%, transparent)" }}
      />
    </div>
  );
}
