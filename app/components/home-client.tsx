"use client";

import Image from 'next/image';
import {
  Button,
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-components';
import useSafeParseUser from '@/utils/hooks/use-safe-parse-user';
import { useStorage } from '@/utils/hooks/use-storage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { defaultUserState } from '@/lib/store/auth-store';
import { useTrackingReady } from '@/store/activity-hydrator';
import { STORE_CATEGORIES } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { EmailVisual } from '@/app/components/email-visual';
import { RevealSection } from '@/app/components/reveal-section';

const AuroraWaves = dynamic(() => import('@/ui-components/aurora-waves'), { ssr: false });

const MEMBERSHIP_BENEFITS = [
  'Exclusive samples & kits not in the public store',
  'Reward points on every purchase',
  'Early access to new drops & limited releases',
  'Educational videos & production tips',
  'Member-only discounts and deals',
  'Free resources, event reminders & announcements',
];

// Spring-physics easing
const EASE_SPRING = [0.16, 1, 0.3, 1] as const;

type HomeClientProps = {
  featuredSection?: React.ReactNode;
  latestDropSection?: React.ReactNode;
  statsBarSection?: React.ReactNode;
};

export default function HomeClient({
  featuredSection,
  latestDropSection,
  statsBarSection,
}: HomeClientProps) {
  const router = useRouter();
  const user = useSafeParseUser(defaultUserState);
  const isTrackingReady = useTrackingReady();

  const { setStorage, initItem: initCTAFlag } = useStorage('session', 'showSignUpCTA', {
    initMethod: 'get',
    item: 'true',
  });

  const shouldShowCTA = initCTAFlag === 'true' && (!user || user?.is_anon);
  const [dismissed, setDismissed] = useState(false);
  const open = shouldShowCTA && !dismissed;

  const onConfirm = () => {
    router.push('/signup');
    setDismissed(true);
    setStorage('session', 'showSignUpCTA', 'false');
  };

  const onClose = () => {
    setDismissed(true);
    setStorage('session', 'showSignUpCTA', 'false');
  };

  useEffect(() => {
    if (isTrackingReady) {
      trackActivity({ eventType: 'homepage_viewed' });
    }
  }, [isTrackingReady]);

  return (
    <>
      {/* ── Sign-up modal ── */}
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}
            >
              ✦
            </div>
            <DialogTitle className="text-h3">Start Free Membership</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-body-m text-black">
            Sign up and receive exclusive content, discounts, and early access from Organic Sonics.
          </DialogDescription>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" onClick={onClose}>
                Maybe later
              </Button>
            </DialogClose>
            <Button onClick={onConfirm}>Join free</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className="relative min-h-[93vh] flex items-center overflow-hidden"
        style={{ background: 'var(--bg-canvas)' }}
      >
        {/* Aurora WebGL background */}
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
        >
          <AuroraWaves speed={0.40} glow={22} resolutionScale={0.7} />
        </div>

        {/* Overlay — deeper left fade for legibility */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(to right, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.65) 50%, rgba(13,13,13,0.20) 100%)',
          }}
        />

        {/* Grain */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
          }}
        />

        <div className="relative z-10 content-container py-28 md:py-36">
          {/* Animated eyebrow with decorative lines */}
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.1 }}
          >
            <span
              style={{
                display: 'block',
                height: '1px',
                width: '32px',
                background: 'var(--accent-primary)',
                opacity: 0.8,
              }}
            />
            <p
              className="eyebrow"
              style={{ color: 'var(--accent-secondary)', letterSpacing: '0.18em' }}
            >
              Organic Sonics · Premium Producer Store
            </p>
            <span
              style={{
                display: 'block',
                height: '1px',
                width: '20px',
                background: 'var(--accent-primary)',
                opacity: 0.4,
              }}
            />
          </motion.div>

          {/* Staggered H1 */}
          <h1
            className="text-primary mb-8"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(3.5rem, 10vw, 9rem)',
              letterSpacing: '0.02em',
              lineHeight: 1.0,
              maxWidth: '16ch',
            }}
          >
            {['PREMIUM SOUNDS', 'FOR MODERN', 'PRODUCERS'].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                style={i === 1 ? { color: 'var(--accent-primary)' } : {}}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE_SPRING, delay: 0.25 + i * 0.12 }}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-body-l text-secondary max-w-lg mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.62 }}
          >
            Curated beats, kits, packs, sound banks, and resources built for serious creators.
            Elevate your sound. Express what&apos;s real —{' '}
            <strong>Organic Sonics</strong>.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_SPRING, delay: 0.76 }}
          >
            <Button asChild size="lg">
              <Link href="/store">Browse Kits</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">Join Free</Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll chevron */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.35)',
          }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} />
        </motion.div>

        {/* Animated bottom accent line */}
        <motion.div
          aria-hidden
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, ease: EASE_SPRING, delay: 0.9 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background:
              'linear-gradient(to right, transparent 0%, var(--accent-primary) 40%, var(--accent-primary) 60%, transparent 100%)',
            opacity: 0.5,
          }}
        />
      </section>

      {/* ── Stats Bar ── */}
      {statsBarSection}

      {/* ── Featured Kits ── */}
      {featuredSection && (
        <RevealSection threshold={0.08} distance={32}>
          {featuredSection}
        </RevealSection>
      )}

      {/* ── Latest Drop ── */}
      {latestDropSection && (
        <RevealSection threshold={0.08} distance={24}>
          {latestDropSection}
        </RevealSection>
      )}

      {/* ── Browse By Type ── */}
      <RevealSection threshold={0.08} distance={32}>
        <section
          className="section-y-standard"
          style={{ background: 'var(--bg-subtle)' }}
        >
          <div className="content-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="eyebrow mb-2">What we offer</p>
                <h2
                  className="text-primary"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  BROWSE BY TYPE
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link href="/store">View all →</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
              {STORE_CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.category}
                  className="flex"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, ease: EASE_SPRING, delay: i * 0.05 }}
                >
                  <Link
                    href={cat.href}
                    className="group card-glass p-6 flex flex-col gap-5 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                    }}
                  >
                    <div className="flex-1">
                      <p
                        className="text-primary mb-1"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.25rem',
                          letterSpacing: '0.025em',
                        }}
                      >
                        {cat.label}
                      </p>
                      <p className="text-body-s text-muted">{cat.description}</p>
                    </div>
                    <span
                      className="text-caption opacity-0 group-hover:opacity-100"
                      style={{
                        color: 'var(--accent-primary)',
                        transition: 'opacity var(--motion-medium) var(--ease-soft)',
                      }}
                    >
                      Browse →
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── Membership ── */}
      <RevealSection threshold={0.08} distance={32}>
        <section
          className="section-y-standard relative overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 100% 55%, rgba(224, 61, 42, 0.12) 0%, transparent 55%),
              radial-gradient(ellipse at 0% 0%, rgba(224, 61, 42, 0.06) 0%, transparent 45%),
              var(--bg-canvas)
            `,
          }}
        >
          <div className="content-container">
            <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
              <div>
                <p className="eyebrow mb-4" style={{ color: 'var(--accent-primary)' }}>
                  Membership
                </p>
                <h2
                  className="text-primary mb-6"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  MORE THAN A STORE
                </h2>
                <p className="text-body-l text-secondary mb-10">
                  Free membership gets you inside access — exclusive resources, reward
                  points, and a community of serious producers.
                </p>
                <Button
                  asChild
                  size="lg"
                  style={{
                    transition: 'box-shadow 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 0 0 1px rgba(224,61,42,0.5), 0 0 28px rgba(224,61,42,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                  }}
                >
                  <Link href="/signup">Start free — no card needed</Link>
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {MEMBERSHIP_BENEFITS.map((benefit, i) => (
                  <div
                    key={benefit}
                    className="card-glass flex items-start gap-4 px-4 py-3.5"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {/* Red number badge */}
                    <span
                      className="mt-0.5 flex-shrink-0 flex items-center justify-center font-bold"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'var(--accent-primary-soft)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.05em',
                        fontFamily: 'var(--font-heading)',
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-body-m text-secondary">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection threshold={0.08} distance={32}>
        <EmailSignupSection />
      </RevealSection>
    </>
  );
}

/* ── Email signup section ─────────────────────────────────── */
function EmailSignupSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email.'); return; }
    setSubmitted(true);
  };

  return (
    <section
      className="relative"
      style={{
        background: 'var(--bg-canvas)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBlock: '4rem',
      }}
    >
      {/* Grain on outer dark section */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px',
        }}
      />

      <div className="content-container relative z-10">
        {/* ── Beige content wrapper ── */}
        <div
          className="overflow-hidden"
          style={{
            background: '#F8F7F2',
            borderRadius: '20px',
            border: '1px solid rgba(138,114,80,0.15)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
          }}
        >
          {/* Grain on beige card */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '200px',
              borderRadius: '20px',
            }}
          />

          <div className="grid md:grid-cols-2 gap-0 items-stretch min-h-[520px]">

            {/* LEFT — form */}
            <div className="flex flex-col justify-center py-14 px-10 md:px-12">
              {/* Brand mark */}
              <div className="mb-8">
                <Image
                  src="/brand-assets/organic-sonics-logo.png"
                  alt="Organic Sonics"
                  width={72}
                  height={72}
                  className="object-contain"
                  style={{ opacity: 0.75 }}
                />
              </div>

              <p
                className="eyebrow mb-4"
                style={{ color: '#8A7250' }}
              >
                Stay in the loop
              </p>
              <h2
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  color: '#171717',
                }}
              >
                GET FREE RESOURCES
              </h2>
              <p
                className="text-body-m mb-10 max-w-sm"
                style={{ color: '#3D3730' }}
              >
                Early access to new drops, free samples, and exclusive deals — straight to
                your inbox. No spam, ever.
              </p>

              {submitted ? (
                <div
                  className="rounded-lg px-6 py-5"
                  style={{ background: 'rgba(200,53,31,0.08)', border: '1px solid rgba(200,53,31,0.3)' }}
                >
                  <p className="text-body-m font-medium" style={{ color: '#C8351F' }}>
                    You&apos;re in. Welcome to the community ✦
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
                  {error && (
                    <p className="text-body-s" style={{ color: '#C8351F' }} role="alert">
                      {error}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      aria-label="Your name"
                      className="w-full px-4 py-3 rounded-md text-body-m focus:outline-none transition-soft"
                      style={{
                        background: '#FFFFFF',
                        color: '#171717',
                        border: '1px solid rgba(23,23,23,0.14)',
                        minHeight: '44px',
                      }}
                    />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      aria-label="Email address"
                      className="w-full px-4 py-3 rounded-md text-body-m focus:outline-none transition-soft"
                      style={{
                        background: '#FFFFFF',
                        color: '#171717',
                        border: '1px solid rgba(23,23,23,0.14)',
                        minHeight: '44px',
                      }}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Sign up for free
                  </Button>
                  <p className="text-caption" style={{ color: '#7A7060' }}>
                    By signing up you agree to receive marketing emails from Organic Sonics. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>

            {/* RIGHT — 3D sound sculpture visual */}
            <div
              className="relative hidden md:block overflow-hidden"
              style={{
                borderLeft: '1px solid rgba(138,114,80,0.08)',
                background: '#070707',
              }}
            >
              <EmailVisual
                intensity={2}
                glowAmount={2}
                contourDensity={8}
                depthAmount={1.5}
                cameraIntensity={0.6}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
