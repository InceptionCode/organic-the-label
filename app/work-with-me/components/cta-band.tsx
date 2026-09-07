"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/ui-components";

type CtaBandProps = {
  onCta: () => void;
};

export function CtaBand({ onCta }: CtaBandProps) {
  const reduce = useReducedMotion();

  return (
    <section className="content-container-xl section-y-standard">
      <div
        className="relative overflow-hidden px-8 py-16 text-center md:py-24"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid rgba(224,61,42,0.3)",
          background: "linear-gradient(160deg, #1E1E1E 0%, #171717 60%, #140b0a 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 50% -10%, rgba(224,61,42,0.32) 0%, transparent 62%), radial-gradient(ellipse 40% 50% at 50% 120%, rgba(212,196,168,0.10) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-6">
          <p className="eyebrow" style={{ color: "var(--accent-secondary)", letterSpacing: "0.22em" }}>
            Let&apos;s build
          </p>
          <h2
            className="text-primary"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.75rem, 8vw, 6rem)",
              letterSpacing: "0.01em",
              lineHeight: 0.92,
              textTransform: "uppercase",
            }}
          >
            Get started
            <br />
            <span style={{ color: "var(--accent-primary)" }}>today</span>
          </h2>
          <p className="text-body-m text-secondary" style={{ maxWidth: "42ch" }}>
            Bring the demo, the reference, or just the idea. We&apos;ll build the record.
          </p>
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Button size="lg" onClick={onCta} className="shadow-glow">
              Start a project
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
