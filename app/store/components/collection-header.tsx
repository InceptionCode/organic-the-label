import { Section } from '@/ui-components';

export function CollectionHeader() {
  return (
    <Section variant="standard" className="pb-4 pt-0">
      <div className="content-container space-y-3">
        <p className="eyebrow text-secondary">Store</p>
        <h1 className="text-display-m md:text-display-xl">
          Pure Organic Sonics for ya head top!
        </h1>
        <h2 className='text-display-m text-muted md:text-display-l'>
          Premium tools for modern producers.
        </h2>
        <p className="text-body-m text-muted max-w-2xl">
          Curated beats, kits, and sound design for late-night sessions. Built to sound expensive
          straight out of the box.
        </p>
      </div>
    </Section>
  );
}

