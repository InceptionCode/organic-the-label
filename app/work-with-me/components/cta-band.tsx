"use client";

import { Button } from "@/ui-components";

type CtaBandProps = {
  onCta: () => void;
};

export function CtaBand({ onCta }: CtaBandProps) {
  return (
    <section className="content-container section-y-standard">
      <div
        className="relative overflow-hidden px-8 py-14 text-center md:py-20"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-1)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(224,61,42,0.16) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 50% 120%, rgba(212,196,168,0.10) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-6">
          <h2
            className="text-primary"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              letterSpacing: "0.025em",
              lineHeight: 1.05,
            }}
          >
            Get started today
          </h2>
          <p className="text-body-m text-secondary" style={{ maxWidth: "44ch" }}>
            Bring the demo, the reference, or just the idea. Let&apos;s build the record.
          </p>
          <Button variant="outline" size="lg" onClick={onCta}>
            Start a project
          </Button>
        </div>
      </div>
    </section>
  );
}
