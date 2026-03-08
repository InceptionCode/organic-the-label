'use client';

import { useState } from 'react';
import { Section } from '@/ui-components';
import { Container } from '@/ui-components';
import { cn } from '@/lib/utils';

export type FAQItem = { question: string; answer: string };

const defaultFaqs: FAQItem[] = [
  { question: 'How do I get my files after purchase?', answer: 'After checkout you’ll get instant access via Shopify Digital Downloads. You can also log in anytime to re-download.' },
  { question: 'What license do I get?', answer: 'All packs come with a single-user license for personal and commercial use. Read the license file in each pack for full terms.' },
  { question: 'Can I use these in released music?', answer: 'Yes. Our license allows use in released tracks, streams, and commercial projects.' },
];

type FAQSectionProps = {
  title?: string;
  items?: FAQItem[];
};

export function FAQSection({ title = 'FAQ', items = defaultFaqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section variant="compact">
      <Container>
        <h2 className="text-h2 text-primary mb-8">{title}</h2>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-subtle bg-surface-1 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between text-left px-4 py-4 text-body-m font-medium text-primary hover:bg-surface-2 transition-soft"
                aria-expanded={openIndex === i}
              >
                {item.question}
                <span className="text-muted shrink-0 ml-2">{openIndex === i ? '−' : '+'}</span>
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  openIndex === i ? 'max-h-96' : 'max-h-0',
                )}
              >
                <p className="px-4 pb-4 text-body-s text-secondary">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
