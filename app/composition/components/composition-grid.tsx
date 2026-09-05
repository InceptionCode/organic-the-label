'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { CompositionListItem } from '@/lib/schemas';
import { CompositionCard } from './composition-card';

export function CompositionGrid({ compositions }: { compositions: CompositionListItem[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      {compositions.map((composition, i) => (
        <motion.div
          key={composition.id}
          id={composition.slug}
          className="scroll-mt-24"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: (i % 2) * 0.06 }}
        >
          <CompositionCard composition={composition} />
        </motion.div>
      ))}
    </div>
  );
}
