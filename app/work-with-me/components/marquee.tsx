"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SERVICES, SERVICES_HEADING } from "@/lib/work-with-me/content";
import { SERVICE_ICONS } from "./service-icons";

const EASE_SPRING = [0.16, 1, 0.3, 1] as const;
const ROTATE_MS = 4600;


export function Marquee() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce || SERVICES.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SERVICES.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [reduce]);

  const current = SERVICES[active];

  const cards = [...SERVICES, ...SERVICES, ...SERVICES].map((service, i) => {
    const Icon = SERVICE_ICONS[service.icon];
    return (
      <span key={`${service.title}-${i}`} className="wwm-card flex shrink-0 items-center gap-3 px-5 py-4">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]"
          style={{
            background: "var(--accent-primary-soft)",
            color: "var(--accent-primary)",
            border: "1px solid rgba(224,61,42,0.2)",
          }}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.4rem",
            letterSpacing: "0.03em",
            lineHeight: 1,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          {service.title}
        </span>
      </span>
    );
  });

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Services"
      style={{
        background:
          "linear-gradient(90deg, rgba(224,61,42,0.16) 0%, rgba(23,23,23,0) 28%, rgba(23,23,23,0) 72%, rgba(224,61,42,0.16) 100%), var(--surface-1)",
        borderTop: "1px solid rgba(224,61,42,0.28)",
        borderBottom: "1px solid rgba(224,61,42,0.28)",
      }}
    >
      <div className="content-container-xl py-8 md:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-10">
          <h2
            className="text-primary"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              letterSpacing: "0.01em",
              lineHeight: 1.02,
              textWrap: "balance",
            }}
          >
            {SERVICES_HEADING}
          </h2>

          <div aria-live="polite" className="lg:text-right">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.title}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: EASE_SPRING }}
              >
                <p
                  className="text-primary"
                  style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", letterSpacing: "0.02em" }}
                >
                  {current.title}
                </p>
                <p
                  className="text-body-s text-secondary mt-1 lg:ml-auto"
                  style={{ maxWidth: "42ch", lineHeight: 1.55 }}
                >
                  {current.blurb}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div
          aria-hidden
          className="mt-6"
          style={{
            height: "2px",
            background: "linear-gradient(90deg, var(--accent-primary), rgba(224,61,42,0.15))",
          }}
        />
      </div>

      <div className="wwm-marquee relative flex overflow-hidden select-none pb-6" role="presentation">
        <div className="wwm-marquee-track gap-4 pl-4" aria-hidden>
          {cards}
          {cards}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40"
          style={{ background: "linear-gradient(90deg, var(--surface-1) 15%, transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40"
          style={{ background: "linear-gradient(270deg, var(--surface-1) 15%, transparent)" }}
        />
      </div>
    </section>
  );
}
