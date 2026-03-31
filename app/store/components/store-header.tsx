export default function StoreHeader() {
  return (
    <div className="mb-10">
      <p
        className="eyebrow mb-3"
        style={{ color: 'var(--accent-secondary)' }}
      >
        Organic Sonics
      </p>
      <h1
        className="text-primary mb-3 leading-none"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          letterSpacing: '0.02em',
        }}
      >
        THE STORE
      </h1>
      <p className="text-body-m text-muted max-w-lg">
        Beats, kits, packs, and merchandise — everything a modern producer needs.
      </p>
    </div>
  );
}
