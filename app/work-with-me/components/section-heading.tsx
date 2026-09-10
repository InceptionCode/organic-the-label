"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  id?: string;
  align?: "left" | "center";
};

/**
 * Section header for the Work With Me page: eyebrow with a red tick, an
 * oversized Bebas title, and a red rule that draws in when scrolled into view.
 */
export function SectionHeading({ eyebrow, title, description, id, align = "left" }: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "flex flex-col items-center text-center" : "flex flex-col"}>
      <div className="mb-3 flex items-center gap-3">
        <span
          aria-hidden
          className="block h-2 w-2 rotate-45"
          style={{ background: "var(--accent-primary)" }}
        />
        <p className="eyebrow" style={{ color: "var(--accent-secondary)", letterSpacing: "0.2em" }}>
          {eyebrow}
        </p>
      </div>

      <h2
        id={id}
        className="text-primary"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2.25rem, 5.5vw, 3.75rem)",
          letterSpacing: "0.01em",
          lineHeight: 1.0,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>

      <motion.span
        aria-hidden
        className="mt-4 block h-[3px] origin-left"
        style={{
          width: centered ? "72px" : "96px",
          background: "linear-gradient(90deg, var(--accent-primary), rgba(224,61,42,0.12))",
        }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />

      {description && (
        <p
          className="text-body-m text-secondary mt-4"
          style={{ maxWidth: centered ? "540px" : "56ch" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
