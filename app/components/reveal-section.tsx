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
  /** When true, children animate in staggered sequence */
  staggerChildren?: boolean;
  /** Stagger delay between children in seconds (default 0.04) */
  staggerDelay?: number;
};

const containerVariants = (staggerDelay: number) => ({
  hidden: {},
  visible: { transition: { staggerChildren: staggerDelay } },
});

const childVariants = (distance: number) => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
});

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
  staggerChildren = false,
  staggerDelay = 0.04,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  if (staggerChildren) {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={containerVariants(staggerDelay)}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        style={{ transitionDelay: `${delay}s` }}
      >
        {children}
      </motion.div>
    );
  }

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
    >
      {children}
    </motion.div>
  );
}

/** Used as a direct child of RevealSection when staggerChildren is true */
export function RevealItem({
  children,
  className,
  distance = 28,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  return (
    <motion.div className={className} variants={childVariants(distance)}>
      {children}
    </motion.div>
  );
}
