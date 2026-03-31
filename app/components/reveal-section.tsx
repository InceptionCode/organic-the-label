"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type RevealSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds before animation starts (default 0) */
  delay?: number;
  /** Distance to rise from in pixels (default 28) */
  distance?: number;
  /** Fraction of element visible before triggering (default 0.12) */
  threshold?: number;
};

/**
 * Wraps children in a fade-up reveal that triggers as the section scrolls into view.
 * Automatically disables motion for users who prefer reduced motion.
 */
export function RevealSection({
  children,
  className,
  delay = 0,
  distance = 28,
  threshold = 0.12,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: distance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      // Framer-motion respects prefers-reduced-motion automatically
    >
      {children}
    </motion.div>
  );
}
